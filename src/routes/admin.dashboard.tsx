import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Quote, CheckCircle2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

interface KeepAliveLog {
  id: string;
  message: string;
  created_at: string;
}

function AdminDashboard() {
  const [logs, setLogs] = useState<KeepAliveLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from("system_keep_alive")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white">Dashboard do Sistema</h1>
        <p className="text-white/60">Monitoramento de integridade e atividade do banco de dados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-[#e8440c]/20 p-3 rounded-xl">
            <Activity className="w-6 h-6 text-[#e8440c]" />
          </div>
          <div>
            <p className="text-sm text-white/40">Status do Banco</p>
            <p className="text-xl font-bold text-white">Ativo</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-white/40">Última Atividade</p>
            <p className="text-xl font-bold text-white">
              {logs.length > 0 
                ? format(new Date(logs[0].created_at), "HH:mm 'de' dd/MM", { locale: ptBR })
                : "Nenhuma"}
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-green-500/20 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-white/40">Auto-Pausa</p>
            <p className="text-xl font-bold text-white">Evitada</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#e8440c]" />
            <h2 className="text-lg font-bold">Logs de Manutenção (Keep-Alive)</h2>
          </div>
          <button 
            onClick={fetchLogs}
            className="text-xs text-[#e8440c] hover:underline"
          >
            Atualizar logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Mensagem Gerada</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-white/40">Carregando registros...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-white/40">Nenhum registro encontrado. Aguardando primeira execução do cron.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/20" />
                        <span className="text-sm text-white/80">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Quote className="w-4 h-4 text-[#e8440c]/40" />
                        <span className="text-sm text-white/60 italic">{log.message}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-md border border-green-500/20">
                        Sucesso
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-[#e8440c]/10 border border-[#e8440c]/20 rounded-xl">
        <p className="text-sm text-white/80 leading-relaxed">
          <strong>Nota do Sistema:</strong> Esta ferramenta insere automaticamente um registro no banco de dados a cada 24 horas (via Edge Function + Cron) para garantir que o projeto Supabase Free não entre em modo de suspensão por inatividade.
        </p>
      </div>
    </div>
  );
}
