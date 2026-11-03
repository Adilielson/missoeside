import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Payment instructions are generated ONLY from charges verified against Asaas.
// The destination is controlled by the database (or a single fixed test phone).
// WhatsApp sends use the instance token from Superadmin, never a browser token.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const API = "https://ipazua.uazapi.com";
const TEST_PHONE = "5527981392914";
const LIMIT_BYTES = 5 * 1024 * 1024;
type Method = "PIX" | "BOLETO";
function phone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  return /^55\d{10,11}$/.test(digits) ? digits : null;
}
function asaasId(raw: unknown): raw is string {
  return typeof raw === "string" && /^pay_[A-Za-z0-9_-]{4,128}$/.test(raw);
}
function uuid(raw: unknown): raw is string {
  return typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
}
function dateBR(raw: unknown): string {
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw.split("-").reverse().join("/") : "consulte a cobrança";
}
function amountBR(raw: unknown) {
  return Number(raw).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function format(template: string, v: Record<string,string>) {
  return template.replace(/{{(nome|projeto|valor|modalidade|vencimento)}}/g, (_m, key) => v[key] || "-");
}
// Never download an arbitrary URL from the caller or another untrusted domain.
function trustedBoletoUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port ||
        u.hash || u.hostname !== "asaas.com" && !u.hostname.endsWith(".asaas.com")) return null;
    return u;
  } catch { return null; }
}
async function getBoletoPdf(bankSlipUrl: unknown): Promise<string> {
  let url = trustedBoletoUrl(bankSlipUrl);
  if (!url) throw new Error("A cobrança não disponibilizou um endereço de PDF do Asaas válido.");
  // A URL is used exclusively server-side; neither the text nor the attachment
  // sent to WhatsApp contains a payment link.
  for (let i = 0; i < 4; i++) {
    const response = await fetch(url.toString(), { method: "GET", redirect: "manual",
      signal: AbortSignal.timeout(12000), headers: { Accept: "application/pdf" } });
    if ([301,302,303,307,308].includes(response.status)) {
      url = trustedBoletoUrl(new URL(response.headers.get("location") || "", url).toString());
      if (!url) throw new Error("Redirecionamento do boleto para domínio não autorizado.");
      continue;
    }
    if (!response.ok) throw new Error("Asaas não disponibilizou o PDF do boleto.");
    if (Number(response.headers.get("content-length") || 0) > LIMIT_BYTES)
      throw new Error("PDF do boleto maior que 5 MB.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 5 || bytes.length > LIMIT_BYTES ||
        new TextDecoder().decode(bytes.slice(0,5)) !== "%PDF-")
      throw new Error("O arquivo retornado pelo Asaas não é um PDF válido.");
    // Encode in modest chunks to avoid large apply() argument lists.
    let binary = "";
    for (let j = 0; j < bytes.length; j += 8192) {
      binary += String.fromCharCode(...bytes.subarray(j, j + 8192));
    }
    return "data:application/pdf;base64," + btoa(binary);
  }
  throw new Error("Redirecionamentos excessivos para o boleto.");
}
function progressStatus(result: unknown) {
  const d = result as Record<string,any>;
  const id = d?.messageid ?? d?.id ?? d?.message?.id;
  return typeof id === "string" ? id.slice(0,120) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null,{ headers:cors });
  if (req.method !== "POST") return json({error:"Método inválido"},405);
  try {
    const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
    const role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    if(!supabaseUrl||!role||!anon) return json({error:"Supabase não configurado"},503);
    const db=createClient(supabaseUrl,role);
    const body=await req.json().catch(()=>({}));
    const action=String(body.action||"");
    const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    const internal=bearer && bearer.length===role.length && bearer===role;
    if(action==="event"){
      if(!internal) return json({error:"Não autorizado"},401);
    }else if(action==="test"){
      if(!bearer||internal) return json({error:"Sessão administrativa obrigatória"},401);
      const auth=createClient(supabaseUrl,anon);
      const user=await auth.auth.getUser(bearer);
      if(user.error||!user.data.user) return json({error:"Sessão inválida"},401);
      const profile=await db.from("profiles").select("role").eq("id",user.data.user.id).maybeSingle();
      if(profile.error||profile.data?.role!=="admin") return json({error:"Acesso restrito"},403);
      if(body.confirmation!=="CONFIRMO_TESTE_COBRANCA") return json({error:"Confirmação do teste obrigatória"},400);
    }else return json({error:"Ação inválida"},400);

    const test=action==="test";
    if(!test && Deno.env.get("IDE_WHATSAPP_AUTOMATION_ENABLED")!=="true" &&
        Deno.env.get("IDE_WHATSAPP_SANDBOX_TEST_ENABLED")!=="true")
      return json({ok:true,skipped:"Envio automático desativado"});
    if(test && !["PIX","BOLETO"].includes(body.method)) return json({error:"Escolha PIX ou Boleto"},400);

    // Tests select the most recent linked single-payment charge, but NEVER
    // use the real donor phone. A test cannot create charges or take payment.
    let donation:any;
    let paymentId:unknown=body.paymentId;
    if(test){
      const recent=await db.from("donations")
        .select("id,donor_name,donor_phone,amount,type,campaign,project_id,asaas_id,asaas_customer,donor_payment_notification_consent,donor_payment_notification_consent_at,payment_method")
        .eq("payment_method",body.method).eq("type","ONE_TIME")
        .eq("status","PENDING")
        .order("created_at",{ascending:false}).limit(25);
      if(recent.error) return json({error:"Não foi possível buscar cobranças de teste"},503);
      donation=(recent.data||[]).find((d:any)=>asaasId(d.asaas_id));
      if(!donation) return json({error:"Não há cobrança avulsa de "+body.method+" no Asaas. Crie uma doação de teste antes."},409);
      paymentId=donation.asaas_id;
    }else{
      if(!uuid(body.donationId)||!asaasId(paymentId)) return json({error:"Doação ou cobrança inválida"},400);
      const found=await db.from("donations")
        .select("id,donor_name,donor_phone,amount,type,campaign,project_id,asaas_id,asaas_customer,donor_payment_notification_consent,donor_payment_notification_consent_at,payment_method")
        .eq("id",body.donationId).maybeSingle();
      if(found.error||!found.data) return json({error:"Doação não encontrada"},404);
      donation=found.data;
      if(donation.donor_payment_notification_consent!==true||!donation.donor_payment_notification_consent_at)
        return json({ok:true,skipped:"Apoiador não autorizou mensagens"});
    }
    if(!asaasId(paymentId)) return json({error:"Cobrança Asaas inválida"},400);

    const configQuery=await db.from("system_settings").select("key,value")
      .in("key",["ASAAS_API_KEY","ASAAS_ENV","UAZAPI_TOKEN","UAZAPI_PHONE"]);
    if(configQuery.error) return json({error:"Configurações indisponíveis"},503);
    const cfg=Object.fromEntries((configQuery.data||[]).map((x:any)=>[x.key,x.value]));
    const token=String(cfg.UAZAPI_TOKEN||"");
    if(token.length<8||!phone(cfg.UAZAPI_PHONE)) return json({error:"Configure a instância e o telefone no Superadmin"},503);
    const environment=String(cfg.ASAAS_ENV||Deno.env.get("ASAAS_ENV")||"").trim().toLowerCase();
    const apiKey=String(cfg.ASAAS_API_KEY||Deno.env.get("ASAAS_API_KEY")||"");
    if(!apiKey||!["sandbox","production"].includes(environment)) return json({error:"Asaas não configurado"},503);
    if(test && environment!=="sandbox") return json({error:"O teste de cobrança está permitido somente no Asaas Sandbox. Não serão enviados códigos reais de produção."},409);
    const base=environment==="sandbox"?"https://api-sandbox.asaas.com/v3":"https://api.asaas.com/v3";
    const headers={access_token:apiKey,"User-Agent":"IDE-Missoes/1.0"};
    const payResponse=await fetch(base+"/payments/"+encodeURIComponent(paymentId),{
      headers,signal:AbortSignal.timeout(10000),redirect:"error"
    });
    if(!payResponse.ok) return json({error:"Não foi possível consultar a cobrança no Asaas"},503);
    const payment=await payResponse.json();
    if(payment.id!==paymentId || payment.customer!==donation.asaas_customer ||
       !Number.isFinite(Number(payment.value)) ||
       Math.abs(Number(payment.value)-Number(donation.amount))>=0.01 ||
       !(donation.asaas_id===paymentId ||
          (donation.type==="MONTHLY" && payment.subscription===donation.asaas_id))){
      return json({error:"A cobrança não corresponde à doação"},409);
    }
    const method=String(payment.billingType||"") as Method;
    if(method!=="PIX"&&method!=="BOLETO") return json({ok:true,skipped:"Método de pagamento não suportado"});
    if(test&&method!==body.method) return json({error:"Método da cobrança não corresponde ao teste"},409);
    if(!["PENDING","OVERDUE"].includes(String(payment.status||"").toUpperCase()))
      return json({ok:true,skipped:"Cobrança já finalizada, cancelada ou indisponível"});

    const dest=test?TEST_PHONE:phone(donation.donor_phone);
    if(!dest) return json({ok:true,skipped:"Telefone do apoiador inválido"});
    // Sandbox pilot: only the authorized number can receive automated payment notices.
    const pilot = environment==="sandbox" && dest===TEST_PHONE &&
      Deno.env.get("IDE_WHATSAPP_SANDBOX_TEST_ENABLED")==="true";
    if(!test && !pilot && Deno.env.get("IDE_WHATSAPP_AUTOMATION_ENABLED")!=="true")
      return json({ok:true,skipped:"Automação desativada para este destinatário"});
    if(!test){
      const blocked=await db.from("communication_opt_outs").select("phone_e164")
        .eq("phone_e164",dest).maybeSingle();
      if(blocked.error) return json({error:"Descadastro indisponível"},503);
      if(blocked.data) return json({ok:true,skipped:"Contato descadastrado"});
    }
    const eventType=method==="PIX"?"pix_instructions":"boleto_instructions";
    const modelResult=await db.from("whatsapp_automation_templates")
      .select("enabled,content").eq("event_type",eventType).maybeSingle();
    if(modelResult.error||!modelResult.data) return json({error:"Modelo de cobrança não implantado no Supabase"},503);
    if(!test&&!modelResult.data.enabled) return json({ok:true,skipped:"Modelo de cobrança desativado"});

    const statusResponse=await fetch(API+"/instance/status",{headers:{token},signal:AbortSignal.timeout(8000),redirect:"error"});
    if(!statusResponse.ok) return json({error:"Falha ao verificar a conexão do WhatsApp"},503);
    const state=await statusResponse.json().catch(()=>({}));
    const connected=state.connected===true||state.instance?.connected===true||
      String(state.instance?.status||state.status||"").toLowerCase()==="connected";
    if(!connected) return json({error:"WhatsApp institucional desconectado"},409);

    const projectResult=donation.project_id
      ? await db.from("projects").select("name").eq("id",donation.project_id).maybeSingle() : null;
    const vars={
      nome:donation.donor_name==="Doador Anônimo"?"apoiador":
        String(donation.donor_name||"apoiador").split(/\s+/)[0].slice(0,70),
      projeto:projectResult?.data?.name||donation.campaign||"Missões IDE",
      valor:amountBR(payment.value),
      modalidade:donation.type==="MONTHLY"?"Mensal":"Única",
      vencimento:dateBR(payment.dueDate),
    };
    let message=format(modelResult.data.content,vars).trim();
    if(test) message="[TESTE INTERNO — NÃO EFETUAR PAGAMENTO]\n\n"+message;
    // Preload the whole payment instrument before reserving a single attempt.
    // If Asaas does not return a valid PDF or Pix payload, nothing is sent.
    let payload="";
    let pdf="";
    if(method==="PIX"){
      const pix=await fetch(base+"/payments/"+encodeURIComponent(paymentId)+"/pixQrCode",{
        headers,signal:AbortSignal.timeout(10000),redirect:"error"
      });
      if(!pix.ok) return json({error:"Não foi possível obter o PIX copia e cola no Asaas"},503);
      const data=await pix.json();
      payload=String(data.payload||"").trim();
      if(!payload||payload.length>2500||/\s/.test(payload)) return json({error:"Código PIX indisponível ou inválido"},503);
    }else{
      try { pdf=await getBoletoPdf(payment.bankSlipUrl); }
      catch(e){return json({error:e instanceof Error?e.message:"Não foi possível obter PDF"},503);}
    }
    const timestamp=new Date(Date.now()-86400000).toISOString();
    const used=await db.from("whatsapp_automation_deliveries")
      .select("id",{count:"exact",head:true}).gte("attempted_at",timestamp);
    if(used.error) return json({error:"Cota diária indisponível"},503);
    if((used.count||0)>37) return json({error:"Limite diário de tentativas atingido"},429);

    async function sendOnce(suffix:string,kind:"text"|"document",text:string):Promise<string>{
      // Key includes payment identity; duplicate webhooks cannot resend.
      const eventKey=test
        ?"test-payment:"+crypto.randomUUID()+":"+suffix
        :"payment-instructions:"+paymentId+":"+suffix;
      const claim=await db.from("whatsapp_automation_deliveries").insert({
        event_key:eventKey,event_type:eventType,donation_id:donation.id,
        phone_e164:dest,status:"RESERVED"
      }).select("id").single();
      if(claim.error){
        if(claim.error.code==="23505") return "ALREADY_ATTEMPTED";
        throw new Error("Reserva de envio indisponível");
      }
      let status="UNKNOWN", id:string|null=null;
      try {
        const endpoint=kind==="text"?"/send/text":"/send/media";
        const data=kind==="text"?{number:dest,text}:
          {number:dest,type:"document",file:pdf,docName:(test?"TESTE-":"")+"Boleto-Missoes-IDE.pdf",
            mimetype:"application/pdf",text};
        const res=await fetch(API+endpoint,{
          method:"POST",headers:{"Content-Type":"application/json",token},
          body:JSON.stringify(data),signal:AbortSignal.timeout(15000),redirect:"error"
        });
        const response=await res.json().catch(()=>({}));
        if(res.ok&&!response.error){status="ACCEPTED";id=progressStatus(response);}
        else status="REJECTED";
      }catch{status="UNKNOWN";}
      const logged=await db.from("whatsapp_automation_deliveries")
        .update({status,provider_message_id:id,completed_at:new Date().toISOString()})
        .eq("id",claim.data.id);
      if(logged.error) console.error("Falha de log de cobrança WhatsApp",logged.error.code);
      return status;
    }

    let results:string[];
    if(method==="PIX"){
      const first=await sendOnce("explanation","text",message);
      if(first!=="ACCEPTED"&&first!=="ALREADY_ATTEMPTED")
        return json({ok:false,method,results:[first],message:"Não foi possível enviar as instruções; código PIX não enviado."});
      const second=await sendOnce("copy-code","text",payload);
      results=[first,second];
    }else {
      results=[await sendOnce("pdf","document",message)];
    }
    return json({ok:results.every(x=>x==="ACCEPTED"||x==="ALREADY_ATTEMPTED"),
      method,results,phone:test?TEST_PHONE:undefined,
      message:"As tentativas foram registradas. ACCEPTED indica aceite da UazAPI, não entrega ao destinatário."});
  }catch(err){
    console.error("whatsapp-payment-instructions failed",err instanceof Error?err.message:"unknown");
    return json({error:"Falha no processamento das instruções de pagamento"},500);
  }
});