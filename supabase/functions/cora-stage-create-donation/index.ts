// Cora Stage adapter. Not deployed or exposed to production checkout.
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type", "Access-Control-Allow-Methods":"POST,OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const env=(name:string)=>Deno.env.get(name)??"";
const digits=(x:unknown)=>String(x??"").replace(/\D/g,"");
const dateBR=()=>new Date(Date.now()+3*86400000).toISOString().slice(0,10);
async function coraClient(){
  if(env("CORA_ENV")!=="stage")throw new Error("Only Stage is supported by this adapter");
  const cert=env("CORA_CERT_PEM").replace(/\\n/g,"\n");
  const key=env("CORA_PRIVATE_KEY_PEM").replace(/\\n/g,"\n");
  const clientId=env("CORA_CLIENT_ID");
  if(!cert||!key||!clientId)throw new Error("Stage credentials missing");
  // Validate mTLS support on target Supabase runtime before enabling public checkout.
  const client=Deno.createHttpClient({cert,key});
  const body=new URLSearchParams({grant_type:"client_credentials",client_id:clientId});
  const response=await fetch("https://matls-clients.api.stage.cora.com.br/token",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body,client
  });
  if(!response.ok)throw new Error("Cora Stage authentication failed ("+response.status+")");
  const token=(await response.json()).access_token;
  if(!token)throw new Error("Cora Stage token absent");
  return {client,token};
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 // Fail closed until authorized Stage smoke test, abuse limits and RLS reviews are complete.
 if(env("CORA_STAGE_ENABLED")!=="true")return json({error:"Integração Cora Stage ainda não habilitada."},503);
 let payload:Record<string,unknown>;
 try{payload=await req.json();}catch{return json({error:"JSON inválido"},400)}
 const amount=Number(payload.amount);
 const method=payload.payment_method, type=payload.type;
 const doc=digits(payload.donor_cpf);
 const name=String(payload.donor_name??"").trim().slice(0,60);
 const email=String(payload.donor_email??"").trim().slice(0,60);
 if(!Number.isFinite(amount)||amount<5||amount>100000||Math.round(amount*100)!==amount*100
  || !["PIX","BOLETO"].includes(String(method)) || !["ONE_TIME","MONTHLY"].includes(String(type))
  || (type==="MONTHLY" && method!=="BOLETO")
  || ![11,14].includes(doc.length)||name.length<3||!/^\S+@\S+\.\S+$/.test(email)){
    return json({error:"Dados de cobrança inválidos ou método não permitido"},400);
 }
 try{
  const sb=createClient(env("SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"));
  const campaign=String(payload.campaign??"Geral").slice(0,120);
  let projectId=null,projectName="Geral";
  if(campaign!=="Geral"){
   const q=await sb.from("projects").select("id,name").eq("slug",campaign).eq("status","PUBLISHED").maybeSingle();
   if(!q.data)return json({error:"Projeto inválido"},400);
   projectId=q.data.id;projectName=q.data.name;
  }
  const id=crypto.randomUUID(),idem=crypto.randomUUID();
  // The current adapter does not yet create recurrence schedules. Monthly issuance
  // must remain disabled until atomic recurrence scheduling has been implemented.
  if(type==="MONTHLY")return json({error:"Recorrência em homologação: cadastro mensal ainda não liberado."},503);
  const insert=await sb.from("donations").insert({
    id,donor_name:payload.is_anonymous?"Doador Anônimo":name,donor_email:email,
    donor_phone:String(payload.donor_phone??"").slice(0,30),
    donor_cpf:doc,amount,type,payment_method:method,status:"PENDING",
    payment_provider:"cora",provider_invoice_code:id,idempotency_key:idem,
    campaign,project_id:projectId,due_date:dateBR(),is_anonymous:!!payload.is_anonymous
  });
  if(insert.error)throw new Error("Não foi possível registrar cobrança pendente");
  const {client,token}=await coraClient();
  const invoiceBody={
    code:id,
    customer:{name,email,document:{identity:doc,type:doc.length===14?"CNPJ":"CPF"}},
    services:[{name:"Doação IDE Missões",description:("Contribuição "+projectName).slice(0,100),amount:Math.round(amount*100)}],
    payment_terms:{due_date:dateBR()},
    payment_forms:method==="PIX"?["PIX"]:["BANK_SLIP","PIX"]
  };
  const response=await fetch("https://api.stage.cora.com.br/v2/invoices/",{
    method:"POST",client,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json","Idempotency-Key":idem},
    body:JSON.stringify(invoiceBody)
  });
  if(!response.ok)throw new Error("Falha na emissão da cobrança Stage ("+response.status+")");
  const invoice=await response.json();
  if(!invoice.id)throw new Error("Cora não retornou identificador da fatura");
  const upd=await sb.from("donations").update({
    provider_invoice_id:invoice.id,provider_status:invoice.status||"OPEN",
    pix_payload:invoice.pix?.emv||null,
    pix_qrcode:invoice.payment_options?.bank_slip?.url||null,
    boleto_url:invoice.payment_options?.bank_slip?.url||null
  }).eq("id",id);
  if(upd.error)throw new Error("Cobrança emitida, mas não conciliada; verificar manualmente invoice "+invoice.id);
  return json({success:true,donation:{id,status:"PENDING"},invoice_id:invoice.id,
    pix_payload:invoice.pix?.emv??null,pix_qrcode:method==="PIX"?invoice.payment_options?.bank_slip?.url??null:null,
    boleto_url:method==="BOLETO"?invoice.payment_options?.bank_slip?.url??null:null});
 }catch(e){console.error("Cora Stage adapter failure",String(e));return json({error:"Falha na integração Stage; cobrança requer verificação pelo operador."},502)}
});
