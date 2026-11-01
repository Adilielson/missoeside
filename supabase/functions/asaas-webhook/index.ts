import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Endpoint exclusivo para notificacoes Asaas. A autenticacao nao usa JWT do Supabase:
// o segredo e validado obrigatoriamente pelo header asaas-access-token.
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function tokenMatches(received: string, expected: string): boolean {
  if (!received || !expected || received.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function asaasIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,128}$/.test(value);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Server configuration unavailable" }, 503);

    const supabase = createClient(url, serviceKey);

    // Mesma configuracao usada no painel /superadmin e na funcao create-donation.
    // O valor armazenado no banco prevalece sobre o segredo do ambiente.
    const { data: rows, error: settingsError } = await supabase
      .from("system_settings")
      .select("key,value")
      .in("key", ["ASAAS_WEBHOOK_TOKEN", "ASAAS_API_KEY", "ASAAS_ENV"]);

    if (settingsError) {
      console.error("Asaas webhook: unable to read settings", settingsError.code);
      return json({ error: "Settings unavailable" }, 503);
    }

    const settings = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    const expectedToken = String(settings.ASAAS_WEBHOOK_TOKEN || Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "");
    if (expectedToken.length < 32 || expectedToken.length > 255) {
      console.error("Asaas webhook: auth token is not configured correctly");
      return json({ error: "Webhook authentication not configured" }, 503);
    }

    if (!tokenMatches(req.headers.get("asaas-access-token") || "", expectedToken)) {
      return json({ error: "Unauthorized" }, 401);
    }

    let event: { id?: unknown; event?: unknown; payment?: { id?: unknown } };
    try {
      event = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!event || typeof event.event !== "string") {
      return json({ error: "Invalid event payload" }, 400);
    }

    // Outros recursos (assinatura, conta, etc.) podem nao conter payment.
    // Ignoramos eventos que nao alteram a confirmacao de uma doacao.
    // PAYMENT_AUTHORIZED sozinho NAO confirma uma doacao: pode exigir captura.
    const relevant = new Set([
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_RECEIVED_IN_CASH",
      "PAYMENT_REFUNDED",
      "PAYMENT_DELETED",
      "PAYMENT_OVERDUE",
      "PAYMENT_CREATED",
      "PAYMENT_UPDATED",
    ]);
    if (!relevant.has(event.event)) return json({ received: true, ignored: true });
    const paymentId = String(event.payment?.id || "");
    if (!asaasIdentifier(paymentId)) return json({ error: "Invalid payment identifier" }, 400);

    const apiKey = String(settings.ASAAS_API_KEY || Deno.env.get("ASAAS_API_KEY") || "");
    const env = String(settings.ASAAS_ENV || Deno.env.get("ASAAS_ENV") || "").toLowerCase();
    if (!apiKey || !["production", "prod", "sandbox"].includes(env)) {
      return json({ error: "Asaas API configuration unavailable" }, 503);
    }
    const baseUrl = env === "production" || env === "prod"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";

    // Confirma o estado atual diretamente no Asaas: o body do evento nao altera o banco sozinho.
    const apiResponse = await fetch(baseUrl + "/payments/" + encodeURIComponent(paymentId), {
      method: "GET",
      headers: { access_token: apiKey, "User-Agent": "IDE-Missoes/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!apiResponse.ok) {
      console.error("Asaas webhook: charge lookup failed", apiResponse.status);
      return json({ error: "Payment lookup unavailable" }, 503);
    }
    const payment = await apiResponse.json();
    if (payment.id !== paymentId) return json({ error: "Payment ID mismatch" }, 409);

    // Cobranca avulsa: asaas_id armazena pay_...
    const direct = await supabase.from("donations")
      .select("id,status,amount,type,asaas_customer,asaas_id,paid_at")
      .eq("asaas_id", paymentId)
      .maybeSingle();
    if (direct.error) throw direct.error;
    let donation = direct.data;

    // Assinatura: asaas_id armazena sub_..., enquanto eventos possuem pay_...
    // Nunca utilizar OR com a assinatura: a busca precisa ser exclusiva por identificador.
    if (!donation && asaasIdentifier(payment.subscription)) {
      const recurring = await supabase.from("donations")
        .select("id,status,amount,type,asaas_customer,asaas_id,paid_at")
        .eq("asaas_id", payment.subscription)
        .eq("type", "MONTHLY")
        .maybeSingle();
      if (recurring.error) throw recurring.error;
      donation = recurring.data;
    }
    if (!donation) {
      // A conta pode ter cobrancas de outras origens; nao bloquear a fila por elas.
      console.info("Asaas webhook: charge not linked to IDE donation", paymentId);
      return json({ received: true, ignored: true });
    }

    // A conciliacao nunca depende apenas do webhook: cliente e valor devem corresponder.
    if (payment.customer !== donation.asaas_customer ||
        !Number.isFinite(Number(payment.value)) ||
        Math.abs(Number(payment.value) - Number(donation.amount)) >= 0.01) {
      console.error("Asaas webhook: payment/customer mismatch", paymentId);
      return json({ error: "Payment does not match donation" }, 409);
    }

    const state = String(payment.status || "").toUpperCase();
    // Uma assinatura possui diversos boletos: cada pay_ fica registrado individualmente.
    const dueDate = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(payment.dueDate || "")) ? payment.dueDate : null;
    const paymentPaid = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(state);
    const { error: cycleError } = await supabase.from("asaas_payment_cycles").upsert({
      payment_id: paymentId,
      donation_id: donation.id,
      subscription_id: typeof payment.subscription === "string" ? payment.subscription : null,
      due_date: dueDate,
      amount: Number(payment.value),
      status: state,
      paid_at: paymentPaid ? (payment.paymentDate || payment.confirmedDate || new Date().toISOString()) : null,
      last_verified_at: new Date().toISOString(),
    }, { onConflict: "payment_id" });
    if (cycleError) throw cycleError;
    // O vencimento mestre só é seguro em cobrança única: mensalidade tem vários vencimentos.
    if (donation.type === "ONE_TIME" && dueDate) {
      const { error: dueErr } = await supabase.from("donations").update({ due_date: dueDate }).eq("id", donation.id);
      if (dueErr) throw dueErr;
    }
    let newStatus: "CONFIRMED" | "RECEIVED" | "CANCELLED" | "REFUNDED" | null = null;
    if (state === "CONFIRMED") newStatus = "CONFIRMED";
    else if (state === "RECEIVED" || state === "RECEIVED_IN_CASH") newStatus = "RECEIVED";
    else if (state === "REFUNDED") newStatus = "REFUNDED";
    else if (state === "DELETED") newStatus = "CANCELLED";

    // A coluna da doacao mensal resume a assinatura, nao cada boleto individual.
    // Nao cancelar/estornar toda a assinatura por um evento de uma parcela isolada.
    if (donation.type === "MONTHLY" && (newStatus === "REFUNDED" || newStatus === "CANCELLED")) {
      return json({ received: true, ignored: true });
    }
    if (!newStatus || donation.status === newStatus) return json({ received: true });

    const paid = newStatus === "CONFIRMED" || newStatus === "RECEIVED";
    const update = await supabase.from("donations")
      .update({
        status: newStatus,
        ...(paid ? { paid_at: donation.paid_at || new Date().toISOString() } : {}),
      })
      .eq("id", donation.id);
    if (update.error) throw update.error;

    console.info("Asaas webhook: donation reconciled", donation.id, newStatus);
    return json({ received: true });
  } catch (err) {
    console.error("Asaas webhook: processing failed", err instanceof Error ? err.message : "unknown");
    // Erros transitorios devem levar a nova tentativa do Asaas.
    return json({ error: "Webhook processing failed" }, 500);
  }
});
