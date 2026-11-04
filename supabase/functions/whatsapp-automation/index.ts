import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "Access-Control-Allow-Methods": "POST,OPTIONS" };
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const allowed = new Set(["welcome","payment_confirmed","new_subscriber","monthly_renewal","upcoming_due","payment_overdue","anniversary","project_updates","subscription_created"]);
// PIX/boleto templates are sent by whatsapp-payment-instructions, but are edited on the same admin page.
const editable = new Set([...allowed, "pix_instructions", "boleto_instructions"]);
const fixedTestPhone = "5527981392914";
function phone(raw: unknown) {
  if (typeof raw !== "string") return null;
  let n = raw.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) n = "55" + n;
  return /^55\d{10,11}$/.test(n) ? n : null;
}
const brl = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function render(template: string, vars: Record<string,string>) {
  return template.replace(/{{(nome|projeto|valor|modalidade|vencimento)}}/g, (_, key) => vars[key] || "-");
}
function safeId(id: unknown) { return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id); }

Deno.serve(async(req) => {
  if(req.method === "OPTIONS") return new Response(null, {headers:cors});
  if(req.method !== "POST") return json({error:"Método inválido"},405);
  try {
    const url=Deno.env.get("SUPABASE_URL")||"";
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    if(!url || !service || !anon) return json({error:"Configuração Supabase ausente"},503);
    const db=createClient(url,service);
    const body=await req.json().catch(()=>({}));
    const action=String(body.action||"");
    const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    const internal= bearer.length===service.length && bearer===service;
    if(action==="event") {
      if(!internal) return json({error:"Não autorizado"},401);
    } else {
      if(!bearer || internal) return json({error:"Acesso restrito ao admin autenticado"},401);
      const auth=createClient(url,anon);
      const {data: identity,error:authError}=await auth.auth.getUser(bearer);
      if(authError || !identity.user) return json({error:"Sessão inválida"},401);
      const {data:profile}=await db.from("profiles").select("role").eq("id",identity.user.id).maybeSingle();
      if(profile?.role!=="admin") return json({error:"Somente administradores"},403);
    }
    if(action==="list") {
      const [t,d]=await Promise.all([
        db.from("whatsapp_automation_templates").select("event_type,label,enabled,content").order("label"),
        db.from("whatsapp_automation_deliveries").select("event_type,status,phone_e164,attempted_at,skip_reason").order("attempted_at",{ascending:false}).limit(30)
      ]);
      if(t.error || d.error) return json({error:"Migração de automações não aplicada no Supabase"},503);
      return json({templates:t.data,deliveries:d.data,enabled:(Deno.env.get("IDE_WHATSAPP_AUTOMATION_ENABLED")||"").trim().toLowerCase()==="true",sandboxTestEnabled:(Deno.env.get("IDE_WHATSAPP_SANDBOX_TEST_ENABLED")||"").trim().toLowerCase()==="true"});
    }
    if(action==="save") {
      const type=String(body.eventType||"");
      const content=String(body.content||"").trim();
      if(!editable.has(type)||content.length<1||content.length>3500||typeof body.enabled!=="boolean") return json({error:"Modelo inválido"},400);
      const {error}=await db.from("whatsapp_automation_templates").update({
        content,enabled:body.enabled,updated_at:new Date().toISOString()
      }).eq("event_type",type);
      if(error) return json({error:"Não foi possível salvar o modelo"},503);
      return json({ok:true});
    }
    const test=action==="test";
    if(action!=="event" && !test) return json({error:"Ação não permitida"},400);
    if(test && body.confirmation!=="CONFIRMO_TESTE_WHATSAPP") return json({error:"Confirmação explícita obrigatória"},400);
    if(!test && (Deno.env.get("IDE_WHATSAPP_AUTOMATION_ENABLED")||"").trim().toLowerCase()!=="true" && (Deno.env.get("IDE_WHATSAPP_SANDBOX_TEST_ENABLED")||"").trim().toLowerCase()!=="true") return json({ok:true,skipped:"Automação desativada no servidor"});

    const type=test?"payment_confirmed":String(body.eventType||"");
    if(!allowed.has(type)) return json({error:"Evento inválido"},400);
    if(!test && type==="project_updates") return json({ok:true,skipped:"Novidades requerem aprovação editorial separada"});
    const eventKey=test?"test:"+crypto.randomUUID():String(body.eventKey||"");
    if(!test && !/^[a-z0-9:_-]{8,200}$/i.test(eventKey)) return json({error:"Chave do evento inválida"},400);
    // Registrar o motivo de eventos ignorados para diagnóstico em Automações.
    const skip=async(reason:string)=>{
      if(!test && safeId(body.donationId)) {
        const r=await db.from("whatsapp_automation_deliveries").insert({event_key:"skip:"+eventKey,event_type:type,
          donation_id:body.donationId,phone_e164:"-",status:"SKIPPED",skip_reason:reason,completed_at:new Date().toISOString()});
        if(r.error && r.error.code!=="23505") console.warn("skip log failed",r.error.code);
      }
      return json({ok:true,skipped:reason});
    };
    const {data:model,error:modelErr}=await db.from("whatsapp_automation_templates").select("enabled,content").eq("event_type",type).single();
    if(modelErr || !model) return json({error:"Modelo não encontrado"},503);
    if(!test && !model.enabled) return await skip("Modelo desativado");

    let dest=fixedTestPhone;
    let donationId: string|null=null;
    let vars={nome:"Apoiador de teste",projeto:"Projeto de teste",valor:"R$ 5,00",modalidade:"Doação única",vencimento:"—"};
    if(!test) {
      if(!safeId(body.donationId)) return json({error:"Doação inválida"},400);
      donationId=body.donationId;
      const {data:d,error:dErr}=await db.from("donations")
        .select("id,donor_name,donor_phone,amount,type,campaign,project_id,donor_marketing_consent,donor_marketing_consent_at,donor_payment_notification_consent,donor_payment_notification_consent_at,asaas_id,asaas_customer")
        .eq("id",donationId).single();
      if(dErr||!d) return json({error:"Doação não encontrada"},404);
      // Avisos financeiros precisam de consentimento transacional explícito;
      // mensagens de relacionamento exigem o aceite de marketing distinto.
      const financial = ["payment_confirmed","new_subscriber","monthly_renewal","payment_overdue","subscription_created"].includes(type);
      const consent = financial
        ? d.donor_payment_notification_consent===true && !!d.donor_payment_notification_consent_at
        : d.donor_marketing_consent===true && !!d.donor_marketing_consent_at;
      if(!consent) return await skip("Doador sem autorização para este tipo de mensagem");
      dest=phone(d.donor_phone)||"";
      if(!dest) return await skip("Telefone inválido");
      const blocked=await db.from("communication_opt_outs").select("phone_e164").eq("phone_e164",dest).maybeSingle();
      if(blocked.error) return json({error:"Não foi possível validar descadastro"},503);
      if(blocked.data) return await skip("Descadastro registrado");
      let project=d.campaign||"Missões IDE";
      if(d.project_id) {
        const p=await db.from("projects").select("name").eq("id",d.project_id).maybeSingle();
        if(p.data?.name) project=p.data.name;
      }
      vars={nome:d.donor_name==="Doador Anônimo"?"apoiador":String(d.donor_name||"apoiador").split(/\s+/)[0].slice(0,70),
        projeto:project,valor:brl(d.amount),modalidade:d.type==="MONTHLY"?"Mensal":"Única",
        vencimento:typeof body.dueDate==="string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)?body.dueDate.split("-").reverse().join("/"):"—"};
    }
    const configResult=await db.from("system_settings").select("key,value").in("key",["UAZAPI_TOKEN","UAZAPI_PHONE","ASAAS_ENV","ASAAS_API_KEY"]);
    if(configResult.error) return json({error:"Configuração UazAPI indisponível"},503);
    const config=Object.fromEntries((configResult.data||[]).map(x=>[x.key,x.value]));
    const token=String(config.UAZAPI_TOKEN||"");
    if(token.length<8 || !phone(config.UAZAPI_PHONE)) return json({error:"Configure token e telefone institucional no Superadmin"},503);
    const gate=(Deno.env.get("IDE_WHATSAPP_AUTOMATION_ENABLED")||"").trim().toLowerCase()==="true";
    const environment=String(config.ASAAS_ENV||Deno.env.get("ASAAS_ENV")||"").trim().toLowerCase();
    const pilot=environment==="sandbox" && !test && Boolean(dest) &&
      (Deno.env.get("IDE_WHATSAPP_SANDBOX_TEST_ENABLED")||"").trim().toLowerCase()==="true";
    if(!test && !gate && !pilot) return await skip("Envio desativado para este destinatário");
    if(!test && ["payment_confirmed","new_subscriber","monthly_renewal"].includes(type)) {
      // Revalidar o estado do boleto no Asaas: 'autorizado' não é pagamento.
      const paymentId=eventKey.startsWith("paid:")?eventKey.slice(5):"";
      if(!/^pay_[A-Za-z0-9_-]{4,128}$/.test(paymentId) || !donationId)
        return json({error:"Identificador de pagamento inválido"},400);
      const key=String(config.ASAAS_API_KEY||Deno.env.get("ASAAS_API_KEY")||"");
      if(!key || !["sandbox","production"].includes(environment))
        return json({error:"Asaas não configurado"},503);
      const base=environment==="sandbox"?"https://api-sandbox.asaas.com/v3":"https://api.asaas.com/v3";
      const proof=await fetch(base+"/payments/"+encodeURIComponent(paymentId),{
        headers:{access_token:key},signal:AbortSignal.timeout(10000),redirect:"error"
      });
      if(!proof.ok) return json({error:"Pagamento não pôde ser verificado no Asaas"},503);
      const verified=await proof.json();
      const donation=await db.from("donations")
        .select("amount,asaas_customer,asaas_id,type").eq("id",donationId).single();
      const matches=donation.data && verified.id===paymentId &&
        verified.customer===donation.data.asaas_customer &&
        Number.isFinite(Number(verified.value)) &&
        Math.abs(Number(verified.value)-Number(donation.data.amount))<0.01 &&
        (verified.id===donation.data.asaas_id ||
          (donation.data.type==="MONTHLY" && verified.subscription===donation.data.asaas_id));
      if(!matches || !["CONFIRMED","RECEIVED","RECEIVED_IN_CASH"].includes(String(verified.status||"").toUpperCase()))
        return await skip("Pagamento não confirmado pelo Asaas");
    }
    if(!test && type==="subscription_created") {
      // Assinatura registrada: confirmar que a assinatura existe no Asaas e pertence à doação.
      const subId=eventKey.startsWith("sub:")?eventKey.slice(4):"";
      if(!/^sub_[A-Za-z0-9_-]{4,128}$/.test(subId)) return json({error:"Identificador de assinatura inválido"},400);
      const key=String(config.ASAAS_API_KEY||Deno.env.get("ASAAS_API_KEY")||"");
      if(!key || !["sandbox","production"].includes(environment)) return json({error:"Asaas não configurado"},503);
      const base=environment==="sandbox"?"https://api-sandbox.asaas.com/v3":"https://api.asaas.com/v3";
      const proof=await fetch(base+"/subscriptions/"+encodeURIComponent(subId),{headers:{access_token:key},signal:AbortSignal.timeout(10000),redirect:"error"});
      if(!proof.ok) return json({error:"Assinatura não pôde ser verificada no Asaas"},503);
      const sub=await proof.json();
      const don=await db.from("donations").select("asaas_id,asaas_customer,type").eq("id",donationId).single();
      if(!don.data || don.data.type!=="MONTHLY" || don.data.asaas_id!==subId || sub.customer!==don.data.asaas_customer || sub.deleted===true)
        return await skip("Assinatura não confere com o Asaas");
      if(vars.vencimento==="—" && /^\d{4}-\d{2}-\d{2}$/.test(String(sub.nextDueDate||"")))
        vars.vencimento=String(sub.nextDueDate).split("-").reverse().join("/");
    }
    // Verificar a conexão real, não apenas a existência de token no banco.
    try {
      const connection = await fetch("https://ipazua.uazapi.com/instance/status", {
        headers: {token},signal:AbortSignal.timeout(8000),redirect:"error"
      });
      if (!connection.ok) return json({error:"UazAPI não confirmou status da instância"},503);
      const state = await connection.json().catch(()=>({}));
      const connected = state.connected===true || state.instance?.connected===true
        || String(state.instance?.status||state.status||"").toLowerCase()==="connected";
      if (!connected) return json({error:"WhatsApp institucional desconectado"},409);
    } catch { return json({error:"Não foi possível confirmar conexão com WhatsApp"},503); }
    // Limite global e reserva atômica antes da chamada: nunca repetir um envio incerto.
    const since=new Date(Date.now()-86400000).toISOString();
    const used=await db.from("whatsapp_automation_deliveries").select("id",{count:"exact",head:true}).neq("event_type","payment_diagnostic").gte("attempted_at",since);
    if(used.error) return json({error:"Não foi possível validar cota"},503);
    if((used.count||0)>=40) return json({error:"Limite diário de 40 tentativas atingido"},429);
    const reservation=await db.from("whatsapp_automation_deliveries").insert({
      event_key:eventKey,event_type:test?"test":type,donation_id:donationId,phone_e164:dest,status:"RESERVED"
    }).select("id").single();
    if(reservation.error) {
      if(reservation.error.code==="23505") return json({ok:true,skipped:"Evento já processado"});
      return json({error:"Reserva do envio indisponível"},503);
    }
    let status="UNKNOWN",providerMessageId:null|string=null;
    try {
      const response=await fetch("https://ipazua.uazapi.com/send/text",{
        method:"POST",headers:{"Content-Type":"application/json",token},
        body:JSON.stringify({number:dest,text:(test ? "[TESTE INTERNO — nenhum pagamento real foi realizado]\\n\\n" : "") + render(model.content,vars)}),
        redirect:"error",signal:AbortSignal.timeout(12000)
      });
      const result=await response.json().catch(()=>({}));
      if(response.ok && !result.error) {
        status="ACCEPTED";
        const id=result.messageid||result.id||result.message?.id;
        if(typeof id==="string") providerMessageId=id.slice(0,120);
      } else status="REJECTED";
    } catch { status="UNKNOWN"; }
    const saved=await db.from("whatsapp_automation_deliveries").update({
      status,provider_message_id:providerMessageId,completed_at:new Date().toISOString()
    }).eq("id",reservation.data.id);
    if(saved.error) console.error("whatsapp-automation delivery logging failed",saved.error.code);
    return json({ok:status==="ACCEPTED",status,phone:test?dest:undefined,
      message:status==="ACCEPTED"?"Aceito pela UazAPI (entrega ainda não confirmada)":
        status==="UNKNOWN"?"Resultado incerto: não reenviar automaticamente":"UazAPI rejeitou a solicitação"});
  } catch(e) {
    console.error("whatsapp-automation failed",e instanceof Error?e.message:"unknown");
    return json({error:"Erro ao processar solicitação"},500);
  }
});