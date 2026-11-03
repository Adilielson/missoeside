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
  "UAZAPI_PHONE",
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

    // Instância já provisionada: apenas token de instância, nunca credenciais administrativas.
    if (action === "uazapi-status" || action === "uazapi-connect") {
      const { data: rows, error: settingsError } = await supabase.from("system_settings")
        .select("key,value").eq("key", "UAZAPI_TOKEN");
      if (settingsError) throw settingsError;
      const token = rows?.find((row) => row.key === "UAZAPI_TOKEN")?.value?.trim();
      if (!token) return json({ error: "Cadastre o token da instância uma única vez para habilitar o QR Code." }, 400);

      const endpoint = action === "uazapi-status" ? "/instance/status" : "/instance/connect";
      try {
        const response = await fetch("https://ipazua.uazapi.com" + endpoint, {
          method: action === "uazapi-status" ? "GET" : "POST",
          headers: { token, "Content-Type": "application/json" },
          ...(action === "uazapi-connect" ? { body: "{}" } : {}),
        });
        if (!response.ok) {
          return json({ ok: false, message: response.status === 401 || response.status === 403
            ? "Token da instância inválido ou sem permissão."
            : "Não foi possível consultar a instância (" + response.status + ")." });
        }
        const result = await response.json().catch(() => ({}));
        const instance = result.instance || result;
        const status = String(instance.status || result.status || "").toLowerCase();
        const connected = result.connected === true || instance.connected === true || status === "connected";
        const qr = instance.qrcode || result.qrcode || null;
        const qrcode = typeof qr === "string" && (qr.startsWith("data:image/") || /^[A-Za-z0-9+/=]+$/.test(qr))
          ? (qr.startsWith("data:image/") ? qr : "data:image/png;base64," + qr) : null;
        return json({ ok: true, connected, status: connected ? "connected" : status || "disconnected",
          qrcode: action === "uazapi-connect" ? qrcode : null });
      } catch {
        return json({ ok: false, message: "Não foi possível comunicar com a UazAPI. Verifique o serviço." });
      }
    }

    if (action === "logs") {
      const { data, error } = await supabase
        .from("system_keep_alive")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return json({ logs: data });
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
