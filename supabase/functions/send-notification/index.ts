import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; color: #f59e0b; }
    .content { margin-bottom: 30px; }
    .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    .amount-box { background-color: #fef3c7; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Obrigado pela sua generosidade!</h2>
    </div>
    <div class="content">
      <p>Olá, <strong>{{donor_name}}</strong>!</p>
      <p>Confirmamos com alegria o recebimento da sua doação para o projeto <strong>{{project_name}}</strong>.</p>
      
      <div class="amount-box">
        <span class="amount">R$ {{amount}}</span>
      </div>
      
      <p>Sua ajuda é fundamental para que possamos continuar nossa missão. Sua contribuição faz a diferença e transforma vidas!</p>
      <p>Que Deus te abençoe ricamente.</p>
    </div>
    <div class="footer">
      <p><strong>IDE Missões</strong><br>Levando a palavra até os confins da terra.</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { donationId, email: targetEmail } = await req.json();

    if (!donationId) {
       return new Response(JSON.stringify({ error: "donationId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar doação e dados do projeto
    const { data: donation, error: fetchErr } = await supabase
      .from("donations")
      .select("*, project:projects(name, email_subject, email_template)")
      .eq("id", donationId)
      .single();

    if (fetchErr || !donation) {
      console.error("Erro ao buscar doação:", fetchErr);
      throw new Error("Doação não encontrada");
    }

    const emailTo = targetEmail || donation.donor_email;
    const projectName = donation.project?.name || donation.campaign || "Geral";
    const subject = donation.project?.email_subject || `Obrigado pela sua doação ao projeto ${projectName}!`;
    let htmlBody = donation.project?.email_template || DEFAULT_TEMPLATE;

    // 2. Substituir variáveis no template
    const formattedAmount = Number(donation.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    htmlBody = htmlBody
      .replace(/{{donor_name}}/g, donation.donor_name)
      .replace(/{{amount}}/g, formattedAmount)
      .replace(/{{project_name}}/g, projectName);

    // 3. Enviar via Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER") || "agenciaidei@gmail.com";
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPass) {
      console.log("Configurações de e-mail (GMAIL_USER/GMAIL_APP_PASSWORD) não encontradas. Email não enviado.");
      return new Response(JSON.stringify({ success: false, message: "Secrets de e-mail não configurados" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (emailTo) {
      console.log(`Enviando e-mail para ${emailTo} via Gmail SMTP...`);
      const client = new SmtpClient();
      
      try {
        await client.connectTLS({
          hostname: "smtp.gmail.com",
          port: 465,
          username: gmailUser,
          password: gmailPass,
        });

        await client.send({
          from: gmailUser,
          to: emailTo,
          subject: subject,
          content: htmlBody,
        });
        
        await client.close();
        console.log("E-mail enviado com sucesso!");

        // Marcar como enviado no banco
        await supabase
          .from("donations")
          .update({ 
            email_sent: true, 
            notified_at: new Date().toISOString() 
          })
          .eq("id", donationId);

      } catch (smtpErr) {
        console.error("Erro no envio SMTP:", smtpErr);
        throw smtpErr;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no processamento da notificação:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
