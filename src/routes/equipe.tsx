import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SectionTag } from "@/components/SectionTag";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Nossa Equipe — IDE Missões" },
      { name: "description", content: "Conheça os profissionais e missionários que conduzem o IDE Missões." },
      { property: "og:title", content: "Nossa Equipe — IDE Missões" },
      { property: "og:description", content: "Conheça os profissionais e missionários que conduzem o IDE Missões." },
    ],
  }),
  component: EquipePage,
});

type TeamMember = {
  id: string;
  name: string;
  role: string;
  area: string;
  slug: string;
  short_bio: string | null;
  image_url: string | null;
  featured: boolean;
};

function EquipePage() {
  const { data: team = [], isLoading } = useQuery({
    queryKey: ["team-members", "all-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id,name,role,area,slug,short_bio,image_url,featured")
        .eq("status", "PUBLISHED")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  return (
    <main className="min-h-screen bg-brand-light/30">
      <Navbar />
      <section className="pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-3xl mb-12 md:mb-16">
            <SectionTag icon={Users} text="Nossa Equipe" light />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-brand-dark leading-tight">
              Pessoas Comprometidas <br />
              <span className="text-brand-orange">com a Chamada</span>
            </h1>
            <p className="text-brand-dark/60 text-lg mt-6 max-w-2xl">
              Conheça quem conduz a missão do IDE — pessoas dedicadas a servir, liderar e fazer o evangelho avançar.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center text-brand-dark/40 py-20">Carregando equipe...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {team.map((member) => (
                <Link
                  key={member.id}
                  to="/equipe/$slug"
                  params={{ slug: member.slug }}
                  className={cn(
                    "group relative bg-white rounded-[40px] p-4 pb-8 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-orange/10 hover:-translate-y-1"
                  )}
                >
                  <div className="aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-brand-light">
                    {member.image_url && (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="px-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-2">{member.role}</p>
                    <h3 className="text-2xl font-black text-brand-dark mb-3">{member.name}</h3>
                    {member.short_bio && (
                      <p className="text-sm text-brand-dark/60 leading-relaxed line-clamp-3">{member.short_bio}</p>
                    )}
                    <p className="text-xs font-semibold text-brand-dark/40 mt-4 uppercase tracking-wider">
                      {member.area}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
