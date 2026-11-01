import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * UazAPI campaign adapter. A user must explicitly click "Enviar próximo lote".
 * This function NEVER uses a number or message supplied by the browser to send.
 * The audience, content and approval state come only from server-side records.
 * It does not send anything unless UAZAPI_CAMPAIGN_ENABLED=true on the backend.
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: Record<string, unknown>, code = 200) =>
  new Response(JSON.stringify(body), {
    status: code,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

type Campaign = {
  id: string;
  name: string;
  channel: string;
  audience: string;
  content: string;
  project_id: string | null;
  status: string;
};
type Donor = {
  donor_phone: string | null;
  donor_name: string;
  donor_marketing_consent: boolean;
  donor_marketing_consent_at: string | null;
};

function normalizedPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  const formatted = digits.length === 10 || digits.length === 11 ? "55" + digits : digits;
  return /^55[0-9]{10,11}$/.test(formatted) ? formatted : null;
}

function validatedInstanceUrl(raw: string): string {
  const parsed = new URL(raw);
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.search
    || parsed.hash || !/^[a-z0-9.-]+$/.test(hostname) || hostname === "localhost"
    || hostname.endsWith(".local") || hostname.endsWith(".internal")
    || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
    || hostname === "metadata.google.internal") {
    throw new Error("UAZAPI_URL inválida: exigido hostname público HTTPS");
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return respond({ error: "Método não permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !anonKey || !serviceKey) return respond({ error: "Backend indisponível" }, 503);

    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return respond({ error: "Não autorizado" }, 401);
    const auth = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await auth.auth.getUser(jwt);
    if (authError || !user) return respond({ error: "Não autorizado" }, 401);

    const db = createClient(supabaseUrl, serviceKey);
    const profile = await db.from("profiles").select("role").eq("id", user.id).single();
    if (profile.error || profile.data?.role !== "admin") return respond({ error: "Acesso restrito a administradores" }, 403);

    let body: { action?: unknown; campaignId?: unknown; confirmation?: unknown; phone?: unknown };
    try { body = await req.json(); } catch { return respond({ error: "JSON inválido" }, 400); }
    const action = body.action;
    if (action === "optout") {
      const phone = normalizedPhone(body.phone);
      if (!phone) return respond({ error: "Número inválido. Use DDI + DDD + número." }, 400);
      const { error } = await db.from("communication_opt_outs")
        .upsert({ phone_e164: phone, reason: "solicitado - registrado pelo administrador" }, { onConflict: "phone_e164" });
      if (error) throw error;
      return respond({ success: true, suppressed: true });
    }

    const campaignId = String(body.campaignId || "");
    if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return respond({ error: "Campanha inválida" }, 400);
    if (action !== "preview" && action !== "send") return respond({ error: "Ação inválida" }, 400);

    const found = await db.from("communication_campaigns")
      .select("id,name,channel,audience,content,project_id,status")
      .eq("id", campaignId).single();
    if (found.error || !found.data) return respond({ error: "Campanha não encontrada" }, 404);
    const campaign = found.data as Campaign;

    if (!["WHATSAPP", "MULTICHANNEL"].includes(campaign.channel)
      || !["DONORS_CONSENTED", "ALL_OPTED_IN"].includes(campaign.audience)) {
      return respond({
        error: "WhatsApp para campanhas requer doadores com consentimento. Newsletter sem telefone e cobrança operacional não são listas de marketing.",
      }, 400);
    }
    if (!campaign.content.trim() || campaign.content.length > 3500) {
      return respond({ error: "O texto da campanha deve conter de 1 a 3.500 caracteres." }, 400);
    }

    // Recuperar destinatários apenas de doações com aceite explícito recente.
    let donorQuery = db.from("donations")
      .select("donor_phone,donor_name,donor_marketing_consent,donor_marketing_consent_at")
      .eq("donor_marketing_consent", true)
      .not("donor_marketing_consent_at", "is", null)
      .not("donor_phone", "is", null)
      .order("created_at", { ascending: false }).limit(2000);
    if (campaign.project_id) donorQuery = donorQuery.eq("project_id", campaign.project_id);
    const [donorRows, optOutRows, sentRows] = await Promise.all([
      donorQuery,
      db.from("communication_opt_outs").select("phone_e164").limit(2000),
      db.from("communication_whatsapp_deliveries").select("phone_e164,status")
        .eq("campaign_id", campaignId).limit(2000),
    ]);
    if (donorRows.error) throw donorRows.error;
    if (optOutRows.error) throw optOutRows.error;
    if (sentRows.error) throw sentRows.error;
    if ((donorRows.data?.length ?? 0) >= 2000 || (optOutRows.data?.length ?? 0) >= 2000
      || (sentRows.data?.length ?? 0) >= 2000) {
      return respond({ error: "Base ultrapassa 2.000 registros. Configure paginação antes de enviar." }, 409);
    }
    const optedOut = new Set((optOutRows.data ?? []).map(x => x.phone_e164));
    const alreadyAttempted = new Set((sentRows.data ?? []).map(x => x.phone_e164));
    const eligible = new Map<string, { firstName: string }>();

    for (const person of donorRows.data as Donor[] || []) {
      const phone = normalizedPhone(person.donor_phone);
      if (!phone || optedOut.has(phone) || eligible.has(phone)) continue;
      const name = person.donor_name.trim();
      const firstName = name && name !== "Doador Anônimo" ? name.split(/\s+/)[0].slice(0, 60) : "apoiador";
      eligible.set(phone, { firstName });
    }
    const candidates = [...eligible.entries()]
      .filter(([phone]) => !alreadyAttempted.has(phone));
    const gateEnabled = Deno.env.get("UAZAPI_CAMPAIGN_ENABLED") === "true";
    const summary = {
      campaignId, eligible: eligible.size, attempted: alreadyAttempted.size,
      remaining: candidates.length,
      sendingEnabled: gateEnabled,
      batchSize: 5,
    };

    if (action === "preview") return respond({ success: true, ...summary });

    if (!gateEnabled) return respond({ error: "Envios desativados: UAZAPI_CAMPAIGN_ENABLED não está habilitado.", ...summary }, 409);
    if (campaign.status !== "READY") return respond({ error: "Marque a campanha como Pronta para revisão antes de enviar." }, 409);
    if (body.confirmation !== "CONFIRMO_ENVIO_WHATSAPP") return respond({ error: "Confirmação explícita do operador obrigatória." }, 400);
    if (!candidates.length) return respond({ success: true, ...summary, sent: 0, rejected: 0, unknown: 0 });

    // Cota operacional para reduzir riscos de disparos e banimento na API não oficial.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const used = await db.from("communication_whatsapp_deliveries")
      .select("phone_e164", { count: "exact", head: true }).gte("attempted_at", since);
    if (used.error) throw used.error;
    if ((used.count || 0) >= 40) return respond({ error: "Limite de segurança: 40 tentativas em 24 horas." }, 429);
    const quota = Math.max(0, 40 - (used.count || 0));

    const settings = await db.from("system_settings").select("key,value")
      .in("key", ["UAZAPI_URL", "UAZAPI_TOKEN"]);
    if (settings.error) throw settings.error;
    const config = Object.fromEntries((settings.data || []).map(x => [x.key, x.value]));
    const token = String(config.UAZAPI_TOKEN || "");
    if (token.length < 8) return respond({ error: "Token da UazAPI não configurado no Superadmin." }, 503);
    let baseUrl: string;
    try { baseUrl = validatedInstanceUrl(String(config.UAZAPI_URL || "")); }
    catch { return respond({ error: "URL UazAPI inválida no Superadmin" }, 503); }

    let sent = 0, rejected = 0, unknown = 0, skipped = 0;
    for (const [phone, name] of candidates.slice(0, Math.min(5, quota))) {
      // Reserva antes do POST. O índice único impede repetição da mesma campanha/número.
      const claim = await db.from("communication_whatsapp_deliveries").insert({
        campaign_id: campaignId, phone_e164: phone, status: "RESERVED",
      });
      if (claim.error) { skipped++; continue; }

      const message = campaign.content.replaceAll("{{nome}}", name.firstName).trim() +
        "\n\nPara deixar de receber mensagens da IDE, responda SAIR.";
      let status: "ACCEPTED" | "REJECTED" | "UNKNOWN" = "UNKNOWN";
      let providerMessageId: string | null = null;
      try {
        const response = await fetch(baseUrl + "/send/text", {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ number: phone, text: message }),
          signal: AbortSignal.timeout(12000),
          redirect: "error",
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && !result?.error) {
          status = "ACCEPTED"; sent++;
          const id = result?.messageid ?? result?.id ?? result?.message?.id;
          providerMessageId = typeof id === "string" ? id.slice(0, 120) : null;
        } else {
          status = "REJECTED"; rejected++;
        }
      } catch {
        // Falha de rede pode ter enviado mensagem; NÃO tentar novamente automaticamente.
        unknown++;
      }
      const save = await db.from("communication_whatsapp_deliveries").update({
        status, provider_message_id: providerMessageId, completed_at: new Date().toISOString(),
      }).eq("campaign_id", campaignId).eq("phone_e164", phone);
      if (save.error) console.error("Falha ao registrar confirmação de envio", save.error.code);
    }

    return respond({ success: true, ...summary, sent, rejected, unknown, skipped,
      note: "ACCEPTED significa aceito pelo provedor, não entrega comprovada ao destinatário." });
  } catch (error) {
    console.error("Erro no processamento da campanha WhatsApp", error instanceof Error ? error.message : "unknown");
    return respond({ error: "Não foi possível concluir a operação. Verifique permissões e migrações." }, 500);
  }
});
