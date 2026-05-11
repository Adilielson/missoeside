import { motion } from "framer-motion";
import { Heart, Phone, Users, CheckCircle } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <section id="sobre" className="py-16 md:py-24 bg-brand-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Side: Heart Collage */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Background splash */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#E05A1F" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,85.2,-0.9C83.5,13.8,76.8,27.7,68.4,40.1C60,52.5,49.9,63.4,37.5,71.2C25.1,79,10.5,83.7,-4.1,80.1C-18.7,76.5,-37.4,64.6,-51.1,51.8C-64.8,39,-73.5,25.3,-78.4,9.6C-83.3,-6.1,-84.4,-23.8,-77.4,-38.4C-70.4,-53,-55.3,-64.5,-40.1,-70.8C-24.9,-77.1,-9.6,-78.2,4.1,-85.3C17.8,-92.4,31.3,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div className="aspect-[3/4] rounded-full overflow-hidden border-8 border-white shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2070&auto=format&fit=crop" 
                  alt="Missão" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-full overflow-hidden border-8 border-white shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1526660690293-bcd32dc3b123?q=80&w=2070&auto=format&fit=crop" 
                  alt="Missão 2" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="aspect-square rounded-full overflow-hidden border-8 border-white shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" 
                  alt="Missão 3" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-full overflow-hidden border-8 border-white shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop" 
                  alt="Missão 4" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SectionTag icon={Heart} text="Sobre Nós" light />
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark mb-6 leading-tight">
            Nossa Jornada de Fé e <br />
            <span className="text-brand-orange">Impacto Global</span>
          </h2>

          <p className="text-base sm:text-lg text-brand-dark/60 mb-8 leading-relaxed">
            Desde 2022, a Agência Cristã Missionária IDE, tem sido um farol de esperança. 
            <br />Nascemos com o propósito de conectar corações generosos às necessidades mais urgentes 
            do planeta, levando não apenas assistência material, mas a mensagem transformadora do Evangelho.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-brand-orange/10 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-brand-dark">Equipe de Missão</p>
                <div className="flex -space-x-2 mt-2">
                  {[1, 2, 3].map(i => (
                    <img 
                      key={i} 
                      src={`https://i.pravatar.cc/150?u=team-${i}`} 
                      className="w-6 h-6 rounded-full border-2 border-white" 
                      alt="Membro"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-brand-orange/10 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-brand-dark">Projetos Ativos</p>
                <p className="text-sm text-brand-dark/50">Mais de 50 países</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <Button asChild className="bg-brand-orange hover:bg-brand-burgundy text-white px-8 py-6 rounded-full transition-all">
              <Link to="/sobre">Explorar Mais</Link>
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-brand-orange/30 flex items-center justify-center text-brand-orange">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark/40 uppercase tracking-widest">Fale Conosco</p>
                <p className="font-black text-brand-dark">+55 (11) 9999-9999</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
