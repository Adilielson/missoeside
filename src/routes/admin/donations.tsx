import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, HeartHandshake, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/donations")({ component: DonationsReport });

type Donation = {
  id: string;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED" | "REFUNDED";
  created_at: string;
  paid_at: string | null;
  project_id: string | null;
  campaign: string | null;
  donor_name: string;
  payment_method: string;
  asaas_id: string | null;
};

type Project = { id: string; name: string; slug: string };
const paid = (s: Donation["status"]) => s === "CONFIRMED" || s === "RECEIVED";
const currency = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (s: string | null) => s
  ? new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })
  : "—";

function DonationsReport() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      // A autorizacao administrativa e conferida no servidor pelo RLS da tabela donations.
      // Fazemos ainda uma verificacao de UX para nao exibir informacoes financeiras a editores.
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Faça login como administrador.");
      const role = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (role.error || role.data?.role !== "admin") throw new Error("Relatório disponível somente para administradores.");

      const projectsResult = await supabase.from("projects").select("id,name,slug").order("name");
      if (projectsResult.error) throw projectsResult.error;
      const rows: Donation[] = [];
      const pageSize = 500;
      const limit = 10000;
      for (let start = 0; start < limit; start += pageSize) {
        const response = await supabase.from("donations")
          .select("id,amount,type,status,created_at,paid_at,project_id,campaign,donor_name,payment_method,asaas_id")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(start, start + pageSize - 1);
        if (response.error) throw response.error;
        const batch = (response.data ?? []) as Donation[];
        rows.push(...batch);
        if (batch.length < pageSize) break;
        if (start + pageSize >= limit) setTruncated(true);
      }
      setProjects((projectsResult.data ?? []) as Project[]);
      setDonations(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar o relatório");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const names = useMemo(() => {
    const byId = new Map(projects.map(p => [p.id, p.name]));
    const bySlug = new Map(projects.map(p => [p.slug, p.name]));
    return (d: Donation) =>
      (d.project_id && byId.get(d.project_id)) ||
      (d.campaign && bySlug.get(d.campaign)) ||
      (d.campaign && d.campaign !== "Geral" ? "Projeto não localizado: " + d.campaign : "Doação geral");
  }, [projects]);

  const filtered = useMemo(() => donations.filter(d =>
    (projectFilter === "all" || (projectFilter === "general"
      ? !(d.project_id || (d.campaign && d.campaign !== "Geral"))
      : names(d) === projectFilter)) &&
    (statusFilter === "all" || d.status === statusFilter)
  ), [donations, names, projectFilter, statusFilter]);

  // IMPORTANTE: o esquema original registra uma linha para uma assinatura inteira.
  // Não podemos somar mensalidades como se este registro representasse cada boleto pago.
  const oneTimePaid = filtered.filter(d => d.type === "ONE_TIME" && paid(d.status));
  const recurringPaid = filtered.filter(d => d.type === "MONTHLY" && paid(d.status));
  const totalOneTime = oneTimePaid.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const totalsByProject = useMemo(() => {
    const grouped = new Map<string, { name: string; total: number; count: number; monthly: number }>();
    for (const d of filtered) {
      const n = names(d);
      if (!grouped.has(n)) grouped.set(n, { name:n, total:0, count:0, monthly:0 });
      const row = grouped.get(n)!;
      if (paid(d.status) && d.type === "ONE_TIME") {
        row.total += Number(d.amount);
        row.count += 1;
      }
      if (paid(d.status) && d.type === "MONTHLY") row.monthly += 1;
    }
    return [...grouped.values()].sort((a,b)=>b.total-a.total);
  }, [filtered, names]);

  const options = useMemo(() => [...new Set(donations.map(names))].sort(), [donations, names]);

  function exportCSV() {
    // Escape Excel formulas in untrusted cells such as donor names and campaign fields.
    const cell = (v: unknown) => {
      let str = String(v ?? "");
      if (/^[\s]*[=+@-]/.test(str)) str = "'" + str;
      return '"' + str.replace(/"/g,'""') + '"';
    };
    const columns = [["ID","Data","Pago em","Doador","Projeto","Valor (BRL)","Tipo","Metodo","Status","Asaas ID"],
      ...filtered.map(d => [d.id,d.created_at,d.paid_at || "",d.donor_name,names(d),Number(d.amount).toFixed(2),
        d.type,d.payment_method,d.status,d.asaas_id||""])];
    const csv = "\uFEFF" + columns.map(row => row.map(cell).join(";")).join("\r\n");
    const href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const el=document.createElement("a");el.href=href;el.download="ide-doacoes-por-projeto.csv";el.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="p-5 lg:p-8 space-y-6 text-white">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><HeartHandshake className="text-[#e8440c]"/> Doações por projeto</h1>
          <p className="text-white/50 text-sm mt-1">Registros Asaas e destino das contribuições, sem confundir cliques com pagamentos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>void load()} className="px-3 py-2 rounded-lg border border-white/20 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Atualizar</button>
          <button onClick={exportCSV} disabled={loading || !!error || !filtered.length}
            className="px-3 py-2 rounded-lg bg-[#e8440c] disabled:opacity-40 text-sm flex items-center gap-2">
            <Download className="w-4 h-4"/> Exportar CSV
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl p-4 bg-red-500/10 border border-red-500/40 text-red-300">{error}</p>}
      {truncated && <p className="text-amber-300 text-sm">Atenção: mais de 10.000 registros. Este relatório está limitado e requer paginação no servidor para fechamento contábil.</p>}

      <div className="flex gap-3 flex-wrap">
        <label className="flex flex-col gap-1 text-xs text-white/60">Projeto
          <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="bg-[#12233b] text-white rounded-lg px-3 py-2 border border-white/20">
            <option value="all">Todos</option><option value="general">Doação geral</option>
            {options.filter(x=>x!=="Doação geral").map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">Status
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-[#12233b] text-white rounded-lg px-3 py-2 border border-white/20">
            <option value="all">Todos</option>
            {["PENDING","CONFIRMED","RECEIVED","CANCELLED","REFUNDED"].map(x=><option key={x}>{x}</option>)}
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Summary label="Doações únicas confirmadas/recebidas" value={currency(totalOneTime)} />
        <Summary label="Pagamentos únicos confirmados" value={String(oneTimePaid.length)} />
        <Summary label="Cadastros mensais com pagamento registrado" value={String(recurringPaid.length)} />
      </div>
      <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
        Os totais em reais incluem SOMENTE doações únicas confirmadas/recebidas, sem contar pendências ou estornos.
        O cadastro de assinatura mensal não representa todas as mensalidades recebidas.
        Para total financeiro recorrente por competência é necessário registrar cada boleto Asaas em um ledger individual.
        Valores são brutos, sem descontar taxas.
      </p>

      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <div className="px-4 py-3 bg-white/5 font-semibold flex gap-2 items-center"><BarChart3 className="w-4 h-4"/> Resumo por projeto — doações únicas</div>
        <table className="w-full text-sm">
          <thead className="text-white/50 bg-white/5"><tr>
            <th className="p-3 text-left">Projeto</th><th className="p-3 text-right">Doações pagas</th><th className="p-3 text-right">Total confirmado</th><th className="p-3 text-right">Assinaturas com pagamento registrado</th>
          </tr></thead>
          <tbody>{totalsByProject.map(x=><tr key={x.name} className="border-t border-white/10">
            <td className="p-3">{x.name}</td><td className="p-3 text-right">{x.count}</td>
            <td className="p-3 text-right font-bold">{currency(x.total)}</td><td className="p-3 text-right">{x.monthly}</td>
          </tr>)}</tbody>
        </table>
      </div>

      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <div className="px-4 py-3 bg-white/5 font-semibold">Doações individuais ({filtered.length})</div>
        {loading ? <div className="p-8 flex gap-2 items-center"><Loader2 className="animate-spin"/> Carregando...</div> :
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-white/50 bg-white/5"><tr>
              <th className="p-3 text-left">Data</th><th className="p-3 text-left">Doador</th>
              <th className="p-3 text-left">Projeto</th><th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Método</th>
              <th className="p-3 text-left">Status</th><th className="p-3 text-left">Referência Asaas</th>
            </tr></thead>
            <tbody>{filtered.map(d=><tr key={d.id} className="border-t border-white/10">
              <td className="p-3 whitespace-nowrap">{date(d.created_at)}</td>
              <td className="p-3">{d.donor_name}</td><td className="p-3">{names(d)}</td>
              <td className="p-3 text-right whitespace-nowrap">{currency(Number(d.amount))}</td>
              <td className="p-3">{d.type === "MONTHLY"?"Mensal":"Única"}</td>
              <td className="p-3">{d.payment_method}</td><td className="p-3">{d.status}</td>
              <td className="p-3 font-mono text-xs">{d.asaas_id || "—"}</td>
            </tr>)}</tbody>
          </table>}
        {!loading && !filtered.length && !error && <p className="p-6 text-white/50">Nenhuma doação encontrada neste filtro.</p>}
      </div>
    </div>
  );
}

function Summary({label,value}:{label:string;value:string}) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs text-white/50">{label}</p><p className="text-2xl font-black mt-2">{value}</p>
  </div>;
}
