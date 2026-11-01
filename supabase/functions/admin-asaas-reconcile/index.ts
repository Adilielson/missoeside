import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Only an authenticated admin may request a bounded, read-only Asaas reconciliation.
// It never creates a payment, changes subscriptions, or sends notifications.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return respond({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return respond({ error: "Server configuration missing" }, 503);
    const auth = createClient(url, anon);
    const user = await auth.auth.getUser(jwt);
    if (user.error || !user.data.user) return respond({ error: "Unauthorized" }, 401);
    const db = createClient(url, service);
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.data.user.id).single();
    if (profile?.role !== "admin") return respond({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const offset = Number.isInteger(body.offset) && body.offset >= 0 && body.offset <= 10000 ? body.offset : 0;
    const limit = Number.isInteger(body.limit) && body.limit >= 1 && body.limit <= 25 ? body.limit : 20;
    const { data: rows, error: listErr } = await db.from("donations")
      .select("id,type,asaas_id,asaas_customer,amount,status")
      .not("asaas_id", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (listErr) throw listErr;

    const { data: settings, error: settingErr } = await db.from("system_settings")
      .select("key,value").in("key", ["ASAAS_API_KEY", "ASAAS_ENV"]);
    if (settingErr) throw settingErr;
    const config = Object.fromEntries((settings || []).map(x => [x.key, x.value]));
    const apiKey = String(config.ASAAS_API_KEY || Deno.env.get("ASAAS_API_KEY") || "");
    const env = String(config.ASAAS_ENV || Deno.env.get("ASAAS_ENV") || "").toLowerCase();
    if (!apiKey || !["production","prod","sandbox"].includes(env)) return respond({ error: "Credenciais Asaas indisponíveis" }, 503);
    const apiBase = env === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
    let verified = 0, skipped = 0, failures = 0;
    const authHeaders = { access_token: apiKey, "User-Agent": "IDE-Missoes/1.0" };

    for (const d of rows || []) {
      try {
        const subscription = d.type === "MONTHLY";
        const endpoint = subscription
          ? "/subscriptions/" + encodeURIComponent(d.asaas_id) + "/payments?limit=100"
          : "/payments/" + encodeURIComponent(d.asaas_id);
        const res = await fetch(apiBase + endpoint, { headers: authHeaders, signal: AbortSignal.timeout(10000) });
        if (!res.ok) { failures++; continue; }
        const data = await res.json();
        const charges = subscription ? (Array.isArray(data.data) ? data.data : []) : [data];
        for (const pay of charges) {
          if (typeof pay.id !== "string" || pay.customer !== d.asaas_customer
            || !Number.isFinite(Number(pay.value))
            || Math.abs(Number(pay.value) - Number(d.amount)) > 0.009) { skipped++; continue; }
          if (subscription && pay.subscription !== d.asaas_id) { skipped++; continue; }
          const state = String(pay.status || "").toUpperCase();
          const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(pay.dueDate || "")) ? pay.dueDate : null;
          const isPaid = ["CONFIRMED","RECEIVED","RECEIVED_IN_CASH"].includes(state);
          const { error: cycleErr } = await db.from("asaas_payment_cycles").upsert({
            payment_id: pay.id, donation_id: d.id, subscription_id: subscription ? d.asaas_id : null,
            due_date: dueDate, amount: Number(pay.value), status: state,
            paid_at: isPaid ? (pay.paymentDate || pay.confirmedDate || new Date().toISOString()) : null,
            last_verified_at: new Date().toISOString(),
          }, { onConflict: "payment_id" });
          if (cycleErr) throw cycleErr;
          verified++;
          if (!subscription) {
            const stateMap: Record<string,string> = {
              CONFIRMED: "CONFIRMED", RECEIVED: "RECEIVED", RECEIVED_IN_CASH:"RECEIVED",
              REFUNDED:"REFUNDED", DELETED:"CANCELLED",
            };
            const updates: Record<string,unknown> = {};
            if (dueDate) updates.due_date = dueDate;
            if (stateMap[state]) updates.status = stateMap[state];
            if (isPaid) updates.paid_at = pay.paymentDate || new Date().toISOString();
            if (Object.keys(updates).length) {
              const { error: upErr } = await db.from("donations").update(updates).eq("id",d.id);
              if (upErr) throw upErr;
            }
          }
        }
      } catch (e) {
        failures++;
        console.error("Asaas reconciliation failed for donation", d.id, e instanceof Error ? e.message : "unknown");
      }
    }
    return respond({success:true, scanned:(rows||[]).length, verified, skipped, failures, offset, next_offset:offset + (rows||[]).length});
  } catch(e) {
    console.error("Asaas reconciliation failed", e instanceof Error ? e.message : "unknown");
    return respond({error:"Falha de conciliação; verifique permissões, migração e conectividade"},500);
  }
});
