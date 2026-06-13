import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Trash2, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/newsletter")({
  component: NewsletterPage,
});

type Subscriber = {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
};

function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar inscritos");
    } else {
      setSubscribers((data as Subscriber[]) || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este inscrito?")) return;
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Inscrito removido");
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  }

  function exportCsv() {
    const rows = [["email", "origem", "data"]];
    filtered.forEach((s) =>
      rows.push([s.email, s.source || "", new Date(s.created_at).toISOString()])
    );
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Mail className="w-7 h-7 text-[#e8440c]" />
            Newsletter
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {subscribers.length} inscrito{subscribers.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={exportCsv} disabled={!subscribers.length} className="bg-[#e8440c] hover:bg-[#c93a0a]">
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por e-mail..."
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#e8440c]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            {subscribers.length === 0 ? "Nenhum inscrito ainda." : "Nenhum resultado."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">E-mail</TableHead>
                <TableHead className="text-white/60">Origem</TableHead>
                <TableHead className="text-white/60">Inscrito em</TableHead>
                <TableHead className="text-white/60 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-white/60">{s.source || "—"}</TableCell>
                  <TableCell className="text-white/60">
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
