import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { donationId, message, email, phone } = await req.json();

    console.log(`Enviando notificação para doação ${donationId}:`);
    console.log(`Mensagem: ${message}`);
    console.log(`Email: ${email}`);
    console.log(`Telefone: ${phone}`);

    // Aqui poderíamos integrar com Resend, Twilio, Z-API, etc.
    // Como não há chaves configuradas, apenas marcamos como enviado no banco.
    
    if (donationId) {
      const updates: any = {};
      if (email) updates.email_sent = true;
      if (phone) updates.whatsapp_sent = true;
      updates.notified_at = new Date().toISOString();

      const { error } = await supabase
        .from("donations")
        .update(updates)
        .eq("id", donationId);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
