import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const avatars = [
  "https://i.pravatar.cc/150?u=1",
  "https://i.pravatar.cc/150?u=2",
  "https://i.pravatar.cc/150?u=3",
  "https://i.pravatar.cc/150?u=4",
];

export function Hero() {
  return (
    <section className="relative min-h-screen bg-brand-dark overflow-hidden flex items-center pt-20">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-burgundy blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange mb-8"
          >
            <Heart className="w-4 h-4 fill-brand-orange" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              Transforme o Mundo Junto Conosco
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6"
          >
            Levando Esperança <br />
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              a Cada Coração
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-white/60 max-w-xl mb-10 leading-relaxed"
          >
            Nossa missão é espalhar o amor e a compaixão em cada canto do globo. 
            Junte-se a nós nesta jornada de fé e transformação social, impactando 
            vidas onde a necessidade é maior.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center gap-6"
          >
            <Button className="bg-brand-gradient hover:opacity-90 text-white text-lg px-8 py-7 rounded-full group">
              Fazer Doação
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Missionário"
                    className="w-12 h-12 rounded-full border-4 border-brand-dark"
                  />
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-brand-dark bg-brand-orange flex items-center justify-center text-white text-xs font-bold">
                  +2M
                </div>
              </div>
              <div>
                <p className="text-white font-bold">2M+ Missionários</p>
                <p className="text-white/40 text-sm">Ativos no campo</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 w-full aspect-[4/5] rounded-[100px_40px_100px_40px] overflow-hidden border-8 border-white/5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
              alt="Crianças em campo missionário"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
          </div>
          
          {/* Decorative elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-32 h-32 bg-brand-orange/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-burgundy/20 rounded-full blur-2xl"
          />
        </motion.div>
      </div>

      {/* Silhouette Hands at bottom left */}
      <div className="absolute bottom-0 left-0 w-1/3 opacity-20 pointer-events-none select-none">
        <svg viewBox="0 0 400 200" className="w-full">
          <path
            fill="white"
            d="M0,200 L400,200 C350,150 300,100 250,150 C200,180 150,120 100,160 C50,140 20,180 0,150 Z"
          />
          {/* Stylized hands shapes would go here, simplified for now */}
        </svg>
      </div>
    </section>
  );
}
