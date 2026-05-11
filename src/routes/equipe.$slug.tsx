import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/equipe/$slug")({
  component: MemberPage,
  notFoundComponent: () => (
    <main className="min-h-screen bg-brand-light/30">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center">
        <h1 className="text-4xl font-black text-brand-dark mb-4">Membro não encontrado</h1>
        <p className="text-brand-dark/60 mb-8">Este perfil pode ter sido removido ou não está mais publicado.</p>
        <Link to="/equipe" className="text-brand-orange font-bold underline">
          Voltar para a equipe
        </Link>
      </div>
      <Footer />
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-brand-light/30">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center">
        <h1 className="text-3xl font-black text-brand-dark mb-4">Erro ao carregar perfil</h1>
        <p className="text-brand-dark/60">{error.message}</p>
      </div>
      <Footer />
    </main>
  ),
});

type TeamMember = {
  id: string;
  name: string;
  role: string;
  area: string;
  slug: string;
  short_bio: string | null;
  full_bio: string | null;
  image_url: string | null;
  specialties: string[];
  instagram_url: string | null;
  linkedin_url: string | null;
};

function MemberPage() {
  const { slug } = Route.useParams();

  const { data: member, isLoading } = useQuery({
    queryKey: ["team-member", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as TeamMember;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-brand-light/30">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center text-brand-dark/40">
          Carregando perfil...
        </div>
      </main>
    );
  }

  if (!member) return null;

  return (
    <main className="min-h-screen bg-brand-light/30">
      <Navbar />
      <section className="pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <Link
            to="/equipe"
            className="inline-flex items-center gap-2 text-brand-dark/60 hover:text-brand-orange font-semibold mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a equipe
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
            {/* Foto */}
            <div className="bg-white rounded-[40px] p-4 shadow-xl">
              <div className="aspect-square rounded-[32px] overflow-hidden bg-brand-light">
                {member.image_url && (
                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="lg:pt-8">
              <span className="inline-block px-5 py-2 rounded-full bg-brand-orange/10 text-brand-orange font-bold text-xs uppercase tracking-widest mb-6">
                {member.role}
              </span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-brand-dark leading-[0.95] mb-6">
                {member.name}
              </h1>

              {member.short_bio && (
                <p className="text-xl md:text-2xl text-brand-dark/80 font-medium leading-snug mb-8">
                  {member.short_bio}
                </p>
              )}

              {member.full_bio && (
                <div className="prose prose-lg text-brand-dark/70 leading-relaxed mb-10 whitespace-pre-line">
                  {member.full_bio}
                </div>
              )}

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mb-3">
                  Área de atuação no IDE
                </p>
                <p className="text-lg font-bold text-brand-dark">{member.area}</p>
              </div>

              {member.specialties && member.specialties.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-4 py-2 rounded-full bg-white border border-brand-dark/10 text-sm font-semibold text-brand-dark"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(member.instagram_url || member.linkedin_url) && (
                <div className="flex gap-3">
                  {member.instagram_url && (
                    <a
                      href={member.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-11 h-11 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand-orange transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-11 h-11 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand-orange transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
