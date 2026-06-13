import { createFileRoute, Link, useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Briefcase,
  Users,
  LogOut, 
  Menu, 
  X,
  Shield,
  Loader2,
  Calendar,
  FileText,
  UserCircle,
  BarChart3
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const menuItems = [
  { id: "projects", label: "Projetos / Missões", icon: Briefcase, path: "/admin/projects" },
  { id: "events", label: "Eventos", icon: Calendar, path: "/admin/events" },
  { id: "posts", label: "Blog", icon: FileText, path: "/admin/posts" },
  { id: "team", label: "Equipe", icon: UserCircle, path: "/admin/team" },
  { id: "analytics", label: "Acompanhamento", icon: BarChart3, path: "/admin/analytics" },
  { id: "users", label: "Usuários", icon: Users, path: "/admin/users" },
];

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        // Normalizar permissões
        let permissions = profile.permissions || [];
        
        // Se for admin, garante todas as permissões se não estiverem definidas
        if (profile.role === 'admin' && permissions.length === 0) {
          permissions = ['dashboard', 'projects', 'events', 'posts', 'team', 'analytics', 'users'];
        }

        // Se o usuário não tem permissão explicitamente para 'dashboard', mas está logado, 
        // damos a ele acesso à base /admin se ele tiver QUALQUER outra permissão
        if (permissions.length > 0 && !permissions.includes('dashboard')) {
          permissions = ['dashboard', ...permissions];
        }

        // Analytics deve ser visível para todo usuário que acessa o admin
        if (!permissions.includes('analytics')) {
          permissions = [...permissions, 'analytics'];
        }

        setUserPermissions(permissions);
        
        // Se estiver em uma rota que não tem permissão, redireciona para a primeira permitida
        const currentPath = location.pathname;
        const availableItems = menuItems.filter(item => 
          item.id === 'dashboard' || permissions.includes(item.id)
        );

        const normalizePath = (p: string) => p.replace(/\/$/, "");
        const currentPathNormalized = normalizePath(currentPath);

        // Se o usuário está logado mas tenta acessar algo que não pode
        if (currentPathNormalized.startsWith("/admin") && currentPathNormalized !== "/admin/login") {
          const currentItem = menuItems.find(item => normalizePath(item.path) === currentPathNormalized);
          
          // Especial para a rota raiz /admin (index)
          if (currentPathNormalized === "/admin") {
            // Se ele não tem permissão de projects (que é para onde o index redireciona por padrão)
            // mas tem outras permissões, redirecionamos para a primeira disponível
            if (!permissions.includes('projects')) {
              const firstRestrictedItem = menuItems.find(item => item.id !== 'dashboard' && permissions.includes(item.id));
              if (firstRestrictedItem) {
                navigate({ to: firstRestrictedItem.path as any });
                return;
              }
            }
          }

          // Se estamos em outra rota específica e ele não tem permissão
          if (currentItem && currentItem.id !== 'dashboard' && !permissions.includes(currentItem.id)) {
            const firstRestrictedItem = menuItems.find(item => item.id !== 'dashboard' && permissions.includes(item.id));
            if (firstRestrictedItem) {
              navigate({ to: firstRestrictedItem.path as any });
              return;
            } else {
              // Se não tem nenhuma permissão específica, desloga para evitar loop
              await supabase.auth.signOut();
              return;
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
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white p-4 text-center">
        <div>
          <Shield className="w-12 h-12 text-[#e8440c] mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">Redirecionando para o login...</h2>
          <p className="text-white/40 text-sm mb-6">Você precisa estar autenticado para acessar esta área.</p>
          <div className="flex flex-col gap-3">
            <Loader2 className="w-6 h-6 text-[#e8440c] animate-spin mx-auto" />
            <Link 
              to="/admin/login" 
              className="text-xs text-[#e8440c] hover:underline mt-4"
            >
              Clique aqui se não for redirecionado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.id === 'dashboard' || userPermissions.includes(item.id)
  );

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex overflow-x-hidden">
      {/* Sidebar Mobile Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-30 p-2 bg-black/40 border border-white/10 rounded-lg transition-opacity duration-300",
          sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-black/40 border-r border-white/5 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-auto" />
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
                onClick={() => setSidebarOpen(false)}
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
      <main className="flex-1 min-h-screen flex flex-col min-w-0">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
