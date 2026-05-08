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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f7; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f7; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #333333; border-radius: 8px; overflow: hidden; margin-top: 20px; }
    .header-image { width: 100%; max-width: 600px; height: auto; display: block; border: 0; }
    .content { padding: 40px 30px; text-align: center; }
    .greeting { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; }
    .text { font-size: 16px; color: #51545e; margin-bottom: 30px; line-height: 1.8; }
    .amount-card { background-color: #fffaf0; border: 2px dashed #f59e0b; padding: 25px; border-radius: 12px; margin: 30px 0; }
    .amount-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #92400e; font-weight: bold; margin-bottom: 5px; }
    .amount-value { font-size: 36px; font-weight: 900; color: #d97706; }
    .project-badge { display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
    .footer { padding: 30px; text-align: center; background-color: #1a202c; color: #ffffff; }
    .footer p { margin: 5px 0; font-size: 14px; opacity: 0.8; }
    .social-links { margin-top: 20px; }
    .heart { color: #e8440c; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td>
          <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop" alt="IDE Missões" class="header-image">
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Olá, {{donor_name}}!</div>
          <div class="text">
            Recebemos com muita gratidão a sua oferta. Seu apoio é a resposta de orações e o combustível que nos permite levar esperança e auxílio para quem mais precisa através do projeto:
            <br>
            <span class="project-badge">{{project_name}}</span>
          </div>
          
          <div class="amount-card">
            <div class="amount-label">Valor da sua doação</div>
            <div class="amount-value">R$ {{amount}}</div>
          </div>
          
          <div class="text">
            "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." <br><strong>(2 Coríntios 9:7)</strong>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p><strong>IDE Missões</strong></p>
          <p>Levando o Reino até os confins da terra <span class="heart">❤</span></p>
          <p style="font-size: 11px; margin-top: 20px; opacity: 0.5;">Este é um envio automático. Não é necessário responder.</p>
        </td>
      </tr>
    </table>
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
