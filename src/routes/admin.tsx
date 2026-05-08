import { createFileRoute, Link, useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Loader2,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // No admin, verificamos se o usuário está logado E se é admin OU se ele usou a senha de superadmin
  useEffect(() => {
    const isSuperAuthed = sessionStorage.getItem("superadmin-session") === "true";
    if (isSuperAuthed) {
      setAuthed(true);
      setLoading(false);
    } else {
      checkAdmin();
    }
  }, []);

  async function checkAdmin() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "admin") {
        setAuthed(true);
      }
    } catch (error) {
      console.error("Error checking admin:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      // Usamos a mesma Edge Function de superadmin para validar o acesso
      const { data, error } = await supabase.functions.invoke("superadmin-settings", {
        body: { action: "list" },
        headers: { "x-superadmin-password": password },
      });

      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || "Acesso negado");
      }

      sessionStorage.setItem("superadmin-session", "true");
      sessionStorage.setItem("superadmin-key", password);
      setAuthed(true);
      toast.success("Acesso Superadmin concedido");
    } catch (err: any) {
      toast.error("Senha incorreta ou erro de conexão");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    sessionStorage.removeItem("superadmin-session");
    sessionStorage.removeItem("superadmin-key");
    await supabase.auth.signOut();
    setAuthed(false);
    navigate({ to: "/" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e8440c] animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,68,12,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(232,68,12,0.08),transparent_50%)]" />
        <form onSubmit={handleLogin} className="relative w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e8440c] to-[#c93a09] flex items-center justify-center shadow-lg shadow-[#e8440c]/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Admin Access</h1>
              <p className="text-xs text-white/50">Entre com sua senha master</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/60 tracking-wider">SENHA MASTER</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 h-12 bg-black/30 border-white/10 text-white"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={authLoading || !password}
              className="w-full h-12 bg-[#e8440c] hover:bg-[#c93a09] font-bold"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Acessar Painel</>}
            </Button>
            <div className="pt-4 border-t border-white/5 text-center">
              <Link to="/" className="text-xs text-white/40 hover:text-white transition-colors">Voltar para o site</Link>
            </div>
          </div>
        </form>
      </main>
    );
  }

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Projetos / Missões", icon: Briefcase, path: "/admin/projects" },
    { label: "Credenciais Master", icon: Shield, path: "/superadmin", isExternal: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex">
      {/* Sidebar Mobile Overlay */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/40 border border-white/10 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-black/40 border-r border-white/5 backdrop-blur-xl transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8440c] to-[#c93a09] flex items-center justify-center shadow-lg shadow-[#e8440c]/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-black">Admin</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group",
                  location.pathname === item.path
                    ? "bg-[#e8440c] text-white shadow-lg shadow-[#e8440c]/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.isExternal && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60" />}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white/40" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
