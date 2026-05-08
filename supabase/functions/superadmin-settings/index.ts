// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-superadmin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KEYS = [
  "ASAAS_API_KEY",
  "ASAAS_ENV",
  "ASAAS_WEBHOOK_TOKEN",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "UAZAPI_URL",
  "UAZAPI_TOKEN",
  "UAZAPI_INSTANCE",
];

function mask(v: string | null | undefined) {
  if (!v) return "";
  if (v.length <= 8) return "•".repeat(v.length);
  return v.slice(0, 4) + "•".repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const password = req.headers.get("x-superadmin-password");
  const expected = Deno.env.get("SUPERADMIN_PASSWORD");
  if (!expected || password !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "list") {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key,value,updated_at")
        .in("key", KEYS);
      if (error) throw error;
      const map: Record<string, { configured: boolean; preview: string; updated_at: string | null }> = {};
      for (const k of KEYS) {
        const row = data?.find((r) => r.key === k);
        map[k] = {
          configured: !!row?.value,
          preview: mask(row?.value),
          updated_at: row?.updated_at ?? null,
        };
      }
      return json({ settings: map });
    }

    if (action === "save") {
      const { key, value } = body;
      if (!KEYS.includes(key)) return json({ error: "Invalid key" }, 400);
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "test") {
      const service = body.service as string;
      const { data: rows } = await supabase
        .from("system_settings")
        .select("key,value")
        .in("key", KEYS);
      const cfg = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));

      try {
        if (service === "asaas") {
          const env = (cfg.ASAAS_ENV || "sandbox").toLowerCase();
          const baseUrl = env === "production" || env === "prod" 
            ? "https://api.asaas.com/v3" 
            : "https://api-sandbox.asaas.com/v3";
          
          const r = await fetch(`${baseUrl}/customers?limit=1`, {
            headers: { access_token: cfg.ASAAS_API_KEY ?? "" },
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
          return json({ ok: true, message: `Conectado ao Asaas (${env}) com sucesso` });
        }
        if (service === "resend") {
          const r = await fetch("https://api.resend.com/domains", {
            headers: { Authorization: `Bearer ${cfg.RESEND_API_KEY ?? ""}` },
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
          return json({ ok: true, message: "Conectado ao Resend com sucesso" });
        }
        if (service === "uazapi") {
          const url = (cfg.UAZAPI_URL ?? "").replace(/\/$/, "");
          const r = await fetch(`${url}/instance/status`, {
            headers: { token: cfg.UAZAPI_TOKEN ?? "" },
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
          const d = await r.json().catch(() => ({}));
          return json({ ok: true, message: `UazAPI online: ${JSON.stringify(d).slice(0, 200)}` });
        }
        return json({ error: "Serviço desconhecido" }, 400);
      } catch (e) {
        return json({ ok: false, message: (e as Error).message }, 200);
      }
    }

    return json({ error: "Action inválida" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
