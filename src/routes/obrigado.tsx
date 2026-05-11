import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoIde from "@/assets/logo-ide.png";
import { z } from "zod";

const obrigadoSearchSchema = z.object({
  name: z.string().optional(),
  project: z.string().optional(),
});

export const Route = createFileRoute("/obrigado")({
  validateSearch: (search) => obrigadoSearchSchema.parse(search),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  const search = Route.useSearch() as { name?: string; project?: string };
  const nome = search.name || "Doador";
  const projeto = search.project || "IDE Missões";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-brand-dark px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />

      <div className="max-w-2xl w-full text-center z-10 space-y-8">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logoIde} alt="IDE Missões" className="h-16 w-auto" />
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-orange/20">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Obrigado {nome}, o IDE Missões agradece sua doação.
          </h1>

          <div className="space-y-4">
            <p className="text-xl font-semibold text-brand-orange">
              Juntos somos todos missionários.
            </p>
            
            <div className="py-6 border-t border-white/10">
              <p className="text-white/80 italic text-lg leading-relaxed">
                "Novamente Jesus disse: 'Paz seja com vocês! Assim como o Pai me enviou, eu os envio.'"
              </p>
              <p className="text-white/40 mt-2 font-medium">João 20:21</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              asChild
              className="flex-1 h-14 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-xl text-base"
            >
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="flex-1 h-14 bg-transparent border-white/20 text-white hover:bg-white/5 font-bold rounded-xl text-base"
            >
              <Link to="/nossos-projetos">
                Ver outros projetos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
