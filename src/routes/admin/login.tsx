import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Buscar perfil para verificar permissões e redirecionar corretamente
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, permissions")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const permissions = profile.permissions || [];
          if (profile.role === 'admin' || permissions.includes('dashboard')) {
            navigate({ to: "/admin" });
          } else if (permissions.length > 0) {
            // Redireciona para a primeira permissão que ele tiver
            const paths: Record<string, string> = {
              'projects': '/admin/projects',
              'events': '/admin/events',
              'posts': '/admin/posts',
              'team': '/admin/team',
              'users': '/admin/users'
            };
            const firstPermission = permissions[0];
            navigate({ to: (paths[firstPermission] || "/admin") as any });
          } else {
            navigate({ to: "/admin" });
          }
        } else {
          navigate({ to: "/admin" });
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      
      // O useEffect no início do componente cuidará do redirecionamento baseado em permissões
      // após a sessão ser estabelecida, mas vamos forçar um reload para garantir
      window.location.href = "/admin";
    } catch (error: any) {
      toast.error("Erro ao entrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b13] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#e8440c]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-white/[0.03] border-white/10 backdrop-blur-xl relative">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#e8440c]/20 rounded-2xl border border-[#e8440c]/30">
              <Lock className="w-8 h-8 text-[#e8440c]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">Painel Admin</CardTitle>
          <CardDescription className="text-white/50">
            Entre com suas credenciais para gerenciar o IDE.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 font-bold text-xs uppercase tracking-widest">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 font-bold text-xs uppercase tracking-widest">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-[#e8440c] hover:bg-[#c93a09] text-white font-black h-12 rounded-xl transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR NO PAINEL"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
