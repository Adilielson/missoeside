import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
          <Link to="/equipe" className="self-start md:self-end">
            <Button className="bg-brand-orange hover:bg-brand-burgundy text-white px-8 py-6 rounded-full transition-all">
              Conheça a Equipe
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative bg-white rounded-[40px] p-4 pb-10 text-center transition-all duration-500 hover:shadow-2xl hover:shadow-brand-orange/10",
                member.featured && "lg:-mt-8 shadow-xl"
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
