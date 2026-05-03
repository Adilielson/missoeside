import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import logoGlobe from "@/assets/logo-globe.png";
import logoText from "@/assets/logo-text.png";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  light?: boolean;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)} style={{ perspective: 600 }}>
      <motion.img
        src={logoGlobe}
        alt=""
        aria-hidden="true"
        className="h-12 w-auto object-contain"
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "visible" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        loading="lazy"
      />
      <img
        src={logoText}
        alt="IDE — Missões para o Mundo"
        className="h-12 w-auto object-contain -ml-2"
        loading="lazy"
      />
    </div>
  );
}
