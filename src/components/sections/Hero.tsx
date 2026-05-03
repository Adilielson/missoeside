import { motion } from "framer-motion";
import { Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const avatars = [
  "https://i.pravatar.cc/150?u=11",
  "https://i.pravatar.cc/150?u=12",
  "https://i.pravatar.cc/150?u=13",
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-brand-dark overflow-hidden flex items-center pt-24"
    >
      {/* Right curved image area */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[55%] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              "path('M 180 0 C 60 180, 220 360, 120 560 C 40 740, 220 880, 160 1080 L 1200 1080 L 1200 0 Z')",
            WebkitClipPath:
              "path('M 180 0 C 60 180, 220 360, 120 560 C 40 740, 220 880, 160 1080 L 1200 1080 L 1200 0 Z')",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?q=80&w=1600&auto=format&fit=crop"
            alt="Pessoas impactadas pela missão"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 via-transparent to-transparent" />
        </div>
      </div>

      {/* Soft glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-brand-orange/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-brand-burgundy/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 text-brand-orange mb-6"
          >
            <Heart className="w-4 h-4 fill-brand-orange" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">
              Transforme o Mundo Junto Conosco
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6"
          >
            Pelas Pessoas e <br />
            Pela Causa que <br />
            Você Acredita
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg text-white/60 max-w-xl mb-10 leading-relaxed"
          >
            Nossa missão é levar esperança, compaixão e o amor de Deus a cada
            canto do mundo. Junte-se a nós nesta jornada de fé e transformação,
            impactando vidas onde a necessidade é maior.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center gap-8"
          >
            <Button className="bg-brand-gradient hover:opacity-90 text-white text-base font-bold px-7 py-6 rounded-full group shadow-lg shadow-brand-orange/30">
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <ChevronRight className="w-4 h-4" />
              </span>
              Fazer Doação
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Doador"
                    className="w-11 h-11 rounded-full border-2 border-brand-dark object-cover"
                  />
                ))}
                <div className="w-11 h-11 rounded-full border-2 border-brand-dark bg-brand-gradient flex items-center justify-center text-white text-[11px] font-black">
                  2M+
                </div>
              </div>
              <p className="text-white font-semibold text-sm">Doadores ativos</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Spacer for right image */}
        <div className="hidden lg:block" />
      </div>

      {/* Hands silhouette at bottom */}
      <div className="absolute bottom-0 left-0 w-1/2 h-40 opacity-30 pointer-events-none select-none">
        <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="xMidYEnd meet">
          <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-brand-orange/60">
            {[40, 110, 180, 250, 320, 390, 460, 530].map((x, i) => (
              <g key={i}>
                <line x1={x} y1={200} x2={x} y2={120 - (i % 3) * 20} />
                <line x1={x - 14} y1={140 - (i % 3) * 20} x2={x - 14} y2={170} />
                <line x1={x + 14} y1={140 - (i % 3) * 20} x2={x + 14} y2={170} />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </section>
  );
}
