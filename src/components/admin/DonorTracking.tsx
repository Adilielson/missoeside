import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Download, HeartHandshake, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Donation = {
  id: string; donor_name: string; donor_email: string; donor_phone: string | null;
  amount: number; type: "ONE_TIME" | "MONTHLY"; payment_method: string; status: string;
  due_date: string | null; created_at: string; paid_at: string | null;
  campaign: string | null; project_id: string | null; asaas_id: string | null;
  donor_marketing_consent: boolean;
};
type Cycle = {
  payment_id: string; donation_id: string; due_date: string | null;
  amount: number; status: string; last_verified_at: string;
};
type Project = {id: string; name: string; slug: string};
const paidStatus = (s: string) => ["CONFIRMED","RECEIVED","RECEIVED_IN_CASH"].includes(s);
const money = (n: number) => n.toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
const dateBR = (v: string | null) => v ? new Date(v + (v.length===10?"T12:00:00":"")).toLocaleDateString("pt-BR", {timeZone:"America/Sao_Paulo"}) : "—";
const todayBR = () => new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const isOverdue = (due: string | null, status: string, today: string) =>
  Boolean(due && due < today && ["PENDING","OVERDUE","DUNNING_REQUESTED","AWAITING_RISK_ANALYSIS"].includes(status));

function csvSafe(value: unknown) {
  let str=String(value??"");
  if (/^\s*[=+\-@]/.test(str)) str="'"+str;
  return '"'+str.replace(/"/g,'""')+'"';
}

export function DonorTracking() {
  const [donations,setDonations]=useState<Donation[]>([]);
  const [cycles,setCycles]=useState<Cycle[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [offset,setOffset]=useState(0);
  const [error,setError]=useState("");
  const [syncInfo,setSyncInfo]=useState("");
  const [partial,setPartial]=useState(false);
  const [search,setSearch]=useState("");
  const [stateFilter,setStateFilter]=useState("all");
  const [typeFilter,setTypeFilter]=useState("all");
  const [projectFilter,setProjectFilter]=useState("all");
  const [isAdmin,setIsAdmin]=useState(false);
  const today=todayBR();

  async function load() {
    setLoading(true);setError("");setPartial(false);
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Faça login no painel para consultar doadores.");
      const profile=await supabase.from("profiles").select("role").eq("id",user.id).single();
      if(profile.error || profile.data?.role!=="admin") throw new Error("Dados pessoais e financeiros disponíveis apenas para administradores.");
      setIsAdmin(true);
      const db=supabase as any;
      const [d,c,p]=await Promise.all([
        db.from("donations").select("id,donor_name,donor_email,donor_phone,amount,type,payment_method,status,due_date,created_at,paid_at,campaign,project_id,asaas_id,donor_marketing_consent")
          .order("created_at",{ascending:false}).limit(3000),
        db.from("asaas_payment_cycles").select("payment_id,donation_id,due_date,amount,status,last_verified_at").limit(5000),
        supabase.from("projects").select("id,name,slug").order("name"),
      ]);
      if(d.error) throw d.error;
      if(c.error) throw new Error("Histórico por cobrança indisponível. A migração de acompanhamento financeiro deve ser aplicada no Supabase.");
      if(p.error) throw p.error;
      setDonations((d.data??[]) as Donation[]);
      setCycles((c.data??[]) as Cycle[]);
      setProjects((p.data??[]) as Project[]);
      setPartial((d.data??[]).length>=3000||(c.data??[]).length>=5000);
    } catch(e) {setError(e instanceof Error?e.message:"Não foi possível consultar doadores.");setDonations([]);setCycles([]);}
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[]);

  const cycleMap=useMemo(()=>{
    const m=new Map<string,Cycle[]>();
    for(const c of cycles){const rows=m.get(c.donation_id)||[]; rows.push(c);m.set(c.donation_id,rows);}
    return m;
  },[cycles]);

  const names=useMemo(()=>{
    const ids=new Map(projects.map(p=>[p.id,p.name]));
    const slugs=new Map(projects.map(p=>[p.slug,p.name]));
    return (d:Donation)=>(d.project_id&&ids.get(d.project_id))||(d.campaign&&slugs.get(d.campaign))||
      (d.campaign&&d.campaign!=="Geral"?"Projeto: "+d.campaign:"Doação geral");
  },[projects]);

  function billingState(d:Donation) {
    if (d.status==="REFUNDED"||d.status==="CANCELLED")return "cancelled";
    const history=cycleMap.get(d.id)||[];
    if(history.some(c=>isOverdue(c.due_date,c.status,today)))return "overdue";
    if(d.type==="ONE_TIME") {
      if(paidStatus(d.status)||history.some(c=>paidStatus(c.status)))return "paid";
      if(isOverdue(d.due_date,d.status,today))return "overdue";
      if(d.status==="PENDING"&& !d.due_date && history.length===0)return "unknown";
      return "pending";
    }
    // Um registro de assinatura não prova que cada boleto do mês foi pago.
    if(!history.length)return "unknown";
    if(history.some(c=>!paidStatus(c.status)&&["PENDING","OVERDUE"].includes(c.status)))return "pending";
    if(history.some(c=>paidStatus(c.status)))return "paid";
    return "unknown";
  }

  const rows=useMemo(()=>donations.filter(d=>{
    const q=search.toLocaleLowerCase("pt-BR").trim();
    const match=!q||[d.donor_name,d.donor_email,d.donor_phone||"",names(d),d.asaas_id||""]
      .some(v=>String(v).toLocaleLowerCase("pt-BR").includes(q));
    return match&&(typeFilter==="all"||d.type===typeFilter)
      &&(stateFilter==="all"||billingState(d)===stateFilter)
      &&(projectFilter==="all"||names(d)===projectFilter);
  }),[donations,search,typeFilter,stateFilter,projectFilter,names,cycleMap,today]);

  const counts=useMemo(()=>{
    const groups={donors:new Set<string>(),paid:0,pending:0,overdue:0,unknown:0,paidTotal:0};
    for(const d of donations){
      groups.donors.add(d.donor_email?.toLocaleLowerCase("pt-BR").trim()||d.id);
      const s=billingState(d);
      if(s==="overdue")groups.overdue++;
      if(s==="pending")groups.pending++;
      if(s==="unknown")groups.unknown++;
      if(s==="paid")groups.paid++;
      if(d.type==="ONE_TIME"&&s==="paid")groups.paidTotal+=Number(d.amount||0);
    }
    return groups;
  },[donations,cycleMap,today]);

  const projectOptions=[...new Set(donations.map(names))].sort();
  async function reconcile() {
    if(syncing||loading)return;
    setSyncing(true);setSyncInfo("");
    try {
      const {data,error}=await supabase.functions.invoke("admin-asaas-reconcile",{
        body:{offset,limit:20},
      });
      if(error||!data?.success) throw new Error(data?.error||error?.message||"Falha de comunicação com Asaas");
      setSyncInfo("Conciliação: "+data.verified+" cobrança(s) verificadas, "+data.failures+" falhas. Registros examinados: "+data.scanned+".");
      setOffset(data.scanned===0?0:Number(data.next_offset||0));
      await load();
    } catch(e){setError(e instanceof Error?e.message:"Falha de conciliação");}
    finally {setSyncing(false);}
  }

  function download() {
    const header=["Doador","E-mail","Contato","Projeto","Valor","Tipo","Método","Status cobrança","Vencimento","Ref. Asaas","Criado em"];
    const data=rows.map(d=>{
      const latest=(cycleMap.get(d.id)||[]).slice().sort((a,b)=>(b.due_date||"").localeCompare(a.due_date||""))[0];
      return [d.donor_name,d.donor_email,d.donor_phone||"",names(d),Number(d.amount).toFixed(2),
        d.type,d.payment_method,billingState(d),latest?.due_date||d.due_date||"",d.asaas_id||"",d.created_at];
    });
    const content="\uFEFF"+[header,...data].map(r=>r.map(csvSafe).join(";")).join("\r\n");
    const href=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=href;a.download="ide-acompanhamento-doadores.csv";a.click();URL.revokeObjectURL(href);
  }

  const stateLabels:Record<string,string>={
    paid:"Pago/confirmado", pending:"Pendente", overdue:"Vencido", unknown:"A verificar no Asaas", cancelled:"Cancelado/estornado",
  };
  return <section className="space-y-5" aria-label="Doadores e pagamentos">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-black flex gap-2 items-center"><HeartHandshake className="text-[#e8440c]"/> Doadores e pagamentos</h2>
        <p className="text-white/45 text-sm mt-1">Consulta administrativa de dados cadastrais e situação de cobranças no Asaas.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button className="rounded-lg px-3 py-2 border border-white/15 text-sm flex gap-2 items-center disabled:opacity-40" onClick={()=>void load()} disabled={loading||syncing}><RefreshCw className="w-4 h-4"/> Atualizar</button>
        <button className="rounded-lg px-3 py-2 border border-white/15 text-sm flex gap-2 items-center disabled:opacity-40" onClick={download} disabled={!rows.length||loading}><Download className="w-4 h-4"/> CSV</button>
        <button className="rounded-lg px-3 py-2 bg-[#e8440c] text-sm font-bold flex gap-2 items-center disabled:opacity-40" onClick={()=>void reconcile()} disabled={loading||syncing||!!error}>
          {syncing?<Loader2 className="w-4 h-4 animate-spin"/>:<CreditCard className="w-4 h-4"/>} Conciliar 20 no Asaas
        </button>
      </div>
    </div>
    {error&&<p role="alert" className="border border-amber-600/40 bg-amber-500/10 text-amber-200 rounded-xl p-3 text-sm">{error}</p>}
    {syncInfo&&<p className="rounded-xl p-3 bg-white/5 text-sm text-white/70">{syncInfo} {offset>0?"Próximo lote a partir do registro "+(offset+1)+".":""}</p>}
    {partial&&<p className="text-amber-300 text-xs"><AlertTriangle className="inline w-4 h-4"/> Consulta limitada a 3.000 doações e 5.000 cobranças. Para fechamento financeiro, use relatório paginado e conciliação contábil.</p>}
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
      <Stat label="Doadores identificados" value={String(counts.donors.size)} icon={Users}/>
      <Stat label="Registros pagos" value={String(counts.paid)} icon={HeartHandshake}/>
      <Stat label="Pendentes" value={String(counts.pending)} icon={CreditCard}/>
      <Stat label="Vencidos" value={String(counts.overdue)} icon={AlertTriangle}/>
      <Stat label="A verificar" value={String(counts.unknown)} icon={RefreshCw}/>
    </div>
    <p className="text-xs text-white/40">Atenção: “Vencido” significa cobrança não paga com vencimento conhecido anterior a hoje. Não é classificação de inadimplência contratual. Mensalidades são acompanhadas por boleto individual; sem histórico verificado aparece “A verificar”. O total financeiro confiável está em Doações por Projeto.</p>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <label className="relative"><Search className="w-4 h-4 text-white/30 absolute left-3 top-3"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, e-mail, contato..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm"/></label>
      <select aria-label="Situação de pagamento" value={stateFilter} onChange={e=>setStateFilter(e.target.value)} className="bg-[#15253b] border border-white/15 rounded-lg p-2.5 text-sm">
        <option value="all">Todas as situações</option>{Object.entries(stateLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
      <select aria-label="Tipo de doação" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="bg-[#15253b] border border-white/15 rounded-lg p-2.5 text-sm">
        <option value="all">Doações únicas e mensais</option><option value="ONE_TIME">Únicas</option><option value="MONTHLY">Mensais</option>
      </select>
      <select aria-label="Projeto" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="bg-[#15253b] border border-white/15 rounded-lg p-2.5 text-sm">
        <option value="all">Todos os projetos</option>{projectOptions.map(v=><option key={v}>{v}</option>)}
      </select>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      {loading?<div className="flex p-8 justify-center gap-2 text-white/50"><Loader2 className="animate-spin"/> Consultando registros...</div>:
        <table className="min-w-[1050px] w-full text-xs sm:text-sm">
          <thead className="bg-white/5 text-left text-white/50"><tr>
            {["Nome","E-mail","Contato","Projeto","Tipo / método","Valor","Status","Vencimento","Asaas"].map(v=><th key={v} className="px-3 py-3">{v}</th>)}
          </tr></thead>
          <tbody>{rows.map(d=>{
            const state=billingState(d);
            const cs=cycleMap.get(d.id)||[];
            const overdue=cs.filter(c=>isOverdue(c.due_date,c.status,today)).sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||""))[0];
            const nearest=overdue||cs.slice().sort((a,b)=>(b.due_date||"").localeCompare(a.due_date||""))[0];
            return <tr key={d.id} className="border-t border-white/10 hover:bg-white/[.03] align-top">
              <td className="px-3 py-3 font-medium">{d.donor_name}</td>
              <td className="px-3 py-3">{d.donor_email}</td>
              <td className="px-3 py-3">{d.donor_phone||"—"}</td>
              <td className="px-3 py-3">{names(d)}</td>
              <td className="px-3 py-3">{d.type==="MONTHLY"?"Mensal":"Única"} <span className="text-white/40">· {d.payment_method}</span></td>
              <td className="px-3 py-3 whitespace-nowrap">{money(Number(d.amount))}</td>
              <td className="px-3 py-3"><span className={"rounded-md px-2 py-1 text-xs inline-block "+(state==="overdue"?"bg-red-500/15 text-red-300":state==="paid"?"bg-emerald-500/15 text-emerald-300":"bg-white/10 text-white/60")}>{stateLabels[state]}</span>
                {d.type==="MONTHLY"&&<div className="text-[10px] text-white/40 mt-1">{cs.length} boleto(s) verificados</div>}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{dateBR(nearest?.due_date||d.due_date)}</td>
              <td className="px-3 py-3 text-white/45 font-mono">{d.asaas_id||"—"}</td>
            </tr>;
          })}</tbody>
        </table>}
      {!loading && !rows.length && !error && <div className="p-7 text-sm text-white/45 text-center">Nenhuma doação encontrada para este filtro.</div>}
    </div>
    <p className="text-xs text-white/35">Dados pessoais restritos a administradores. O uso em campanhas requer autorização específica do destinatário; pagamento ou cadastro não equivalem a consentimento promocional.</p>
  </section>;
}

function Stat({label,value,icon:Icon}:{label:string;value:string;icon:typeof Users}){
  return <div className="border border-white/10 rounded-xl bg-white/[.04] p-4">
    <div className="flex items-center gap-2 text-xs text-white/50"><Icon className="w-4 h-4"/>{label}</div>
    <p className="text-2xl font-black mt-2">{value}</p>
  </div>;
}
