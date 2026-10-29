import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyStatusToken } from "../_shared/donation-status-token.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" }});
}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response(null, {headers:cors});
  if(req.method!=="POST") return json({error:"Método não permitido"},405);
  let body: {donationId?:string;token?:string};
  try {body=await req.json()} catch {return json({error:"Requisição inválida"},400)}
  const id=body.donationId||"";
  if(!/^[0-9a-f-]{36}$/i.test(id)||!body.token) return json({error:"Parâmetros inválidos"},400);
  try {
    if(!await verifyStatusToken(id,body.token)) return json({error:"Não autorizado"},403);
    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data,error}=await supabase.from("donations").select("status").eq("id",id).single();
    if(error||!data) return json({error:"Doação não encontrada"},404);
    // Não retorna CPF, nome, e-mail, valores ou dados de cartão.
    return json({status:data.status});
  } catch(e){
    console.error("Falha ao consultar status de doação", (e as Error).message);
    return json({error:"Não foi possível consultar o pagamento"},503);
  }
});
