import { motion } from "framer-motion";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  slug: string;
  image_url: string | null;
  featured: boolean;
};

export function Team() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: team = [] } = useQuery({
    queryKey: ["team-members", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id,name,role,slug,image_url,featured")
        .eq("status", "PUBLISHED")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-brand-light/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <SectionTag icon={Users} text="Nossa Equipe" light />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark leading-tight">
              Pessoas Comprometidas <br />
              <span className="text-brand-orange">com a Chamada</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 self-start md:self-end">
            <div className="flex gap-2 mr-4">
              <button 
                onClick={() => scroll("left")}
                className="w-12 h-12 rounded-full border border-brand-orange/20 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all text-brand-orange"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll("right")}
                className="w-12 h-12 rounded-full border border-brand-orange/20 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all text-brand-orange"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <Link to="/equipe">
              <Button className="bg-brand-orange hover:bg-brand-burgundy text-white px-8 py-6 rounded-full transition-all">
                Conheça a Equipe
              </Button>
            </Link>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-6 sm:gap-8 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide no-scrollbar"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative bg-white rounded-[40px] p-4 pb-10 text-center transition-all duration-500 hover:shadow-2xl hover:shadow-brand-orange/10 snap-start min-w-[280px] sm:min-w-[300px]",
                member.featured && "shadow-xl border border-brand-orange/10"
              )}
            >
              <Link to="/equipe/$slug" params={{ slug: member.slug }} className="block">
                <div className="aspect-square rounded-[32px] overflow-hidden mb-6 bg-brand-light">
                  {member.image_url && (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-2">{member.name}</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-brand-orange">{member.role}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
