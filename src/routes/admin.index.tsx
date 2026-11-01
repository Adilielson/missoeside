import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, BarChart3, Briefcase, CalendarDays, ChevronRight,
  FileText, HandCoins, History, LayoutDashboard, Loader2, Mail, Megaphone, RefreshCw,
  ShieldCheck, UserCircle, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

type PageEvent = {
  created_at: string;
  event_type: string;
  event_name: string;
  project_slug: string | null;
};
type PaymentRecord = {
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "REFUNDED" | "CANCELLED";
  project_id: string | null;
  campaign: string | null;
  created_at: string;
};
type Project = { id: string; name: string; slug: string };
type Account = { role: string | null; permissions: string[] | null };
type CountKey = "projects" | "events" | "posts" | "team" | "newsletter" | "users";
const PERIODS = [7, 30, 90] as const;
const TZ = "America/Sao_Paulo";
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dailyKey = (d: string | Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
const paid = (r: PaymentRecord) => (r.status === "CONFIRMED" || r.status === "RECEIVED") && r.type === "ONE_TIME";

const sections = [
  { id: "projects", title: "Projetos e missões", description: "Gerencie iniciativas, metas e páginas", href: "/admin/projects", icon: Briefcase, metric: "Projetos publicados" },
  { id: "events", title: "Eventos", description: "Agenda, encontros e programações", href: "/admin/events", icon: CalendarDays, metric: "Eventos publicados" },
  { id: "posts", title: "Notícias", description: "Conteúdos e atualizações missionárias", href: "/admin/posts", icon: FileText, metric: "Notícias publicadas" },
  { id: "team", title: "Equipe", description: "Missionários e colaboradores", href: "/admin/team", icon: UserCircle, metric: "Perfis publicados" },
  { id: "analytics", title: "Acompanhamento", description: "Doadores, pagamentos vencidos, visitas e cliques", href: "/admin/analytics", icon: BarChart3, metric: "Eventos registrados" },
  { id: "donations", title: "Doações por projeto", description: "Conciliação, status e exportação", href: "/admin/donations", icon: HandCoins, metric: "Exclusivo administradores", adminOnly: true },
  { id: "campaigns", title: "Campanhas", description: "E-mail, WhatsApp e newsletter com consentimento", href: "/admin/campaigns", icon: Megaphone, metric: "Planejamento de comunicação", adminOnly: true },
  { id: "history", title: "Histórico", description: "Registro de alterações e ações", href: "/admin/history", icon: History, metric: "Auditoria" },
  { id: "newsletter", title: "Newsletter", description: "Inscritos e lista de contatos", href: "/admin/newsletter", icon: Mail, metric: "Inscritos", adminOnly: true },
  { id: "users", title: "Usuários", description: "Acessos, papéis e permissões", href: "/admin/users", icon: Users, metric: "Usuários cadastrados" },
] as const;

const tooltipStyle = {
  background: "#101d32", border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12, color: "#fff", fontSize: 12,
};

function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const [counts, setCounts] = useState<Partial<Record<CountKey, number>>>({});
  const [events, setEvents] = useState<PageEvent[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [eventsLimited, setEventsLimited] = useState(false);
  const [paymentsLimited, setPaymentsLimited] = useState(false);
  const [financeAvailable, setFinanceAvailable] = useState(false);
  const admin = account?.role === "admin";
  const permitted = (id: string, adminOnly = false) =>
    Boolean(account && (!adminOnly || admin) &&
      (admin || id === "analytics" || id === "history" || id === "dashboard" ||
        account.permissions?.includes(id)));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFinanceAvailable(false);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Faça login novamente para carregar o painel.");
      const profile = await supabase.from("profiles").select("role,permissions").eq("id", user.id).single();
      if (profile.error || !profile.data) throw new Error("Não foi possível verificar suas permissões.");
      const role = profile.data.role;
      const isAdmin = role === "admin";
      setAccount({ role, permissions: profile.data.permissions });

      const from = new Date();
      from.setDate(from.getDate() - period);
      const traffic = await supabase.from("page_events")
        .select("created_at,event_type,event_name,project_slug")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);

      const [projectCount, eventCount, postCount, teamCount, projectList] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("team_members").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("projects").select("id,name,slug").eq("status", "PUBLISHED").order("name"),
      ]);
      const nextCounts: Partial<Record<CountKey, number>> = {};
      if (!projectCount.error) nextCounts.projects = projectCount.count ?? 0;
      if (!eventCount.error) nextCounts.events = eventCount.count ?? 0;
      if (!postCount.error) nextCounts.posts = postCount.count ?? 0;
      if (!teamCount.error) nextCounts.team = teamCount.count ?? 0;
      setCounts(nextCounts);
      setProjects(!projectList.error ? (projectList.data ?? []) : []);

      if (traffic.error) throw new Error("Não foi possível consultar o acompanhamento do site.");
      setEvents((traffic.data ?? []) as PageEvent[]);
      setEventsLimited((traffic.data ?? []).length === 2000);

      if (isAdmin) {
        const startSixMonths = new Date();
        startSixMonths.setMonth(startSixMonths.getMonth() - 6);
        const [paymentResponse, newsletterCount, userCount] = await Promise.all([
          supabase.from("donations")
            .select("amount,type,status,project_id,campaign,created_at")
            .gte("created_at", startSixMonths.toISOString())
            .order("created_at", { ascending: false })
            .limit(2000),
          supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
        ]);
        if (!newsletterCount.error) nextCounts.newsletter = newsletterCount.count ?? 0;
        if (!userCount.error) nextCounts.users = userCount.count ?? 0;
        setCounts({ ...nextCounts });
        // Sem permissão RLS, não exibe números financeiros presumidos.
        if (paymentResponse.error) {
          setFinanceAvailable(false);
          setPayments([]);
          setError("Os indicadores financeiros não estão disponíveis. Confira suas permissões de administrador.");
        } else {
          setFinanceAvailable(true);
          setPayments((paymentResponse.data ?? []) as PaymentRecord[]);
          setPaymentsLimited((paymentResponse.data ?? []).length === 2000);
        }
      } else {
        setFinanceAvailable(false);
        setPayments([]);
        setPaymentsLimited(false);
      }
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const views = events.filter(e => e.event_type === "page_view").length;
    const clicks = events.filter(e => e.event_name === "apoiar_agora").length;
    const sessionsByProject = events.reduce((acc, e) => {
      if (e.event_name === "apoiar_agora" && e.project_slug) acc.set(e.project_slug, (acc.get(e.project_slug) || 0) + 1);
      return acc;
    }, new Map<string, number>());
    const paidPayments = payments.filter(paid);
    const pending = payments.filter(p => p.type === "ONE_TIME" && p.status === "PENDING").length;
    return {
      views, clicks, sessionsByProject, pending,
      gross: paidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      completed: paidPayments.length,
    };
  }, [events, payments]);

  const trafficSeries = useMemo(() => {
    const rows = new Map<string, { date: string; label: string; visitas: number; apoios: number }>();
    for (let day = period - 1; day >= 0; day--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - day);
      const key = dailyKey(dt);
      rows.set(key, { date: key, label: key.slice(8) + "/" + key.slice(5, 7), visitas: 0, apoios: 0 });
    }
    for (const event of events) {
      const row = rows.get(dailyKey(event.created_at));
      if (!row) continue;
      if (event.event_type === "page_view") row.visitas++;
      if (event.event_name === "apoiar_agora") row.apoios++;
    }
    return [...rows.values()];
  }, [period, events]);

  const topProjects = useMemo(() => {
    const byId = new Map(projects.map(p => [p.id, p.name]));
    const bySlug = new Map(projects.map(p => [p.slug, p.name]));
    const buckets = new Map<string, number>();
    for (const item of payments) {
      if (!paid(item)) continue;
      const name = (item.project_id && byId.get(item.project_id)) ||
        (item.campaign && bySlug.get(item.campaign)) ||
        (item.campaign && item.campaign !== "Geral" ? item.campaign : "Doação geral");
      buckets.set(name, (buckets.get(name) || 0) + Number(item.amount));
    }
    return [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([project, total]) => ({ project, total }));
  }, [payments, projects]);

  const visibleSections = sections.filter(section => permitted(section.id, "adminOnly" in section && section.adminOnly));
  const valueFor = (id: string) => {
    if (id === "analytics") return events.length.toLocaleString("pt-BR") + (eventsLimited ? "+" : "");
    if (id === "donations") return financeAvailable ? String(stats.completed) + " pagas*" : "Indisponível";
    if (id === "history" || id === "campaigns") return "Acessar";
    const count = counts[id as CountKey];
    return count === undefined ? "—" : count.toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#fb733e] text-xs font-extrabold tracking-[.22em] uppercase">
            <LayoutDashboard className="w-4 h-4" /> Visão geral
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Painel de gestão <span className="text-[#f16732]">IDE</span></h1>
          <p className="text-sm text-white/50">Projetos, conteúdo, doações e desempenho reunidos em um só lugar.</p>
        </div>
        <button onClick={() => void load()} disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-sm font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Atualizar dados
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-amber-200 border border-amber-500/30 bg-amber-500/10 p-3 rounded-xl">{error}</p>}

      <section aria-label="Indicadores principais" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Indicator label="Projetos publicados" value={counts.projects === undefined ? "—" : String(counts.projects)} icon={Briefcase} note="Disponíveis no site" />
        <Indicator label={"Visitas (" + period + " dias)"} value={stats.views.toLocaleString("pt-BR")} icon={Activity} note={eventsLimited ? "Amostra de até 2.000 eventos" : "Páginas visualizadas"} />
        <Indicator label={"Cliques em apoiar (" + period + " dias)"} value={stats.clicks.toLocaleString("pt-BR")} icon={BarChart3} note="Interesse, não é pagamento" />
        {admin
          ? <Indicator label="Doações únicas confirmadas*" value={financeAvailable ? money(stats.gross) : "—"} icon={HandCoins} note={financeAvailable ? "Bruto • cobranças dos últimos 6 meses" : "Sem acesso aos dados financeiros"} accent />
          : <Indicator label="Notícias publicadas" value={counts.posts === undefined ? "—" : String(counts.posts)} icon={FileText} note="Conteúdo institucional" accent />}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 border border-white/10 bg-white/[.035] rounded-2xl p-5">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
            <div>
              <h2 className="font-bold">Visitas e interesse nas missões</h2>
              <p className="text-xs text-white/45 mt-1">Páginas visualizadas e cliques em Apoiar Agora — não são doações.</p>
            </div>
            <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
              {PERIODS.map(d => <button key={d} onClick={() => setPeriod(d)}
                className={"text-xs px-3 py-2 rounded-md " + (period === d ? "bg-[#e8440c] text-white" : "text-white/50 hover:text-white")}>{d}d</button>)}
            </div>
          </div>
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficSeries} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="ideViewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#58abc9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#58abc9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#ffffff13" strokeDasharray="3 3"/>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} minTickGap={22}/>
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={tooltipStyle}/>
                <Area type="monotone" name="Visitas" dataKey="visitas" stroke="#58abc9" strokeWidth={2} fill="url(#ideViewsGradient)"/>
                <Area type="monotone" name="Cliques Apoiar" dataKey="apoios" stroke="#f16d35" strokeWidth={2} fill="none"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {eventsLimited && <p className="text-xs text-amber-300 mt-3">A consulta atingiu 2.000 eventos: o gráfico mostra apenas os registros mais recentes do período.</p>}
        </div>
        <div className="xl:col-span-2 border border-white/10 bg-white/[.035] rounded-2xl p-5">
          <div>
            <h2 className="font-bold">{admin ? "Doações confirmadas por projeto" : "Projetos com mais interesse"}</h2>
            <p className="text-xs text-white/45 mt-1">{admin ? "Doações únicas pagas • últimos 6 meses • valores brutos" : "Cliques em Apoiar Agora • período selecionado"}</p>
          </div>
          <div className="h-64 sm:h-72 mt-5">
            {admin ? (
              !financeAvailable ? <EmptyState text="Dados financeiros indisponíveis para este perfil ou consulta."/> : topProjects.length ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjects} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#ffffff13" strokeDasharray="3 3"/>
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={v => "R$ " + Number(v).toLocaleString("pt-BR", {notation:"compact"})} />
                  <YAxis dataKey="project" type="category" width={105} tick={{ fill:"#cbd5e1", fontSize:10 }} tickFormatter={v => v.length > 17 ? v.slice(0, 17) + "…" : v}/>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => money(Number(v))}/>
                  <Bar dataKey="total" name="Valor pago" fill="#e8440c" radius={[0, 6, 6, 0]}/>
                </BarChart>
              </ResponsiveContainer> : <EmptyState text="Ainda não existem doações únicas confirmadas nesta consulta."/>
            ) : (
              stats.sessionsByProject.size ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...stats.sessionsByProject.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([project,cliques])=>({project,cliques}))}
                  layout="vertical" margin={{ top:0, right:4, bottom:0, left:0 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} allowDecimals={false}/>
                  <YAxis dataKey="project" type="category" width={105} tick={{ fill:"#cbd5e1",fontSize:10 }} tickFormatter={v=>v.length>17?v.slice(0,17)+"…":v}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Bar dataKey="cliques" name="Cliques" fill="#e8440c" radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer> : <EmptyState text="Nenhum clique em Apoiar Agora neste período."/>
            )}
          </div>
          {admin && paymentsLimited && <p className="text-amber-300 text-xs">Limite de 2.000 cobranças atingido. Valores parciais; use conciliação completa para fechamento.</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="font-bold text-xl">Áreas de gestão</h2>
            <p className="text-xs text-white/45 mt-1">Acesso rápido às ferramentas disponíveis para seu perfil.</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-white/25"/>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {visibleSections.map(section => {
            const Icon = section.icon;
            return (
              <Link key={section.id} to={section.href}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:border-[#e8440c]/60 hover:bg-white/[.07] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f97316]">
                <span className="flex shrink-0 items-center justify-center w-12 h-12 rounded-xl bg-[#e8440c]/15 text-[#f47b48] group-hover:bg-[#e8440c]/25">
                  <Icon className="w-6 h-6"/>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 font-bold">{section.title}<ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/></span>
                  <span className="block text-xs text-white/45 mt-1 min-h-9">{section.description}</span>
                  <span className="block text-[11px] font-semibold text-[#f08a5d] mt-3">
                    {section.metric}: {valueFor(section.id)}
                    {section.id === "donations" && " • últimos 6 meses"}
                  </span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[#e8440c] shrink-0"/>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="text-xs text-white/35 border-t border-white/10 pt-4 flex flex-wrap justify-between gap-3">
        <span>* Indicadores financeiros mostram apenas registros de doação única confirmados/recebidos dos últimos 6 meses; excluem mensalidades, estornos e taxas. Não representam extrato bancário.</span>
        <span>{updatedAt ? "Atualizado: " + updatedAt.toLocaleString("pt-BR", {timeZone:TZ}) : loading ? "Atualizando..." : "Sem atualização"}</span>
      </div>
    </div>
  );
}

function Indicator({ label, value, note, icon: Icon, accent = false }:{
  label: string; value: string; note: string; icon: typeof Briefcase; accent?: boolean;
}) {
  return (
    <div className={"rounded-2xl border p-4 sm:p-5 " + (accent ? "border-[#e8440c]/30 bg-[#e8440c]/[.09]" : "border-white/10 bg-white/[.035]")}>
      <div className="flex gap-2 items-center text-white/55 text-xs font-semibold">
        <Icon className={"w-4 h-4 " + (accent ? "text-[#ff8648]" : "text-white/50")}/>{label}
      </div>
      <p className={"text-xl sm:text-2xl font-black mt-3 break-words " + (accent ? "text-[#ff9a66]" : "text-white")}>{value}</p>
      <p className="text-[11px] text-white/40 mt-1">{note}</p>
    </div>
  );
}
function EmptyState({text}:{text:string}) {
  return <div className="h-full flex justify-center items-center text-center px-6 text-sm text-white/35">{text}</div>;
}
