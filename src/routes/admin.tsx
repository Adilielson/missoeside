import { createFileRoute, Link, useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users,
  LogOut, 
  Menu, 
  X,
  Shield,
  Loader2,
  Calendar,
  FileText,
  UserCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { id: "projects", label: "Projetos / Missões", icon: Briefcase, path: "/admin/projects" },
  { id: "events", label: "Eventos", icon: Calendar, path: "/admin/events" },
  { id: "posts", label: "Blog", icon: FileText, path: "/admin/posts" },
  { id: "team", label: "Equipe", icon: UserCircle, path: "/admin/team" },
  { id: "users", label: "Usuários", icon: Users, path: "/admin/users" },
];

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdmin();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthed(false);
        navigate({ to: "/admin/login" });
      } else if (session) {
        checkAdmin();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAdmin() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthed(false);
        setUserPermissions([]);
        setLoading(false);
        if (location.pathname !== "/admin/login") {
          navigate({ to: "/admin/login" });
        }
        return;
      }

      // Buscar perfil para verificar permissões
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Se for admin e não tiver permissões explícitas, concede todas por padrão
        const permissions = profile.permissions || [];
        setUserPermissions(permissions);
        
        // Se estiver em uma rota que não tem permissão, redireciona para a primeira permitida
        const currentPath = location.pathname;
        const availableItems = menuItems.filter(item => 
          item.id === 'dashboard' || permissions.includes(item.id)
        );

        if (currentPath !== "/admin" && currentPath !== "/admin/login") {
          const currentItem = menuItems.find(item => item.path === currentPath);
          if (currentItem && currentItem.id !== 'dashboard' && !permissions.includes(currentItem.id)) {
            if (availableItems.length > 0) {
              navigate({ to: availableItems[0].path as any });
            } else {
              navigate({ to: "/admin" });
            }
          }
        }
      }

      setAuthed(true);
    } catch (error) {
      console.error("Error checking admin:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e8440c] animate-spin" />
      </div>
    );
  }

  if (!authed && location.pathname !== "/admin/login") {
    return null; // Let useEffect handle redirect
  }

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.id === 'dashboard' || userPermissions.includes(item.id)
  );

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
            {filteredMenuItems.map((item) => (
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-[500px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
