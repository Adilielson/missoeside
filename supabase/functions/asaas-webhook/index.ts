// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event, payment } = body;

    console.log(`Recebido evento Asaas: ${event} para pagamento ${payment.id}`);

    // Lista de eventos que representam sucesso/pagamento confirmado
    const successEvents = [
      "PAYMENT_RECEIVED",
      "PAYMENT_CONFIRMED",
      "PAYMENT_AUTHORIZED",
    ];

    if (successEvents.includes(event)) {
      console.log(`Confirmando doação no banco para pagamento Asaas: ${payment.id}`);
      
      const { data, error } = await supabase
        .from("donations")
        .update({ status: "CONFIRMED" })
        .eq("asaas_id", payment.id)
        .or(`asaas_id.eq.${payment.subscription}`) // Caso venha ID da assinatura
        .select();

      if (error) {
        console.error("Erro ao atualizar doação:", error);
      } else {
        console.log("Doação atualizada com sucesso:", data);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no processamento do webhook:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
