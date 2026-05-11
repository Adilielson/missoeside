// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DonationPayload {
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  donor_cpf?: string;
  donor_birthdate?: string;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  payment_method: "PIX" | "CREDIT_CARD" | "BOLETO";
  card?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  campaign?: string;
  project_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read Asaas credentials from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key,value")
      .in("key", ["ASAAS_API_KEY", "ASAAS_ENV"]);

    const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
    const apiKey = settingsMap.ASAAS_API_KEY || Deno.env.get("ASAAS_API_KEY");
    const env = (settingsMap.ASAAS_ENV || Deno.env.get("ASAAS_ENV") || "sandbox").toLowerCase();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Credenciais Asaas não configuradas no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl =
      env === "production" || env === "prod"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3";

    const payload: DonationPayload = await req.json();

    // 0. Get Project ID and Name
    let projectName = payload.project_name || payload.campaign || "Geral";
    let projectId: string | null = null;
    
    if (payload.campaign) {
      const { data: proj } = await supabase
        .from("projects")
        .select("id, name")
        .eq("slug", payload.campaign)
        .single();
      if (proj) {
        projectName = proj.name;
        projectId = proj.id;
      }
    }

    // 1. Create or fetch customer
    const cpfCnpj = payload.donor_cpf?.replace(/\D/g, "");
    
    // Asaas sandbox (e às vezes produção) pode rejeitar CPFs repetidos se não for feito o tratamento de busca.
    // Primeiro tentamos buscar o cliente pelo CPF
    let customerId = null;
    if (cpfCnpj) {
      const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, {
        headers: { access_token: apiKey }
      });
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      }
    }

    if (!customerId) {
      const customerRes = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: {
          access_token: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: payload.donor_name,
          email: payload.donor_email,
          mobilePhone: payload.donor_phone?.replace(/\D/g, ""),
          cpfCnpj: cpfCnpj,
        }),
      });
      const customer = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Erro ao criar cliente Asaas:", customer);
        const errorMsg = customer.errors?.[0]?.description || "Erro ao criar cliente Asaas";
        return new Response(JSON.stringify({ error: errorMsg, details: customer }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      customerId = customer.id;
    }

    // 2. Create payment
    const customer = { id: customerId }; // Mocking for the rest of the flow
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (payload.payment_method === "BOLETO" ? 3 : 1));

    const billingType =
      payload.payment_method === "PIX"
        ? "PIX"
        : payload.payment_method === "BOLETO"
        ? "BOLETO"
        : "CREDIT_CARD";

    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType,
      value: payload.amount,
      dueDate: dueDate.toISOString().split("T")[0],
      description: `Doação IDE Missões - ${payload.donor_name}${projectName ? ` (Projeto: ${projectName})` : ""}`,
      externalReference: projectName || payload.campaign || "Geral",
    };

    if (billingType === "CREDIT_CARD" && payload.card) {
      paymentBody.creditCard = {
        holderName: payload.card.holderName,
        number: payload.card.number.replace(/\D/g, ""),
        expiryMonth: payload.card.expiryMonth,
        expiryYear: payload.card.expiryYear,
        ccv: payload.card.ccv,
      };
      paymentBody.creditCardHolderInfo = {
        name: payload.donor_name,
        email: payload.donor_email,
        cpfCnpj: payload.donor_cpf?.replace(/\D/g, ""),
        postalCode: payload.donor_postal_code?.replace(/\D/g, "") || "00000000",
        addressNumber: "0",
        phone: payload.donor_phone?.replace(/\D/g, ""),
      };
    }

    const endpoint = payload.type === "MONTHLY" ? "/subscriptions" : "/payments";
    if (payload.type === "MONTHLY") {
      paymentBody.cycle = "MONTHLY";
      paymentBody.nextDueDate = paymentBody.dueDate;
      delete paymentBody.dueDate;
    }

    console.log(`Criando ${payload.type === "MONTHLY" ? "assinatura" : "pagamento"} no Asaas...`);
    const payRes = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { access_token: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(paymentBody),
    });
    
    const payment = await payRes.json();
    if (!payRes.ok) {
      console.error("Erro ao criar pagamento/assinatura no Asaas:", payment);
      const errorMsg = payment.errors?.[0]?.description || "Erro ao criar pagamento no Asaas";
      return new Response(JSON.stringify({ error: errorMsg, details: payment }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let actualPaymentId = payment.id;

    // Se for assinatura, precisamos pegar o ID do primeiro pagamento para gerar o PIX
    if (payload.type === "MONTHLY") {
      console.log(`Buscando pagamentos da assinatura ${payment.id}...`);
      const subPaymentsRes = await fetch(`${baseUrl}/subscriptions/${payment.id}/payments`, {
        headers: { access_token: apiKey },
      });
      const subPayments = await subPaymentsRes.json();
      if (subPaymentsRes.ok && subPayments.data && subPayments.data.length > 0) {
        actualPaymentId = subPayments.data[0].id;
        console.log(`Primeiro pagamento da assinatura: ${actualPaymentId}`);
      }
    }

    // 3. Get PIX QR if applicable
    let pixQrcode: string | null = null;
    let pixPayload: string | null = null;
    let boletoUrl: string | null = null;

    if (billingType === "PIX") {
      console.log(`Buscando QR Code para pagamento ${actualPaymentId}...`);
      // Pequeno delay para garantir que o Asaas processou a cobrança (comum em sandbox)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const qrRes = await fetch(`${baseUrl}/payments/${actualPaymentId}/pixQrCode`, {
        headers: { access_token: apiKey },
      });
      
      const qrData = await qrRes.json();
      console.log("Resposta QR Code Asaas:", JSON.stringify(qrData));
      
      if (qrRes.ok) {
        pixQrcode = qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null;
        pixPayload = qrData.payload ?? null;
      } else {
        console.error("Erro ao buscar QR Code:", qrData);
        if (qrData.errors?.[0]?.code === "invalid_action") {
          return new Response(
            JSON.stringify({ 
              error: "O Asaas retornou que esta conta não pode gerar PIX no momento. Verifique se você possui uma chave PIX cadastrada no painel do Asaas (Sandbox/Produção).",
              details: qrData 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (billingType === "BOLETO") {
      boletoUrl = payment.bankSlipUrl ?? payment.invoiceUrl ?? null;
    }

    // 4. Project Name already fetched at step 0


    // 5. Save donation
    const { data: donation, error: dbError } = await supabase
      .from("donations")
      .insert({
        donor_name: payload.is_anonymous ? "Doador Anônimo" : payload.donor_name,
        is_anonymous: payload.is_anonymous || false,
        donor_email: payload.donor_email,
        donor_phone: payload.donor_phone,
        donor_cpf: payload.donor_cpf,
        amount: payload.amount,
        type: payload.type,
        payment_method: payload.payment_method,
        status: "PENDING",
        asaas_id: payment.id,
        asaas_customer: customer.id,
        asaas_link: payment.invoiceUrl ?? null,
        pix_qrcode: pixQrcode,
        pix_payload: pixPayload,
        boleto_url: boletoUrl,
        campaign: payload.campaign,
        project_id: projectId,
      })
      .select()
      .single();

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Send automatic notification (WhatsApp/Email)
    try {
      const message = `Olá ${payload.donor_name}, obrigado pela sua doação de R$ ${payload.amount.toFixed(2).replace('.', ',')} para o projeto ${projectName}. Sua ajuda transforma vidas! 💛`;
      
      await supabase.functions.invoke("send-notification", {
        body: {
          donationId: donation.id,
          message: message,
          email: payload.donor_email,
          phone: payload.donor_phone,
        }
      });
    } catch (notifErr) {
      console.error("Erro ao disparar notificação automática:", notifErr);
      // Não trava o fluxo principal se a notificação falhar
    }

    return new Response(
      JSON.stringify({
        success: true,
        donation,
        pix_qrcode: pixQrcode,
        pix_payload: pixPayload,
        boleto_url: boletoUrl,
        invoice_url: payment.invoiceUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
