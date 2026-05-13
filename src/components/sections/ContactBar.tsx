import { MapPin, Mail, PhoneCall } from "lucide-react";

export function ContactBar() {
  return (
    <div className="bg-brand-gradient py-10 sm:py-12 px-5 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        <div className="flex items-center gap-4 sm:gap-6 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Nosso E-mail</p>
            <p className="text-white font-black text-base sm:text-lg break-words">agenciaidei@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">E-mail de Contato</p>
            <p className="text-white font-black text-base sm:text-lg break-all">contato@idemissoes.org</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Emergência / WhatsApp</p>
            <p className="text-white font-black text-base sm:text-lg">+55 (11) 98888-7777</p>
          </div>
        </div>
      </div>
    </div>
  );
}
