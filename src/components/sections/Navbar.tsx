import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "../Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const menuItems = [
  { name: "Início", href: "/" },
  { name: "Sobre", href: "#sobre" },
  { name: "Projetos", href: "/nossos-projetos" },
  { name: "Eventos", href: "/eventos" },
  { name: "Blog", href: "/blog" },
  { name: "Contato", href: "#contato" },
];

export function Navbar({ dark = false }: { dark?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled 
          ? "bg-brand-dark/95 backdrop-blur-md border-b border-white/10 py-3 shadow-xl" 
          : dark ? "bg-brand-dark border-b border-white/5" : "bg-gradient-to-r from-brand-orange/10 via-brand-orange/5 to-transparent backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo className="scale-90 md:scale-100 origin-left" />

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8">
          {menuItems.map((item) => (
            <div key={item.name} className="group relative">
              <Link
                to={item.href.startsWith("/") ? item.href : undefined}
                hash={!item.href.startsWith("/") ? item.href.replace("#", "") : undefined}
                className={cn(
                  "text-sm font-semibold transition-colors flex items-center gap-1",
                  isScrolled || dark ? "text-white hover:text-brand-orange" : "text-brand-dark hover:text-brand-orange"
                )}
              >
                {item.name}
                {["Projetos", "Doações"].includes(item.name) && (
                  <ChevronDown className="w-4 h-4 opacity-50" />
                )}
              </Link>
              <motion.div
                className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange transition-all duration-300 group-hover:w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className={cn(
            "hidden sm:flex p-2 transition-colors",
            isScrolled || dark ? "text-white hover:text-brand-orange" : "text-brand-dark hover:text-brand-orange"
          )}>
            <Search className="w-5 h-5" />
          </button>
          
          <Button 
            className="hidden sm:flex bg-brand-gradient hover:opacity-90 text-white border-none rounded-full px-6 group transition-all"
          >
            Junte-se a Nós
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <button 
            className={cn(
              "lg:hidden p-2 transition-colors",
              isScrolled || dark ? "text-white" : "text-brand-dark"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-brand-dark border-t border-white/10 mt-4 -mx-6 px-6 overflow-hidden"
          >
            <div className="flex flex-col py-6 gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href.startsWith("/") ? item.href : undefined}
                  hash={!item.href.startsWith("/") ? item.href.replace("#", "") : undefined}
                  className="text-white hover:text-brand-orange text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button className="bg-brand-gradient text-white mt-4 rounded-full w-full">
                Junte-se a Nós
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
