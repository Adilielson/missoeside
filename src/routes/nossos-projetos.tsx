import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Loader2, Search } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nossos-projetos")({
  component: NossosProjetos,
});

type Project = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  cover_image: string | null;
  country: string | null;
};

function NossosProjetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, category, short_description, cover_image, country")
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white bg-brand-light">
      <Navbar dark />
      
      {/* Header Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-dark/90" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--brand-orange)_0%,transparent_70%)] opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionTag icon={Heart} text="Causas que Transformam" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8 uppercase tracking-tighter">
              Nossos <span className="text-brand-orange">Projetos</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
              Explore nossas frentes missionárias e encontre a causa que faz seu coração bater mais forte. Cada projeto é uma oportunidade de levar esperança.
            </p>

            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nome, país ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-full py-5 pl-14 pr-6 text-white focus:outline-none focus:border-brand-orange transition-all font-bold text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-24 bg-brand-light">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-brand-dark/40 text-xl font-bold">Nenhum projeto encontrado com esses critérios.</p>
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="text-brand-orange font-bold uppercase tracking-widest mt-4"
              >
                Limpar Busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-brand-orange/5 group flex flex-col h-full"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={project.cover_image || ""} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-6 left-6 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                      {project.category}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-brand-orange font-bold text-[10px] uppercase tracking-[0.2em]">
                        {project.country || "Missão Global"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-brand-orange transition-colors line-clamp-2">
                      {project.name}
                    </h3>
                    <p className="text-brand-dark/50 text-sm mb-8 line-clamp-3 leading-relaxed">
                      {project.short_description}
                    </p>
                    
                    <div className="mt-auto space-y-4">
                      <Button 
                        asChild
                        className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white border-none py-7 rounded-2xl font-black group/btn shadow-lg shadow-brand-orange/20"
                      >
                        <Link to="/doar" search={{ project: project.slug }}>
                          Apoiar Agora
                          <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full border-2 border-brand-orange/10 bg-transparent hover:bg-brand-orange/5 text-brand-dark py-7 rounded-2xl font-black"
                      >
                        <Link to="/projeto/$slug" params={{ slug: project.slug }}>
                          Conhecer mais
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
