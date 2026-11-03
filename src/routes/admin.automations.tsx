import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, Send, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Template = {event_type:string;label:string;enabled:boolean;content:string};
type Delivery = {event_type:string;status:string;phone_e164:string;attempted_at:string};

export const Route=createFileRoute("/admin/automations")({component:AutomationsPage});
function AutomationsPage() {
  const [items,setItems]=useState<Template[]>([]);
  const [deliveries,setDeliveries]=useState<Delivery[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [testing,setTesting]=useState(false);
  const [serverEnabled,setServerEnabled]=useState(false);
  const [error,setError]=useState("");
  async function call(action:string,other:Record<string,unknown>={}) {
    const {data,error}=await supabase.functions.invoke("whatsapp-automation",{body:{action,...other}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }
  async function load() {
    setLoading(true);setError("");
    try {
      const d=await call("list");
      setItems(d.templates||[]);setDeliveries(d.deliveries||[]);
      setServerEnabled(!!d.enabled);
    } catch(e:any){setError(e.message||"Falha ao consultar automações")}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);
  async function save(t:Template) {
    setSaving(t.event_type);
    try{await call("save",{eventType:t.event_type,content:t.content,enabled:t.enabled});toast.success("Modelo salvo")}catch(e:any){toast.error(e.message)}finally{setSaving(null)}
  }
  async function test() {
    if(!window.confirm("Enviar UMA mensagem de teste para +55 27 98139-2914?"))return;
    setTesting(true);
    try{
      const r=await call("test",{confirmation:"CONFIRMO_TESTE_WHATSAPP"});
      if(r.ok)toast.success(r.message||"Aceito pelo provedor");
      else toast.error(r.message||"Falha ou resultado incerto");
      await load();
    }catch(e:any){toast.error(e.message)}finally{setTesting(false)}
  }
  return <div className="max-w-5xl mx-auto text-white space-y-6">
    <header className="flex flex-wrap justify-between items-center gap-4">
      <div><h1 className="text-3xl font-bold">Comunicação · Automações</h1>
        <p className="text-sm text-white/55 mt-1">Mensagens por WhatsApp enviadas pela instância institucional do Superadmin.</p></div>
      <Button onClick={load} disabled={loading} className="bg-white/10 hover:bg-white/20"><RefreshCw className="w-4 h-4 mr-2"/>Atualizar</Button>
    </header>
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-bold"><ShieldCheck className="w-4 h-4"/>Segurança de envio</div>
      <p className="mt-2">O backend só envia eventos ativos quando o doador autorizou, não solicitou descadastro e o evento ainda não foi processado. O aceite do provedor não comprova entrega.</p>
      <p className="mt-2">Estado do servidor: <b>{serverEnabled?"Liberação global habilitada":"Automações globais desativadas"}</b>. Além de ativar um modelo, é preciso configurar IDE_WHATSAPP_AUTOMATION_ENABLED=true no Supabase após homologação.</p>
    </div>
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <h2 className="text-xl font-bold">Teste do WhatsApp institucional</h2>
      <p className="text-white/60 text-sm">Envia apenas para +55 27 98139-2914. Nunca utiliza o número do visitante como destinatário do teste.</p>
      <Button onClick={test} disabled={testing||loading||!!error} className="bg-[#e8440c] hover:bg-[#c93a09]">
        {testing?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<Send className="w-4 h-4 mr-2"/>}
        Enviar mensagem de teste
      </Button>
    </div>
    {error&&<div role="alert" className="rounded-lg border border-red-500/40 p-4 text-red-300">{error}. Confirme a migração e o deploy da função whatsapp-automation no Supabase.</div>}
    {loading?<div className="flex gap-2 items-center"><Loader2 className="w-5 h-5 animate-spin"/>Carregando modelos...</div>:null}
    <section className="grid gap-4">
      {items.map(t=><article key={t.event_type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <div className="flex justify-between items-center gap-4"><div><h3 className="font-bold">{t.label}</h3><p className="font-mono text-xs text-white/40">{t.event_type}</p></div>
        <label className="text-sm flex gap-2 items-center cursor-pointer"><input type="checkbox" checked={t.enabled} onChange={e=>setItems(v=>v.map(x=>x.event_type===t.event_type?{...x,enabled:e.target.checked}:x))}/>Ativa</label></div>
        <textarea rows={4} maxLength={3500} value={t.content} onChange={e=>setItems(v=>v.map(x=>x.event_type===t.event_type?{...x,content:e.target.value}:x))}
          className="w-full bg-black/30 text-white border border-white/15 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e8440c]"/>
        <div className="flex justify-between gap-3 flex-wrap text-xs text-white/45"><span>Variáveis: {"{{nome}}"}, {"{{projeto}}"}, {"{{valor}}"}, {"{{modalidade}}"}, {"{{vencimento}}"}</span>
        <Button disabled={saving===t.event_type||!t.content.trim()} onClick={()=>save(t)} className="bg-[#e8440c] hover:bg-[#c93a09]"><Save className="w-4 h-4 mr-2"/>Salvar modelo</Button></div>
      </article>)}
    </section>
    <section className="rounded-2xl border border-white/10 p-5">
      <h2 className="text-xl font-bold mb-3">Últimas tentativas</h2>
      {deliveries.length===0?<p className="text-white/50 text-sm">Nenhum envio registrado.</p>:
        <div className="space-y-2">{deliveries.map((d,i)=><div key={i} className="flex flex-wrap justify-between gap-2 border-b border-white/10 pb-2 text-sm">
          <span>{d.event_type} · {d.phone_e164.slice(0,4)+"••••"+d.phone_e164.slice(-4)}</span>
          <span>{d.status} · {new Date(d.attempted_at).toLocaleString("pt-BR")}</span></div>)}</div>}
    </section>
  </div>;
}