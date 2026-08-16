import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Calendar, 
  User, 
  Activity,
  Loader2,
  Clock,
  Filter,
  FileText,
  Briefcase,
  Users,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/history")({
  component: HistoryPage,
});

type AdminLog = {
  id: string;
  created_at: string;
  event_name: string;
  path: string | null;
  metadata: any;
};

function HistoryPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      // Admin actions are stored in page_events with specific event_names
      const { data, error } = await supabase
        .from("page_events")
        .select("*")
        .or("event_name.ilike.%post_%,event_name.ilike.%project_%,event_name.ilike.%event_%,event_name.ilike.%user_%,event_name.ilike.%admin_%")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const getActionBadge = (eventName: string) => {
    if (eventName.includes("create")) return <Badge className="bg-green-500/20 text-green-500 border-green-500/20">Criação</Badge>;
    if (eventName.includes("update")) return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">Edição</Badge>;
    if (eventName.includes("delete")) return <Badge className="bg-red-500/20 text-red-500 border-red-500/20">Exclusão</Badge>;
    if (eventName.includes("access") || eventName.includes("login")) return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/20">Acesso</Badge>;
    return <Badge variant="outline">{eventName}</Badge>;
  };

  const getActionIcon = (eventName: string) => {
    if (eventName.includes("post")) return <FileText className="w-4 h-4 text-white/40" />;
    if (eventName.includes("project")) return <Briefcase className="w-4 h-4 text-white/40" />;
    if (eventName.includes("event")) return <Calendar className="w-4 h-4 text-white/40" />;
    if (eventName.includes("user")) return <Users className="w-4 h-4 text-white/40" />;
    return <Activity className="w-4 h-4 text-white/40" />;
  };

  const formatActionName = (name: string) => {
    const parts = name.split('_');
    const entity = parts[0] === 'admin' ? '' : parts[0];
    const action = parts[parts.length - 1];
    
    const entityMap: Record<string, string> = {
      post: 'Notícia',
      project: 'Projeto',
      event: 'Evento',
      user: 'Usuário',
      login: 'Login',
      access: 'Acesso ao Painel'
    };

    const actionMap: Record<string, string> = {
      create: 'criou',
      update: 'editou',
      delete: 'removeu',
      login: 'entrou no sistema',
      access: 'acessou o painel'
    };

    return `${actionMap[action] || action} ${entityMap[entity] || entity}`;
  };

  const filteredLogs = logs.filter(log => {
    const searchMatch = 
      (log.metadata?.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      log.event_name.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === "all") return searchMatch;
    return searchMatch && log.event_name.includes(filterType);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#e8440c]" />
            Histórico de Alterações
          </h2>
          <p className="text-white/50 text-sm">Auditoria completa de ações realizadas no painel administrativo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
          <Search className="w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Buscar por usuário ou ação..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none text-white"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
          <Filter className="w-5 h-5 text-white/30" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none text-white appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0a1628]">Todos os tipos</option>
            <option value="create" className="bg-[#0a1628]">Criações</option>
            <option value="update" className="bg-[#0a1628]">Edições</option>
            <option value="delete" className="bg-[#0a1628]">Remoções</option>
            <option value="access" className="bg-[#0a1628]">Acessos</option>
          </select>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest py-4">Horário</TableHead>
                <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest py-4">Usuário</TableHead>
                <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest py-4">Ação</TableHead>
                <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest py-4">Tipo</TableHead>
                <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest py-4 text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e8440c]" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-white/40">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">
                          {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8440c]/20 to-[#e8440c]/5 flex items-center justify-center border border-white/10 text-[#e8440c]">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white leading-none mb-1">
                            {log.metadata?.user_name || "Sistema"}
                          </span>
                          <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                            ID: {log.metadata?.user_id?.slice(0, 8) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.event_name)}
                        <span className="text-sm text-white/80">
                          {formatActionName(log.event_name)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getActionBadge(log.event_name)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      {log.metadata?.target_id && (
                        <span className="text-[10px] text-white/20 bg-white/5 px-2 py-1 rounded-md">
                          Ref: {log.metadata.target_id.slice(0, 8)}
                        </span>
                      )}
                      {!log.metadata?.target_id && (
                        <span className="text-[10px] text-white/10 italic">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
