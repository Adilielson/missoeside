import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionTagProps {
  icon?: LucideIcon;
  text: string;
  className?: string;
  light?: boolean;
}

export function SectionTag({ icon: Icon, text, className, light = false }: SectionTagProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4",
      light 
        ? "bg-brand-orange/10 border-brand-orange/20 text-brand-orange" 
        : "bg-white/10 border-white/20 text-white",
      className
    )}>
      {Icon && <Icon className="w-3.5 h-3.5 fill-current" />}
      <span className="text-xs font-bold tracking-widest uppercase">
        {text}
      </span>
    </div>
  );
}
