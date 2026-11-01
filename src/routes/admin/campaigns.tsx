import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Archive, CheckCircle2, ClipboardCopy, FilePenLine,
  Loader2, Mail, Megaphone, MessageCircle, Plus, RefreshCw, Save, ShieldCheck,
  Target, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/campaigns")({component: CampaignsPage});

type Channel = "EMAIL" | "WHATSAPP" | "NEWSLETTER" | "MULTICHANNEL";
type Audience = "NEWSLETTER" | "DONORS_CONSENTED" | "PENDING_DONORS" | "ALL_OPTED_IN";
type Campaign = {
  id: string; name: string; objective: string; channel: Channel; audience: Audience;
  subject: string; content: string; project_id: string | null;
  status: "DRAFT" | "READY" | "ARCHIVED"; created_at: string;
};
type Project = {id:string;name:string};
const channelNames:Record<Channel,string>={
  EMAIL:"E-mail",WHATSAPP:"WhatsApp",NEWSLETTER:"Newsletter",MULTICHANNEL:"Multicanal",
};
const audienceNames:Record<Audience,string>={
  NEWSLETTER:"Inscritos na newsletter",
  DONORS_CONSENTED:"Doadores que autorizaram comunicações",
  PENDING_DONORS:"Pagamentos pendentes — contato individual",
  ALL_OPTED_IN:"Inscritos e doadores com consentimento",
};
const defaultForm={
  name:"", objective:"",channel:"EMAIL" as Channel,audience:"NEWSLETTER" as Audience,
  subject:"",content:"",project_id:"" as string,status:"DRAFT" as "DRAFT" | "READY" | "ARCHIVED",
};
const templates=[
  {title:"Boletim de impacto",objective:"Mostrar resultados e transparência das contribuições",channel:"NEWSLETTER" as Channel,audience:"NEWSLETTER" as Audience,
   subject:"O impacto das missões IDE neste mês",content:"Olá! Veja as ações realizadas, os projetos apoiados e os próximos passos da IDE.\n\n[Resumo dos resultados]\n[História ou depoimento autorizado]\n[Link para acompanhar a missão]\n\nVocê recebe esta comunicação porque se inscreveu em nossa newsletter. Inclua opção de descadastro antes do envio."},
  {title:"Atualização de projeto",objective:"Compartilhar resultados de uma missão específica",channel:"EMAIL" as Channel,audience:"DONORS_CONSENTED" as Audience,
   subject:"Novidades sobre o projeto que você apoia",content:"Olá! Temos novidades sobre o projeto que você escolheu apoiar.\n\n[Resultado alcançado]\n[Próxima etapa]\n[Prestação de contas]\n\nEsta mensagem é destinada apenas aos contatos que autorizaram atualizações."},
  {title:"Convite para evento",objective:"Convidar apoiadores para encontro ou ação missionária",channel:"WHATSAPP" as Channel,audience:"DONORS_CONSENTED" as Audience,
   subject:"Convite IDE Missões",content:"Olá! A IDE está organizando um encontro especial.\n\n[Data e horário]\n[Local/Link]\n[Como participar]\n\nEnvie apenas a contatos com autorização adequada para WhatsApp."},
  {title:"Regularização de contribuição",objective:"Orientar individualmente sobre uma cobrança vencida",channel:"EMAIL" as Channel,audience:"PENDING_DONORS" as Audience,
   subject:"Informações sobre sua contribuição IDE",content:"Olá! Identificamos uma cobrança de contribuição que ainda consta como pendente.\n\nSe já realizou o pagamento, por favor desconsidere esta mensagem. Caso precise, podemos encaminhar os dados da cobrança.\n\n[Canal de atendimento da IDE]\n\nConferir status atualizado no Asaas antes de cada contato. Não enviar em massa."},
];
function CampaignsPage(){
  const [authorized,setAuthorized]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [form,setForm]=useState({...defaultForm});
  const [editing,setEditing]=useState(false);

  async function load(){
    setLoading(true);setError("");
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Entre como administrador para acessar campanhas.");
      const p=await supabase.from("profiles").select("role").eq("id",user.id).single();
      if(p.error||p.data?.role!=="admin") throw new Error("Acesso exclusivo para administradores.");
      setAuthorized(true);
      const db=supabase as any;
      const [campaignResult,projectResult]=await Promise.all([
        db.from("communication_campaigns").select("id,name,objective,channel,audience,subject,content,project_id,status,created_at").order("created_at",{ascending:false}).limit(200),
        supabase.from("projects").select("id,name").eq("status","PUBLISHED").order("name"),
      ]);
      if(campaignResult.error)throw campaignResult.error;
      if(projectResult.error)throw projectResult.error;
      setCampaigns((campaignResult.data??[]) as Campaign[]);
      setProjects((projectResult.data??[]) as Project[]);
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar campanhas. A migração pode estar pendente.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);

  const stats=useMemo(()=>({
    total:campaigns.length, drafts:campaigns.filter(c=>c.status==="DRAFT").length,
    ready:campaigns.filter(c=>c.status==="READY").length, archived:campaigns.filter(c=>c.status==="ARCHIVED").length,
  }),[campaigns]);

  function newCampaign(){
    setSelectedId(null);setForm({...defaultForm});setEditing(true);
  }
  function open(c:Campaign){
    setSelectedId(c.id);setForm({
      name:c.name,objective:c.objective,channel:c.channel,audience:c.audience,
      subject:c.subject,content:c.content,project_id:c.project_id||"",status:c.status,
    });setEditing(true);
  }
  function applyTemplate(t:(typeof templates)[number]){
    setSelectedId(null);setForm({
      ...defaultForm,name:t.title,objective:t.objective,channel:t.channel,
      audience:t.audience,subject:t.subject,content:t.content,
    });setEditing(true);
  }
  async function save(){
    if(saving)return;
    if(form.name.trim().length<3||form.objective.trim().length<3||form.content.trim().length<10){
      toast.error("Preencha nome, objetivo e texto da campanha.");return;
    }
    if(["EMAIL","NEWSLETTER","MULTICHANNEL"].includes(form.channel)&&!form.subject.trim()){
      toast.error("Informe um assunto para as mensagens de e-mail.");return;
    }
    setSaving(true);
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error("Sessão expirada.");
      const db=supabase as any;
      const payload={
        name:form.name.trim(),objective:form.objective.trim(),channel:form.channel,
        audience:form.audience,subject:form.subject.trim(),content:form.content.trim(),
        project_id:form.project_id||null,status:form.status,
      };
      const r=selectedId
        ? await db.from("communication_campaigns").update(payload).eq("id",selectedId)
        : await db.from("communication_campaigns").insert({...payload,created_by:user.id});
      if(r.error)throw r.error;
      toast.success("Campanha salva. Nenhuma mensagem foi enviada.");
      setEditing(false);await load();
    }catch(e){toast.error(e instanceof Error?e.message:"Erro ao salvar");}
    finally{setSaving(false);}
  }
  async function archive(c:Campaign){
    if(!confirm("Arquivar esta campanha? Nenhuma mensagem será enviada."))return;
    const db=supabase as any;
    const r=await db.from("communication_campaigns").update({status:"ARCHIVED"}).eq("id",c.id);
    if(r.error){toast.error(r.error.message);return;}
    toast.success("Campanha arquivada.");await load();
  }
  function copy(){
    if(!form.content.trim())return;
    void navigator.clipboard.writeText(form.content).then(()=>toast.success("Texto copiado. Revise consentimento antes de usar."))
      .catch(()=>toast.error("Não foi possível copiar."));
  }

  return <div className="space-y-7 text-white">
    <div className="flex flex-wrap gap-4 justify-between items-center">
      <div>
        <div className="flex items-center gap-2 text-[#f47b48] text-xs font-bold tracking-[.2em] uppercase"><Megaphone className="w-4 h-4"/> Relacionamento</div>
        <h1 className="text-3xl font-black mt-1">Campanhas IDE</h1>
        <p className="text-white/50 text-sm mt-1">Planeje comunicações por e-mail, WhatsApp, newsletter e jornadas de relacionamento.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>void load()} className="border border-white/15 rounded-lg px-3 py-2 flex gap-2 items-center text-sm"><RefreshCw className="w-4 h-4"/> Atualizar</button>
        <button onClick={newCampaign} disabled={!authorized||!!error} className="bg-[#e8440c] disabled:opacity-40 rounded-lg px-4 py-2 flex gap-2 items-center font-semibold text-sm"><Plus className="w-4 h-4"/> Nova campanha</button>
      </div>
    </div>
    {error&&<p role="alert" className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Metric label="Campanhas criadas" value={stats.total} icon={Megaphone}/>
      <Metric label="Rascunhos" value={stats.drafts} icon={FilePenLine}/>
      <Metric label="Prontas para revisão" value={stats.ready} icon={CheckCircle2}/>
      <Metric label="Arquivadas" value={stats.archived} icon={Archive}/>
    </div>
    <div className="rounded-xl p-4 border border-sky-500/20 bg-sky-500/5 flex gap-3 text-sm">
      <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0 mt-0.5"/>
      <div><strong>Etapa atual: planejamento, segmentação e revisão.</strong>
        <p className="text-white/60 mt-1">Esta área salva campanhas, mas não faz disparos automáticos. Para ativar envios, é necessário configurar provedor, consentimento por canal, descadastro, templates de WhatsApp aprovados e registro de entregas. Não transformar dados de doações em lista promocional sem autorização.</p>
      </div>
    </div>
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Comece por um objetivo</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {templates.map(t=><button key={t.title} onClick={()=>applyTemplate(t)} disabled={!authorized}
          className="text-left rounded-xl p-4 border border-white/10 bg-white/[.035] hover:border-[#e8440c]/50 disabled:opacity-40 transition-colors">
          <div className="flex gap-2 items-center text-[#f47b48]">{t.channel==="WHATSAPP"?<MessageCircle className="w-5 h-5"/>:<Mail className="w-5 h-5"/>}<span className="text-xs">{channelNames[t.channel]}</span></div>
          <h3 className="font-bold mt-3">{t.title}</h3><p className="text-xs text-white/45 mt-1">{t.objective}</p>
          <p className="text-xs text-[#f47b48] mt-3">Usar modelo →</p>
        </button>)}
      </div>
    </section>
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Suas campanhas</h2>
      {loading?<div className="p-8 flex gap-2 items-center text-white/50"><Loader2 className="animate-spin"/> Carregando...</div>:
        !campaigns.length?<p className="p-5 rounded-xl border border-white/10 text-white/50 text-sm">Ainda não existem campanhas. Escolha um modelo ou crie sua primeira campanha.</p>:
          <div className="grid md:grid-cols-2 gap-3">
            {campaigns.map(c=><div key={c.id} className="rounded-xl p-4 border border-white/10 bg-white/[.035]">
              <div className="flex flex-wrap gap-2 justify-between items-center"><span className="text-[11px] font-semibold text-[#f47b48]">{channelNames[c.channel]} • {audienceNames[c.audience]}</span>
                <span className="text-xs rounded-md bg-white/10 px-2 py-1">{c.status==="DRAFT"?"Rascunho":c.status==="READY"?"Revisão":"Arquivada"}</span></div>
              <h3 className="font-bold mt-3">{c.name}</h3>
              <p className="text-white/45 text-sm mt-1">{c.objective}</p>
              <p className="text-white/30 text-xs mt-2">Criada em {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
              <div className="flex gap-2 mt-4">
                <button className="flex gap-2 items-center text-sm px-3 py-2 rounded-lg bg-[#e8440c] hover:bg-[#d03a0b]" onClick={()=>open(c)}><FilePenLine className="w-4 h-4"/> Editar</button>
                {c.status!=="ARCHIVED"&&<button className="flex gap-2 items-center text-sm px-3 py-2 rounded-lg border border-white/15" onClick={()=>void archive(c)}><Archive className="w-4 h-4"/> Arquivar</button>}
              </div>
            </div>)}
          </div>}
    </section>
    <section className="space-y-2">
      <h2 className="text-xl font-bold">Próximas automações recomendadas</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          ["Boletim mensal de prestação de contas","Resultados, fotos autorizadas, despesas e andamento das missões"],
          ["Jornada de acolhimento do apoiador","Confirmação de adesão, atualização do projeto e preferências de comunicação"],
          ["Convites para eventos e mobilização","Agenda segmentada por interesse e projeto, com inscrição voluntária"],
          ["Reativação de apoiadores com consentimento","Contato respeitoso após períodos sem contribuição, sem pressão"],
          ["Lembretes individuais de cobrança","Somente para boletos realmente vencidos após consulta ao Asaas"],
          ["Pesquisa de experiência e necessidades","Feedback dos doadores, satisfação e interesse em novos projetos"],
        ].map(([title,description])=><div key={title} className="rounded-xl bg-white/[.025] border border-white/10 p-4">
          <div className="flex items-center gap-2 text-[#f47b48]"><Target className="w-4 h-4"/><strong className="text-sm text-white">{title}</strong></div>
          <p className="text-xs text-white/45 mt-2">{description}</p>
        </div>)}
      </div>
    </section>
    {editing&&<div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-auto p-3 sm:p-10 flex justify-center items-start">
      <div role="dialog" aria-modal="true" aria-label="Editor de campanha" className="w-full max-w-3xl rounded-2xl bg-[#0e2036] border border-white/15 shadow-2xl p-5 sm:p-7 space-y-4">
        <div className="flex gap-3 justify-between items-start">
          <div><h2 className="text-xl font-black">{selectedId?"Editar campanha":"Nova campanha"}</h2><p className="text-sm text-white/40">Salvar não envia mensagens.</p></div>
          <button aria-label="Fechar editor" onClick={()=>setEditing(false)}><X className="w-5 h-5"/></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome da campanha"><input value={form.name} maxLength={120} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="Objetivo"><input value={form.objective} maxLength={300} onChange={e=>setForm({...form,objective:e.target.value})}/></Field>
          <Field label="Canal"><select value={form.channel} onChange={e=>setForm({...form,channel:e.target.value as Channel})}>
            {Object.entries(channelNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select></Field>
          <Field label="Público"><select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value as Audience})}>
            {Object.entries(audienceNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select></Field>
          <Field label="Projeto associado"><select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}>
            <option value="">Todos / nenhum projeto específico</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select></Field>
          <Field label="Etapa"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as typeof form.status})}>
            <option value="DRAFT">Rascunho</option><option value="READY">Pronta para revisão</option><option value="ARCHIVED">Arquivada</option>
          </select></Field>
        </div>
        {form.audience==="PENDING_DONORS"&&<p className="text-amber-300 text-xs">Este segmento é exclusivamente operacional. Confirme a cobrança no Asaas e contate o titular individualmente, sem disparo de marketing.</p>}
        <Field label="Assunto (e-mail / newsletter)"><input maxLength={200} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></Field>
        <Field label="Texto da campanha"><textarea rows={9} maxLength={10000} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></Field>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button onClick={copy} className="px-3 py-2 border border-white/15 rounded-lg text-sm flex gap-2 items-center"><ClipboardCopy className="w-4 h-4"/> Copiar texto</button>
          <div className="flex gap-2">
            <button onClick={()=>setEditing(false)} className="px-4 py-2 border border-white/15 rounded-lg text-sm">Cancelar</button>
            <button onClick={()=>void save()} disabled={saving} className="px-4 py-2 bg-[#e8440c] disabled:opacity-50 rounded-lg font-semibold text-sm flex gap-2 items-center">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Salvar campanha
            </button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}
function Metric({label,value,icon:Icon}:{label:string;value:number;icon:typeof Mail}){
  return <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
    <div className="flex gap-2 items-center text-white/45 text-xs"><Icon className="w-4 h-4"/>{label}</div>
    <p className="font-black text-2xl mt-2">{value}</p>
  </div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){
  return <label className="block space-y-1 text-xs font-semibold text-white/60 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full [&_input]:p-2.5 [&_select]:p-2.5 [&_textarea]:p-2.5 [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg [&_input]:bg-[#142943] [&_select]:bg-[#142943] [&_textarea]:bg-[#142943] [&_input]:border [&_select]:border [&_textarea]:border [&_input]:border-white/15 [&_select]:border-white/15 [&_textarea]:border-white/15">
    <span>{label}</span>{children}
  </label>;
}
