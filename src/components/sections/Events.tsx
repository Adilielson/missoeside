import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";

const fetchEvents = async () => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .limit(4);
  
  if (error) throw error;
  return data;
};

export function Events() {
  return (
    <section id="eventos" className="py-16 md:py-24 bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <SectionTag icon={Calendar} text="Próximos Eventos" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              Esteja Conosco em <br />
              <span className="text-brand-orange">Nossos Momentos</span>
            </h2>
          </div>
          <Button className="bg-brand-orange hover:bg-white hover:text-brand-orange text-white px-8 py-6 rounded-full self-start md:self-end transition-all">
            Ver Todos Eventos
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-[32px] sm:rounded-[40px] overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden shrink-0">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-orange text-white px-4 py-2 rounded-2xl text-center shadow-lg">
                  <p className="text-2xl font-black leading-none">{event.day}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">{event.month}</p>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 group-hover:text-brand-orange transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-white/40 text-sm mb-6 line-clamp-2">
                    {event.desc}
                  </p>
                  <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                    <MapPin className="w-4 h-4 text-brand-orange" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Button className="w-fit border-2 border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-white bg-transparent rounded-full px-8 transition-all group/btn">
                  Detalhes do Evento
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
