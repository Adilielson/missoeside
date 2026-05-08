import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero2 from "@/assets/hero-2.png";

const heroImages = [
  "https://images.unsplash.com/photo-1594708767771-a7502209ff51?q=80&w=1920&auto=format&fit=crop",
  hero2,
];

const avatars = [
  "https://i.pravatar.cc/150?u=11",
  "https://i.pravatar.cc/150?u=12",
  "https://i.pravatar.cc/150?u=13",
];

export function Hero() {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImgIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-brand-dark overflow-hidden flex items-center pt-28 pb-16 lg:pt-24 lg:pb-0"
    >
      {/* Right curved image area - desktop only */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[58%] pointer-events-none">
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id="heroCurve" clipPathUnits="objectBoundingBox">
              <path d="M 0.15,0 C 0.05,0.16 0.18,0.34 0.10,0.52 C 0.03,0.70 0.18,0.82 0.13,1 L 1,1 L 1,0 Z" />
            </clipPath>
          </defs>
        </svg>
        <div
          className="absolute inset-0"
          style={{ clipPath: "url(#heroCurve)", WebkitClipPath: "url(#heroCurve)" }}
        >
          {heroImages.map((src, i) => (
            <motion.img
              key={i}
              src={src}
              alt="Pessoas impactadas pela missão"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              initial={false}
              animate={{ opacity: i === imgIndex ? 1 : 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/70 via-transparent to-transparent" />
        </div>
      </div>

      {/* Mobile background image */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        {heroImages.map((src, i) => (
          <motion.img
            key={i}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            initial={false}
            animate={{ opacity: i === imgIndex ? 0.25 : 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/85 to-brand-dark" />
      </div>

      {/* Soft glows */}
      <div className="absolute top-1/4 left-10 w-72 md:w-96 h-72 md:h-96 bg-brand-orange/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-72 md:w-96 h-72 md:h-96 bg-brand-burgundy/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 text-brand-orange mb-6"
          >
            <Heart className="w-4 h-4 fill-brand-orange" />
            <span className="text-[11px] sm:text-sm font-semibold tracking-[0.2em] uppercase">
              Transforme o Mundo Junto Conosco
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 break-words"
          >
            Pelas Pessoas e Pela Causa que Você Acredita
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
          >
            Nossa missão é levar esperança, compaixão e o amor de Deus a cada
            canto do mundo. Junte-se a nós nesta jornada de fé e transformação,
            impactando vidas onde a necessidade é maior.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8"
          >
            <Button 
              asChild
              className="bg-brand-gradient hover:opacity-90 text-white text-base font-bold px-7 py-6 rounded-full group shadow-lg shadow-brand-orange/30 w-full sm:w-auto cursor-pointer"
            >
              <a href="#missoes">
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mr-2">
                  <ChevronRight className="w-4 h-4" />
                </span>
                Fazer Doação
              </a>
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Doador"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-brand-dark object-cover"
                  />
                ))}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-brand-dark bg-brand-gradient flex items-center justify-center text-white text-[11px] font-black">
                  2M+
                </div>
              </div>
              <p className="text-white font-semibold text-sm">Doadores ativos</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Spacer for right image on desktop */}
        <div className="hidden lg:block" />
      </div>

    </section>
  );
}
