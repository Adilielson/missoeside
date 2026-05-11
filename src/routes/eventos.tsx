import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Loader2, Search, Clock } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/eventos")({
  component: EventosPage,
});

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  event_date: string | null;
};

function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug, description, cover_image, location, city, state, event_date")
        .eq("status", "PUBLISHED")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white bg-brand-light">
      <Navbar dark />
      
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-dark/90" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--brand-orange)_0%,transparent_70%)] opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionTag icon={Calendar} text="Conexão e Propósito" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8 uppercase tracking-tighter">
              Nossos <span className="text-brand-orange">Eventos</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
              Participe de nossos congressos, conferências e treinamentos. Momentos únicos de edificação e mobilização para a Grande Comissão.
            </p>

            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-full py-5 pl-14 pr-6 text-white focus:outline-none focus:border-brand-orange transition-all font-bold text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-brand-light">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-brand-dark/40 text-xl font-bold">Nenhum evento encontrado.</p>
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="text-brand-orange font-bold uppercase tracking-widest mt-4"
              >
                Limpar Busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-brand-orange/5 group flex flex-col h-full"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={event.cover_image || ""} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {event.event_date && (
                      <div className="absolute top-6 right-6 bg-white rounded-2xl p-3 shadow-xl text-center min-w-[70px]">
                        <p className="text-brand-dark font-black text-2xl leading-none">
                          {format(new Date(event.event_date), "dd")}
                        </p>
                        <p className="text-brand-orange font-bold text-[10px] uppercase tracking-widest">
                          {format(new Date(event.event_date), "MMM", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-brand-orange font-bold text-[10px] uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {event.event_date ? format(new Date(event.event_date), "HH:mm") : "A definir"}
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-dark/40 font-bold text-[10px] uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.city || "Online"}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-brand-orange transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-brand-dark/50 text-sm mb-8 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="mt-auto">
                      <Button 
                        asChild
                        className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white border-none py-7 rounded-2xl font-black group/btn transition-all"
                      >
                        <Link to="/eventos">
                          Ver Detalhes
                          <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
