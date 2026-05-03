import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const team = [
  {
    name: "Pr. Ricardo Santos",
    role: "Diretor Geral",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
  },
  {
    name: "Ana Oliveira",
    role: "Coordenadora de Campo",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
    featured: true,
  },
  {
    name: "Marcos Lima",
    role: "Logística Missionária",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop",
  },
  {
    name: "Sarah Meirelles",
    role: "Relacionamento e Doações",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
  },
];

export function Team() {
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
          <Button className="bg-brand-orange hover:bg-brand-burgundy text-white px-8 py-6 rounded-full self-start md:self-end transition-all">
            Junte-se à Equipe
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative bg-white rounded-[40px] p-4 pb-10 text-center transition-all duration-500 hover:shadow-2xl hover:shadow-brand-orange/10",
                member.featured && "lg:-mt-8 shadow-xl"
              )}
            >
              <div className="aspect-square rounded-[32px] overflow-hidden mb-6">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-2xl font-black text-brand-dark mb-2">{member.name}</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-orange">{member.role}</p>
              
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand-orange transition-colors">
                  {/* Social icon placeholder */}
                  <span className="text-xs font-bold">In</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-xs font-bold">Ig</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
