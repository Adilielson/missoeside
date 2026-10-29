import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
function safeEquals(received: string, expected: string): boolean {
  if (!received || !expected || received.length !== expected.length) return false;
  let diff = 0;
  for (let i=0; i<expected.length; i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
const safeId = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{3,120}$/.test(value);

Deno.serve(async (req) => {
  if(req.method === "OPTIONS") return new Response(null, {headers:cors});
  if(req.method !== "POST") return json({error:"Método não permitido"},405);
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:settings,error:settingsErr} = await supabase
      .from("system_settings").select("key,value").in("key",["ASAAS_WEBHOOK_TOKEN","ASAAS_API_KEY","ASAAS_ENV"]);
    if(settingsErr) return json({error:"Configuração indisponível"},503);
    const cfg=Object.fromEntries((settings || []).map((x)=>[x.key,x.value]));
    const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || cfg.ASAAS_WEBHOOK_TOKEN || "";
    if(expected.length < 32) return json({error:"Webhook não configurado"},503);
    if(!safeEquals(req.headers.get("asaas-access-token") || "",expected)) return json({error:"Não autorizado"},401);

    const body = await req.json();
    const notification = body?.payment;
    const paymentId = notification?.id;
    const event = body?.event;
    if(!safeId(paymentId) || typeof event !== "string") return json({error:"Evento inválido"},400);
    const accepted = new Set(["PAYMENT_CONFIRMED","PAYMENT_RECEIVED","PAYMENT_RECEIVED_IN_CASH","PAYMENT_REFUNDED","PAYMENT_DELETED"]);
    if(!accepted.has(event)) return json({received:true});

    // A notificação nunca é suficiente para comprovar o pagamento: consultar o Asaas.
    const apiKey = Deno.env.get("ASAAS_API_KEY") || cfg.ASAAS_API_KEY || "";
    if(!apiKey) return json({error:"API não configurada"},503);
    const env=(cfg.ASAAS_ENV || Deno.env.get("ASAAS_ENV") || "sandbox").toLowerCase();
    const base=env==="production"||env==="prod" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
    const res=await fetch(base+"/payments/"+encodeURIComponent(paymentId),{headers:{access_token:apiKey}});
    if(!res.ok) return json({error:"Consulta Asaas indisponível"},503);
    const payment=await res.json();
    if(payment.id !== paymentId) return json({error:"Divergência no ID"},409);

    // A coluna asaas_id guarda o ID da cobrança única ou da assinatura mensal.
    const subscriptionId = safeId(payment.subscription) ? payment.subscription : null;
    const direct = await supabase.from("donations").select("id,amount,type,asaas_customer")
      .eq("asaas_id",paymentId).maybeSingle();
    if(direct.error) return json({error:"Falha de consulta"},500);
    let donation=direct.data;
    if(!donation && subscriptionId) {
      const monthly = await supabase.from("donations").select("id,amount,type,asaas_customer")
        .eq("asaas_id",subscriptionId).eq("type","MONTHLY").maybeSingle();
      if(monthly.error) return json({error:"Falha de consulta de mensalidade"},500);
      donation=monthly.data;
    }
    if(!donation) return json({received:true,unmatched:true});
    if(payment.customer !== donation.asaas_customer || Math.abs(Number(payment.value)-Number(donation.amount)) > 0.009) {
      return json({error:"Dados de pagamento divergentes"},409);
    }

    const state=String(payment.status || "").toUpperCase();
    const paid = ["CONFIRMED","RECEIVED","RECEIVED_IN_CASH"].includes(state);
    const reversed = ["REFUNDED","REFUND_REQUESTED","REFUND_IN_PROGRESS"].includes(state);
    const cancelled = ["DELETED","CANCELLED"].includes(state);
    if(!paid && !reversed && !cancelled) return json({received:true,status:state});
    const {error:receiptErr}=await supabase.from("asaas_payment_receipts").upsert({
      payment_id: payment.id, donation_id: donation.id, subscription_id: subscriptionId,
      status:state, amount:Number(payment.value),
      confirmed_at:paid?new Date().toISOString():null,
      updated_at:new Date().toISOString(),
    },{onConflict:"payment_id"});
    if(receiptErr) throw receiptErr;

    if(donation.type === "ONE_TIME"){
      const next = paid?"CONFIRMED":reversed?"REFUNDED":"CANCELLED";
      const {error}=await supabase.from("donations").update({
        status:next, ...(paid?{paid_at:new Date().toISOString()}:{}),
      }).eq("id",donation.id);
      if(error) throw error;
    } else if(paid) {
      // Mantém o registro mestre mensal e o ledger por cobrança para não perder meses futuros.
      const {error}=await supabase.from("donations").update({status:"CONFIRMED"})
        .eq("id",donation.id);
      if(error) throw error;
    }
    return json({received:true});
  } catch(error){
    console.error("Falha ao processar evento Asaas", (error as Error).message);
    return json({error:"Falha no processamento"},500);
  }
});
