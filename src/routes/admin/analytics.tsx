import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Copy,
  HeartHandshake,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

type EventRow = {
  id: string;
  event_type: "page_view" | "button_click";
  event_name: string;
  path: string | null;
  project_slug: string | null;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  metadata: any;
  created_at: string;
};

const PERIODS = [
  { label: "Hoje", value: 1 },
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "Todos", value: 0 },
];

const TZ = "America/Sao_Paulo";

function formatBR(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function dayKeyBR(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  });
}

function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [period, setPeriod] = useState(7);
  const [filterType, setFilterType] = useState<"all" | "page_view" | "button_click">("all");
  const [filterName, setFilterName] = useState("all");
  const [filterPath, setFilterPath] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("page_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (period > 0) {
      const since = new Date();
      since.setDate(since.getDate() - period);
      q = q.gte("created_at", since.toISOString());
    }
    const { data, error } = await q;
    if (error) console.error(error);
    setEvents((data as EventRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [period]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== "all" && e.event_type !== filterType) return false;
      if (filterName !== "all" && e.event_name !== filterName) return false;
      if (filterPath !== "all" && e.path !== filterPath) return false;
      if (filterProject !== "all" && (e.project_slug || "—") !== filterProject) return false;
      return true;
    });
  }, [events, filterType, filterName, filterPath, filterProject]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pageViews = filtered.filter((e) => e.event_type === "page_view").length;
    const apoiarClicks = filtered.filter((e) => e.event_name === "apoiar_agora").length;
    const pixCopies = filtered.filter((e) => e.event_name === "copiar_pix_cnpj").length;
    const projectsVisits = filtered.filter(
      (e) => e.event_type === "page_view" && e.path === "/nossos-projetos"
    ).length;
    const uniqueSessions = new Set(filtered.map((e) => e.session_id)).size;
    return { total, pageViews, apoiarClicks, pixCopies, projectsVisits, uniqueSessions };
  }, [filtered]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { day: string; visitas: number; cliques: number }>();
    for (const e of filtered) {
      const k = dayKeyBR(e.created_at);
      if (!map.has(k)) map.set(k, { day: k, visitas: 0, cliques: 0 });
      const row = map.get(k)!;
      if (e.event_type === "page_view") row.visitas++;
      else row.cliques++;
    }
    return Array.from(map.values()).reverse();
  }, [filtered]);

  const topProjects = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) {
      if (e.event_name !== "apoiar_agora" || !e.project_slug) continue;
      map.set(e.project_slug, (map.get(e.project_slug) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([projeto, cliques]) => ({ projeto, cliques }))
      .sort((a, b) => b.cliques - a.cliques)
      .slice(0, 8);
  }, [filtered]);

  const topPaths = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) {
      if (e.event_type !== "page_view" || !e.path) continue;
      map.set(e.path, (map.get(e.path) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([path, visitas]) => ({ path, visitas }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 8);
  }, [filtered]);

  const uniqueNames = useMemo(
    () => Array.from(new Set(events.map((e) => e.event_name))).sort(),
    [events]
  );
  const uniquePaths = useMemo(
    () => Array.from(new Set(events.map((e) => e.path).filter(Boolean) as string[])).sort(),
    [events]
  );
  const uniqueProjects = useMemo(
    () => Array.from(new Set(events.map((e) => e.project_slug || "—"))).sort(),
    [events]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8440c]/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#e8440c]" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Acompanhamento</h1>
            <p className="text-white/40 text-sm">
              Visitas e cliques no site — horário de Brasília (America/Sao_Paulo)
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Period filter */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              period === p.value
                ? "bg-[#e8440c] border-[#e8440c] text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Eye} label="Visitas (page views)" value={stats.pageViews} />
        <KpiCard icon={MousePointerClick} label="Total de eventos" value={stats.total} />
        <KpiCard icon={HeartHandshake} label="Cliques 'Apoiar Agora'" value={stats.apoiarClicks} accent />
        <KpiCard icon={Copy} label="Cópias do PIX/CNPJ" value={stats.pixCopies} accent />
        <KpiCard icon={Eye} label="Visitas /nossos-projetos" value={stats.projectsVisits} />
        <KpiCard icon={Eye} label="Sessões únicas" value={stats.uniqueSessions} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Visitas vs Cliques por dia">
          {dailyData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Line type="monotone" dataKey="visitas" stroke="#60a5fa" strokeWidth={2} />
                <Line type="monotone" dataKey="cliques" stroke="#e8440c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top projetos — cliques em 'Apoiar Agora'">
          {topProjects.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProjects}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="projeto" stroke="#ffffff60" fontSize={11} />
                <YAxis stroke="#ffffff60" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Bar dataKey="cliques" fill="#e8440c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top páginas — visitas">
          {topPaths.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topPaths} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" stroke="#ffffff60" fontSize={12} />
                <YAxis dataKey="path" type="category" stroke="#ffffff60" fontSize={11} width={150} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Bar dataKey="visitas" fill="#60a5fa" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Resumo">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-white/60">Período</span><span className="font-semibold">{PERIODS.find(p => p.value === period)?.label}</span></li>
            <li className="flex justify-between"><span className="text-white/60">Total de registros (até 1000)</span><span className="font-semibold">{events.length}</span></li>
            <li className="flex justify-between"><span className="text-white/60">Após filtros</span><span className="font-semibold">{filtered.length}</span></li>
            <li className="flex justify-between"><span className="text-white/60">Taxa de cliques 'Apoiar' / visitas</span><span className="font-semibold">{stats.pageViews ? ((stats.apoiarClicks / stats.pageViews) * 100).toFixed(1) + "%" : "—"}</span></li>
            <li className="flex justify-between"><span className="text-white/60">Taxa de cópia PIX / visitas</span><span className="font-semibold">{stats.pageViews ? ((stats.pixCopies / stats.pageViews) * 100).toFixed(1) + "%" : "—"}</span></li>
          </ul>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select label="Tipo" value={filterType} onChange={setFilterType as any} options={[
          { value: "all", label: "Todos" },
          { value: "page_view", label: "Visitas" },
          { value: "button_click", label: "Cliques" },
        ]} />
        <Select label="Evento" value={filterName} onChange={setFilterName} options={[
          { value: "all", label: "Todos" },
          ...uniqueNames.map(n => ({ value: n, label: n })),
        ]} />
        <Select label="Página" value={filterPath} onChange={setFilterPath} options={[
          { value: "all", label: "Todas" },
          ...uniquePaths.map(p => ({ value: p, label: p })),
        ]} />
        <Select label="Projeto" value={filterProject} onChange={setFilterProject} options={[
          { value: "all", label: "Todos" },
          ...uniqueProjects.map(p => ({ value: p, label: p })),
        ]} />
      </div>

      {/* Table */}
      <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 text-sm font-bold flex items-center justify-between">
          <span>Eventos detalhados</span>
          <span className="text-white/40 font-normal">{filtered.length} registros</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#e8440c]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/40 text-sm">Nenhum evento ainda.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-white/50 text-xs uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3">Data/Hora (BR)</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Página</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Localização do clique</th>
                  <th className="px-4 py-3">Sessão</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatBR(e.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${e.event_type === "page_view" ? "bg-blue-500/20 text-blue-300" : "bg-orange-500/20 text-orange-300"}`}>
                        {e.event_type === "page_view" ? "Visita" : "Clique"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{e.event_name}</td>
                    <td className="px-4 py-3 text-white/60">{e.path || "—"}</td>
                    <td className="px-4 py-3 text-white/60">{e.project_slug || "—"}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{e.metadata?.location || "—"}</td>
                    <td className="px-4 py-3 text-white/30 text-xs font-mono">{e.session_id?.slice(0, 8) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`bg-black/30 border rounded-2xl p-4 ${accent ? "border-[#e8440c]/40" : "border-white/5"}`}>
      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
        <Icon className="w-4 h-4" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-2xl font-black ${accent ? "text-[#e8440c]" : ""}`}>{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
      <h3 className="text-sm font-bold mb-3 text-white/80">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">Sem dados no período.</div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8440c]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
