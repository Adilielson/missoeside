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

function flag(name: string) {
  const value=(Deno.env.get(name)||"").trim().toLowerCase();
  return {enabled:value==="true", valid:value===""||value==="true"||value==="false"};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null,{ headers:cors });
  if (req.method !== "POST") return json({error:"Método inválido"},405);
  const traceId=crypto.randomUUID();
  let stage="configuration";
  let auditDb: ReturnType<typeof createClient> | null=null;
  let auditDonation: string | null=null;
  let auditPhone="-";
  const step=(next:string,httpStatus?:number)=>{
    stage=next;
    console.info(JSON.stringify({event:"payment_worker_step",traceId,stage,httpStatus}));
  };
  const finish=async(body:Record<string,any>,status=200)=>{
    const code=body.code || (stage.toUpperCase()+ (body.skipped?"_SKIPPED":body.error||body.ok===false?"_FAILED":"_OK"));
    // Only locally authored reasons. Never persist provider bodies, phone, PDF or PIX.
    const reason=String(body.skipped||body.error||(body.ok===false?body.message:"")||"").slice(0,500);
    console.info(JSON.stringify({event:"payment_worker_result",traceId,stage,code,httpStatus:status,
      ok:body.ok===true,skipped:Boolean(body.skipped),reason,results:body.results}));
    let auditSaved: boolean | null=null;
    if(auditDb && reason){
      const logged=await auditDb.from("whatsapp_automation_deliveries").insert({
        event_key:"diagnostic:"+traceId,event_type:"payment_diagnostic",
        donation_id:auditDonation,phone_e164:auditPhone,
        status:body.skipped?"SKIPPED":"REJECTED",skip_reason:"["+code+"] "+reason,
        completed_at:new Date().toISOString(),
      }).then((r:any)=>r,()=>({error:{code:"AUDIT_NETWORK_FAILED"}}));
      auditSaved=!logged.error;
      if(logged.error) console.error(JSON.stringify({event:"payment_worker_audit_failed",traceId,stage,code:"AUDIT_STORAGE_FAILED"}));
    }
    return json({...body,traceId,stage,code,auditSaved},status);
  };
  try {
    const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
    const role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    if(!supabaseUrl||!role||!anon) return await finish({error:"Supabase não configurado"},503);
    const db=createClient(supabaseUrl,role);
    const body=await req.json().catch(()=>({}));
    const action=String(body.action||"");
    const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    const internal=bearer && bearer.length===role.length && bearer===role;
    if(action==="event"){
      if(!internal) return await finish({error:"Não autorizado"},401);
    }else if(action==="test" || action==="test_donation"){
      if(!bearer||internal) return await finish({error:"Sessão administrativa obrigatória"},401);
      const auth=createClient(supabaseUrl,anon);
      const user=await auth.auth.getUser(bearer);
      if(user.error||!user.data.user) return await finish({error:"Sessão inválida"},401);
      const profile=await db.from("profiles").select("role").eq("id",user.data.user.id).maybeSingle();
      if(profile.error||profile.data?.role!=="admin") return await finish({error:"Acesso restrito"},403);
      if(body.confirmation!==(action==="test_donation"?"CONFIRMO_TESTE_DOACAO_SANDBOX":"CONFIRMO_TESTE_COBRANCA")) return await finish({error:"Confirmação do teste obrigatória"},400);
    }else return await finish({error:"Ação inválida"},400);

    auditDb=db;
    const test=action==="test";
    const donorTest=action==="test_donation";
    step("donation_lookup");
    if(test && !["PIX","BOLETO"].includes(body.method)) return await finish({error:"Escolha PIX ou Boleto"},400);

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
      if(recent.error) return await finish({error:"Não foi possível buscar cobranças de teste"},503);
      donation=(recent.data||[]).find((d:any)=>asaasId(d.asaas_id));
      if(!donation) return await finish({error:"Não há cobrança avulsa de "+body.method+" no Asaas. Crie uma doação de teste antes."},409);
      paymentId=donation.asaas_id;
      auditDonation=donation.id;
    }else{
      if(!uuid(body.donationId)||(!donorTest&&!asaasId(paymentId))) return await finish({error:"Doação ou cobrança inválida"},400);
      const found=await db.from("donations")
        .select("id,donor_name,donor_phone,amount,type,campaign,project_id,asaas_id,asaas_customer,donor_payment_notification_consent,donor_payment_notification_consent_at,payment_method")
        .eq("id",body.donationId).maybeSingle();
      if(found.error||!found.data) return await finish({error:"Doação não encontrada"},404);
      donation=found.data;
      if(donorTest) paymentId=paymentId||donation.asaas_id;
      auditDonation=donation.id;
      auditPhone=phone(donation.donor_phone)||"-";
      step("consent");
      if(donation.donor_payment_notification_consent!==true||!donation.donor_payment_notification_consent_at)
        return await finish({ok:true,skipped:"Apoiador não autorizou mensagens"});
    }
    if(!asaasId(paymentId)) return await finish({error:"Cobrança Asaas inválida"},400);

    step("feature_flags");
    const globalFlag=flag("IDE_WHATSAPP_AUTOMATION_ENABLED");
    const sandboxFlag=flag("IDE_WHATSAPP_SANDBOX_TEST_ENABLED");
    if(!globalFlag.valid||!sandboxFlag.valid)
      return await finish({error:"Flag de WhatsApp inválida: use true ou false, sem aspas.",code:"INVALID_WHATSAPP_FLAG"},503);
    if(!test&&!globalFlag.enabled&&!sandboxFlag.enabled)
      return await finish({ok:true,skipped:"Envio automático desativado",code:"WHATSAPP_DISABLED"});
    step("settings");
    const configQuery=await db.from("system_settings").select("key,value")
      .in("key",["ASAAS_API_KEY","ASAAS_ENV","UAZAPI_TOKEN","UAZAPI_PHONE"]);
    if(configQuery.error) return await finish({error:"Configurações indisponíveis"},503);
    const cfg=Object.fromEntries((configQuery.data||[]).map((x:any)=>[x.key,x.value]));
    const token=String(cfg.UAZAPI_TOKEN||"");
    if(token.length<8||!phone(cfg.UAZAPI_PHONE)) return await finish({error:"Configure a instância e o telefone no Superadmin"},503);
    const environment=String(cfg.ASAAS_ENV||Deno.env.get("ASAAS_ENV")||"").trim().toLowerCase();
    const apiKey=String(cfg.ASAAS_API_KEY||Deno.env.get("ASAAS_API_KEY")||"");
    if(!apiKey||!["sandbox","production"].includes(environment)) return await finish({error:"Asaas não configurado"},503);
    if((test||donorTest) && environment!=="sandbox") return await finish({error:"O teste de cobrança está permitido somente no Asaas Sandbox. Não serão enviados códigos reais de produção."},409);
    if(!test && environment==="production" && !globalFlag.enabled)
      return await finish({ok:true,skipped:"Envio de produção desativado",code:"PRODUCTION_DISABLED"});
    if(donorTest && !sandboxFlag.enabled)
      return await finish({ok:true,skipped:"Teste da doação requer a flag Sandbox habilitada",code:"SANDBOX_TEST_DISABLED"});
    step("audit_schema");
    const auditSchema=await db.from("whatsapp_automation_deliveries").select("id,skip_reason").limit(0);
    if(auditSchema.error) return await finish({error:"Schema de diagnóstico indisponível; nenhum envio iniciado",code:"AUDIT_SCHEMA_NOT_READY"},503);
    step("asaas_payment");
    const base=environment==="sandbox"?"https://api-sandbox.asaas.com/v3":"https://api.asaas.com/v3";
    const headers={access_token:apiKey,"User-Agent":"IDE-Missoes/1.0"};
    const payResponse=await fetch(base+"/payments/"+encodeURIComponent(paymentId),{
      headers,signal:AbortSignal.timeout(10000),redirect:"error"
    });
    step("asaas_payment",payResponse.status);
    if(!payResponse.ok) return await finish({error:"Não foi possível consultar a cobrança no Asaas"},503);
    const payment=await payResponse.json();
    // Asaas keeps returning removed charges (deleted=true) with their old status,
    // but their boleto/PIX is no longer available.
    if(payment.deleted===true)
      return await finish({error:test
        ?"A cobrança de teste mais recente de "+body.method+" foi removida no Asaas. Crie uma nova doação de teste por "+(body.method==="BOLETO"?"boleto":"PIX")+" em /doar2 e tente novamente."
        :"Esta cobrança foi removida no Asaas"},409);
    if(payment.id!==paymentId || payment.customer!==donation.asaas_customer ||
       !Number.isFinite(Number(payment.value)) ||
       Math.abs(Number(payment.value)-Number(donation.amount))>=0.01 ||
       !(donation.asaas_id===paymentId ||
          (donation.type==="MONTHLY" && payment.subscription===donation.asaas_id))){
      return await finish({error:"A cobrança não corresponde à doação"},409);
    }
    const method=String(payment.billingType||"") as Method;
    if(method!=="PIX"&&method!=="BOLETO") return await finish({ok:true,skipped:"Método de pagamento não suportado"});
    if(test&&method!==body.method) return await finish({error:"Método da cobrança não corresponde ao teste"},409);
    if(!["PENDING","OVERDUE"].includes(String(payment.status||"").toUpperCase()))
      return await finish({ok:true,skipped:"Cobrança já finalizada, cancelada ou indisponível"});

    step("recipient");
    const dest=test?TEST_PHONE:phone(donation.donor_phone);
    auditPhone=dest||"-";
    if(!dest) return await finish({ok:true,skipped:"Telefone do apoiador inválido"});
    if(donorTest && (!phone(body.expectedPhone)||phone(body.expectedPhone)!==dest))
      return await finish({error:"Telefone autorizado não corresponde ao cadastro da doação",code:"TEST_RECIPIENT_MISMATCH"},409);
    // Sandbox pilot: each opted-in donor receives messages on their own registration phone.
    // Manual admin test actions still use the fixed admin-only test number.
    const pilot = environment==="sandbox" && !test && Boolean(dest) &&
      sandboxFlag.enabled;
    if(!test && !pilot && !globalFlag.enabled)
      return await finish({ok:true,skipped:"Automação desativada para este destinatário"});
    if(!test){
      step("opt_out");
      const blocked=await db.from("communication_opt_outs").select("phone_e164")
        .eq("phone_e164",dest).maybeSingle();
      if(blocked.error) return await finish({error:"Descadastro indisponível"},503);
      if(blocked.data) return await finish({ok:true,skipped:"Contato descadastrado"});
    }
    const eventType=method==="PIX"?"pix_instructions":"boleto_instructions";
    step("template");
    const modelResult=await db.from("whatsapp_automation_templates")
      .select("enabled,content").eq("event_type",eventType).maybeSingle();
    if(modelResult.error||!modelResult.data) return await finish({error:"Modelo de cobrança não implantado no Supabase"},503);
    if(!test&&!modelResult.data.enabled) return await finish({ok:true,skipped:"Modelo de cobrança desativado"});

    step("uazapi_instance");
    const statusResponse=await fetch(API+"/instance/status",{headers:{token},signal:AbortSignal.timeout(8000),redirect:"error"});
    step("uazapi_instance",statusResponse.status);
    if(!statusResponse.ok) return await finish({error:"Falha ao verificar a conexão do WhatsApp"},503);
    const state=await statusResponse.json().catch(()=>({}));
    const connected=state.connected===true||state.instance?.connected===true||
      String(state.instance?.status||state.status||"").toLowerCase()==="connected";
    if(!connected) return await finish({error:"WhatsApp institucional desconectado"},409);

    step("project");
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
    if(test||donorTest) message="[TESTE INTERNO — NÃO EFETUAR PAGAMENTO]\n\n"+message;
    // Preload the whole payment instrument before reserving a single attempt.
    // If Asaas does not return a valid PDF or Pix payload, nothing is sent.
    let payload="";
    let pdf="";
    if(method==="PIX"){
      step("asaas_pix");
      const pix=await fetch(base+"/payments/"+encodeURIComponent(paymentId)+"/pixQrCode",{
        headers,signal:AbortSignal.timeout(10000),redirect:"error"
      });
      step("asaas_pix",pix.status);
      if(!pix.ok) return await finish({error:"Não foi possível obter o PIX copia e cola no Asaas"},503);
      const data=await pix.json();
      payload=String(data.payload||"").trim();
      if(!payload||payload.length>2500||/\s/.test(payload)) return await finish({error:"Código PIX indisponível ou inválido"},503);
    }else{
      step("asaas_pdf");
      try { pdf=await getBoletoPdf(payment.bankSlipUrl); }
      catch(e){return await finish({error:e instanceof Error?e.message:"Não foi possível obter PDF"},503);}
    }
    step("quota");
    const timestamp=new Date(Date.now()-86400000).toISOString();
    const used=await db.from("whatsapp_automation_deliveries")
      .select("id",{count:"exact",head:true}).neq("event_type","payment_diagnostic").gte("attempted_at",timestamp);
    if(used.error) return await finish({error:"Cota diária indisponível"},503);
    if((used.count||0)>37) return await finish({error:"Limite diário de tentativas atingido"},429);

    async function sendOnce(suffix:string,kind:"text"|"document",text:string):Promise<string>{
      // Key includes payment identity; duplicate webhooks cannot resend.
      const eventKey=test
        ?"test-payment:"+crypto.randomUUID()+":"+suffix
        :"payment-instructions:"+paymentId+":"+suffix;
      step("reserve_"+suffix);
      const claim=await db.from("whatsapp_automation_deliveries").insert({
        event_key:eventKey,event_type:eventType,donation_id:donation.id,
        phone_e164:dest,status:"RESERVED"
      }).select("id").single();
      if(claim.error){
        if(claim.error.code==="23505") {
          const previous=await db.from("whatsapp_automation_deliveries").select("status")
            .eq("event_key",eventKey).maybeSingle();
          return !previous.error&&previous.data?.status==="ACCEPTED"?"ALREADY_ACCEPTED":"BLOCKED_PREVIOUS_ATTEMPT";
        }
        throw new Error("Reserva de envio indisponível");
      }
      let status="UNKNOWN", id:string|null=null, sendReason="UAZAPI_RESULT_UNKNOWN";
      step("send_"+suffix);
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
        step("send_"+suffix,res.status);
        if(res.ok&&!response.error&&progressStatus(response)){status="ACCEPTED";id=progressStatus(response);sendReason="";}
        else if(res.ok&&!response.error) sendReason="UAZAPI_MESSAGE_ID_MISSING";
        else {status="REJECTED";sendReason="UAZAPI_REJECTED_HTTP_"+res.status; }
      }catch{status="UNKNOWN";sendReason="UAZAPI_NETWORK_RESULT_UNKNOWN";}
      const logged=await db.from("whatsapp_automation_deliveries")
        .update({status,skip_reason:sendReason||null,provider_message_id:id,completed_at:new Date().toISOString()})
        .eq("id",claim.data.id);
      if(logged.error) {step("delivery_audit"); return "AUDIT_FAILED";}
      return status;
    }

    let results:string[];
    if(method==="PIX"){
      const first=await sendOnce("explanation","text",message);
      if(first!=="ACCEPTED"&&first!=="ALREADY_ACCEPTED")
        return await finish({ok:false,method,results:[first],message:"Não foi possível enviar as instruções; código PIX não enviado."});
      const second=await sendOnce("copy-code","text",payload);
      results=[first,second];
    }else {
      results=[await sendOnce("pdf","document",message)];
    }
    return await finish({ok:results.every(x=>x==="ACCEPTED"||x==="ALREADY_ACCEPTED"),
      method,results,phone:test?TEST_PHONE:undefined,
      message:"As tentativas foram registradas. ACCEPTED indica aceite da UazAPI, não entrega ao destinatário."});
  }catch(err){
    console.error(JSON.stringify({event:"payment_worker_exception",traceId,stage,code:"STEP_EXCEPTION"}));
    return await finish({error:"Falha na etapa "+stage+". Consulte o diagnóstico pelo traceId.",code:"STEP_EXCEPTION"},503);
  }
});