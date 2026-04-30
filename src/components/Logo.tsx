import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  light?: boolean;
}

export function Logo({ className, showSubtitle = true, light = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        {/* Globe with gradient */}
        <div className="relative">
          <Globe 
            className="w-10 h-10 text-brand-orange animate-pulse" 
            strokeWidth={1.5}
          />
          {/* Stylized arrow/cursor in burgundy */}
          <div className="absolute -bottom-1 -right-1 bg-brand-burgundy rounded-full p-1 border-2 border-background">
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col leading-none">
        <div className={cn(
          "text-3xl font-black tracking-tighter flex items-baseline",
          light ? "text-white" : "text-brand-dark"
        )}>
          <span>i</span>
          <span className="text-brand-orange w-1.5 h-1.5 rounded-full mb-5 -ml-0.5" />
          <span className="-ml-0.5">de</span>
        </div>
        {showSubtitle && (
          <span className={cn(
            "text-[8px] font-bold tracking-[0.2em] uppercase -mt-1",
            light ? "text-white/80" : "text-brand-dark/80"
          )}>
            Missões para o Mundo
          </span>
        )}
      </div>
    </div>
  );
}
