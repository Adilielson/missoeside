import { cn } from "@/lib/utils";
import logoIde from "@/assets/logo-ide.png";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  light?: boolean;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logoIde}
        alt="IDE — Missões para o Mundo"
        className="h-12 w-auto object-contain"
        loading="lazy"
      />
    </div>
  );
}
