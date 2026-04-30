import { MapPin, Mail, PhoneCall } from "lucide-react";

export function ContactBar() {
  return (
    <div className="bg-brand-gradient py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="flex items-center gap-6 group">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Nosso Endereço</p>
            <p className="text-white font-black text-lg">Av. das Nações, 1000 - SP</p>
          </div>
        </div>

        <div className="flex items-center gap-6 group">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">E-mail de Contato</p>
            <p className="text-white font-black text-lg">contato@idemissoes.org</p>
          </div>
        </div>

        <div className="flex items-center gap-6 group">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Emergência / WhatsApp</p>
            <p className="text-white font-black text-lg">+55 (11) 98888-7777</p>
          </div>
        </div>
      </div>
    </div>
  );
}
