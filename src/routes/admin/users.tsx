import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  UserPlus, 
  Search, 
  UserCog, 
  Trash2, 
  Shield, 
  ShieldAlert,
  Loader2,
  Mail,
  User as UserIcon,
  Check,
  X
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | null;
  avatar_url: string | null;
  created_at: string;
};

function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    checkCurrentUserRole();
  }, []);

  async function checkCurrentUserRole() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      setCurrentUserRole(profile?.role || null);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit(user: UserProfile) {
    if (currentUserRole !== 'admin') {
      toast.error("Apenas administradores podem gerenciar usuários.");
      return;
    }
    setEditingUser(user);
    setIsEditOpen(true);
  }

  async function handleUpdateRole(newRole: "admin" | "editor" | null) {
    if (!editingUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", editingUser.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
      setIsEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Gestão de Usuários</h2>
          <p className="text-white/50 text-sm">Gerencie os acessos e permissões do sistema.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
        <Search className="w-5 h-5 text-white/30" />
        <input 
          type="text" 
          placeholder="Buscar usuários por nome ou email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none text-white"
        />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Usuário</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Email</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Cargo / Role</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e8440c]" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-white/40">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{u.full_name || "Sem nome"}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-tighter">ID: {u.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-white/60">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-sm">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] tracking-wider",
                      u.role === "admin" 
                        ? "bg-[#e8440c]/10 text-[#e8440c] border-[#e8440c]/20" 
                        : u.role === "editor"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-white/5 text-white/40 border-white/10"
                    )}>
                      {u.role === "admin" ? (
                        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> ADMIN</span>
                      ) : u.role === "editor" ? (
                        <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> EDITOR</span>
                      ) : "USUÁRIO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenEdit(u)}
                      disabled={currentUserRole !== 'admin'}
                      className="text-white/40 hover:text-white hover:bg-white/5 gap-2"
                    >
                      <UserCog className="w-4 h-4" />
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a1628] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Gerenciar Permissões</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {editingUser.avatar_url ? (
                    <img src={editingUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white/20" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold">{editingUser.full_name || "Sem nome"}</h4>
                  <p className="text-sm text-white/40">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase px-1">Nível de Acesso</Label>
                <div className="grid gap-2">
                  <button
                    onClick={() => handleUpdateRole('admin')}
                    disabled={saving}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                      editingUser.role === 'admin' 
                        ? "bg-[#e8440c]/10 border-[#e8440c]/30 text-white" 
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={cn("w-5 h-5", editingUser.role === 'admin' ? "text-[#e8440c]" : "text-white/30")} />
                      <div>
                        <p className="font-bold text-sm text-white">Administrador</p>
                        <p className="text-[11px] text-white/40">Acesso total a todas as áreas do sistema.</p>
                      </div>
                    </div>
                    {editingUser.role === 'admin' && <Check className="w-5 h-5 text-[#e8440c]" />}
                  </button>

                  <button
                    onClick={() => handleUpdateRole('editor')}
                    disabled={saving}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                      editingUser.role === 'editor' 
                        ? "bg-blue-500/10 border-blue-500/30 text-white" 
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={cn("w-5 h-5", editingUser.role === 'editor' ? "text-blue-400" : "text-white/30")} />
                      <div>
                        <p className="font-bold text-sm text-white">Editor de Projetos</p>
                        <p className="text-[11px] text-white/40">Pode gerenciar apenas os Projetos e Missões.</p>
                      </div>
                    </div>
                    {editingUser.role === 'editor' && <Check className="w-5 h-5 text-blue-400" />}
                  </button>

                  <button
                    onClick={() => handleUpdateRole(null)}
                    disabled={saving}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                      editingUser.role === null 
                        ? "bg-white/10 border-white/30 text-white" 
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className={cn("w-5 h-5", editingUser.role === null ? "text-white" : "text-white/30")} />
                      <div>
                        <p className="font-bold text-sm text-white">Usuário Comum</p>
                        <p className="text-[11px] text-white/40">Sem acesso à área administrativa.</p>
                      </div>
                    </div>
                    {editingUser.role === null && <Check className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsEditOpen(false)}
              className="text-white/50 hover:text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
