import { Logo } from "../Logo";
import { Globe, Share2, Phone, Mail, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer id="contato" className="bg-brand-dark pt-16 sm:pt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand Col */}
          <div className="space-y-8">
            <Logo />
            <p className="text-white/40 leading-relaxed">
              Somos uma agência dedicada a levar o amor de Deus aos confins da terra, 
              através de ações práticas e suporte missionário integral.
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, Phone, Mail].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:border-brand-orange transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Col */}
          <div>
            <h4 className="text-xl font-black text-white mb-8 relative inline-block">
              Links Rápidos
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-brand-orange rounded-full" />
            </h4>
            <ul className="space-y-4">
              {["Início", "Sobre Nós", "Nossas Missões", "Como Ajudar", "Eventos", "Contato"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-white/50 hover:text-brand-orange transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Posts Col */}
          <div>
            <h4 className="text-xl font-black text-white mb-8 relative inline-block">
              Posts Recentes
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-brand-orange rounded-full" />
            </h4>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img 
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1511632765486-a01980e01a18' : '1488521787991-ed7bbaae773c'}?q=80&w=100&auto=format&fit=crop`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      alt="Post"
                    />
                  </div>
                  <div>
                    <p className="text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-1">
                      {i === 1 ? "12 MAI, 2026" : "05 MAI, 2026"}
                    </p>
                    <p className="text-white text-sm font-bold line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors">
                      {i === 1 ? "Congresso de Missões Urbanas" : "Impacto da Educação na África"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Col */}
          <div>
            <h4 className="text-xl font-black text-white mb-8 relative inline-block">
              Newsletter
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-brand-orange rounded-full" />
            </h4>
            <p className="text-white/40 text-sm mb-6">Inscreva-se para receber atualizações e notícias do campo.</p>
            <div className="relative mb-4">
              <input 
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-white focus:outline-none focus:border-brand-orange transition-all"
              />
              <button className="absolute right-2 top-2 w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center hover:bg-brand-burgundy transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="privacy" className="accent-brand-orange" />
              <label htmlFor="privacy" className="text-white/30 text-[10px] font-medium leading-none cursor-pointer">
                Concordo com a Política de Privacidade
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-orange py-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-white text-sm font-bold opacity-80">
            © 2026 IDE — Missões para o Mundo. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacidade", "Termos", "Cookies"].map((link) => (
              <a key={link} href="#" className="text-white text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
