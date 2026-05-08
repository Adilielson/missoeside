import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowRight, ArrowLeft, Users, Loader2 } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Project = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  cover_image: string | null;
};

export function Causes() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, category, short_description, cover_image")
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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section id="missoes" className="py-16 md:py-24 bg-brand-light relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <SectionTag icon={Heart} text="Ajude e Done" light />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark leading-tight">
            Inspirando e Ajudando por um <span className="text-brand-orange">Mundo&nbsp;Melhor</span>
          </h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pl-5 sm:pl-6 lg:pl-0">
        {/* Causes Carousel */}
        <div 
          ref={scrollRef}
          className="flex-1 flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide no-scrollbar"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-96 text-brand-dark/40">
              Nenhum projeto publicado ainda.
            </div>
          ) : projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-[400px] max-w-[90vw] bg-white rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-xl border border-brand-orange/5 group snap-start"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={project.cover_image || ""} 
                  alt={project.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                  {project.category}
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-black text-brand-dark mb-1 group-hover:text-brand-orange transition-colors">
                  {project.name}
                </h3>
                <p className="text-brand-dark/50 text-sm mb-8 line-clamp-2">
                  {project.short_description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => alert(`Apoiar: ${project.name}`)}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white border-none py-6 rounded-2xl font-bold group/btn"
                  >
                    Apoiar Agora
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-2 border-brand-orange/20 bg-transparent hover:bg-brand-orange/10 text-brand-orange py-6 rounded-2xl font-bold">
                    <Link to="/projeto/$slug" params={{ slug: project.slug }}>
                      Conhecer mais
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Panel Right */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:w-80 bg-brand-dark rounded-[32px] sm:rounded-[40px] p-8 text-white flex flex-col justify-between mr-5 sm:mr-6 lg:mr-0 shrink-0"
        >
          <div>
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange mb-8">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black mb-4">Comunidade Global</h4>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              Junte-se a milhares de doadores que já estão transformando realidades hoje.
            </p>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map(i => (
                <img 
                  key={i} 
                  src={`https://i.pravatar.cc/100?u=donor-${i}`} 
                  className="w-10 h-10 rounded-full border-4 border-brand-dark" 
                  alt="Doador"
                />
              ))}
              <div className="w-10 h-10 rounded-full bg-brand-orange border-4 border-brand-dark flex items-center justify-center text-[10px] font-bold">
                +12K
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mt-4">Doadores Ativos</p>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-orange hover:border-brand-orange transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-orange hover:border-brand-orange transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
