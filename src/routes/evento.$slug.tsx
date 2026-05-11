import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ContactBar } from "@/components/sections/ContactBar";
import { motion } from "framer-motion";
import { Calendar, MapPin, Share2, ArrowRight, ChevronLeft, Loader2, Clock } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/evento/$slug")({
  component: EventPage,
});

type DbEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  event_date: string | null;
  end_date: string | null;
  registration_url: string | null;
  created_at: string;
};

function EventPage() {
  const { slug } = Route.useParams();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [otherEvents, setOtherEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  async function fetchEvent() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .single();

      if (error) throw error;
      setEvent(data as DbEvent);

      // Fetch other events
      const { data: others } = await supabase
        .from("events")
        .select("*")
        .eq("status", "PUBLISHED")
        .neq("slug", slug)
        .limit(3);
      
      if (others) setOtherEvents(others as DbEvent[]);
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-brand-light flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-4xl font-black text-brand-dark mb-6">Evento não encontrado</h1>
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white py-6 px-8 rounded-2xl font-bold">
            <Link to="/eventos">Ver todos os eventos</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white bg-brand-light relative">
      <Navbar dark />
      <div className="absolute top-28 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 pointer-events-auto inline-flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] sm:text-xs p-0 group hover:text-brand-orange transition-colors">
            <Link to="/eventos">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para Eventos
            </Link>
          </Button>
        </div>
      </div>
      
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <img 
            src={event.cover_image || ""} 
            alt="Background" 
            className="w-full h-full object-cover blur-sm opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/95 via-brand-dark/90 to-brand-dark" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-video w-full rounded-3xl overflow-hidden mb-12 shadow-2xl border-4 border-white/5"
            >
              <img 
                src={event.cover_image || ""} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
            </motion.div>

            <SectionTag icon={Calendar} text="EVENTO" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-bold text-sm uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <span>{event.event_date ? format(new Date(event.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "A definir"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-orange" />
                <span>{event.event_date ? format(new Date(event.event_date), "HH:mm") : "A definir"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" />
                <span>{event.location || event.city || "Online"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 relative -mt-10 lg:-mt-16 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8 space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-brand-orange/5"
              >
                <div className="prose prose-lg max-w-none text-brand-dark/70 leading-relaxed">
                  <div className="whitespace-pre-wrap">
                    {event.description}
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-brand-orange/10 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <p className="font-black text-brand-dark text-sm uppercase tracking-widest">Compartilhe:</p>
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-brand-dark rounded-[40px] p-8 md:p-10 text-white shadow-2xl sticky top-32"
              >
                <h3 className="text-2xl font-black mb-6 leading-tight">Inscrição</h3>
                <p className="text-white/60 mb-8 text-sm leading-relaxed">
                  Garanta sua vaga e participe deste momento transformador.
                </p>

                {event.registration_url ? (
                  <Button 
                    asChild
                    className="w-full bg-brand-gradient hover:opacity-90 text-white py-8 rounded-2xl font-black text-lg shadow-lg shadow-brand-orange/20"
                  >
                    <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                      Inscrever-se agora
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full bg-white/10 text-white/40 py-8 rounded-2xl font-black text-lg"
                  >
                    Inscrições em breve
                  </Button>
                )}

                <p className="text-center text-[10px] uppercase tracking-widest font-bold text-white/30 mt-6">
                  Vagas Limitadas
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white rounded-[40px] p-8 border border-brand-orange/5 shadow-xl"
              >
                <h4 className="text-lg font-black text-brand-dark mb-6 uppercase tracking-tight">Próximos Eventos</h4>
                <div className="space-y-6">
                  {otherEvents.map((other) => (
                    <Link 
                      key={other.id} 
                      to="/evento/$slug" 
                      params={{ slug: other.slug }}
                      className="flex gap-4 group cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={other.cover_image || ""} 
                          alt={other.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div>
                        <h5 className="font-black text-brand-dark text-sm leading-tight group-hover:text-brand-orange transition-colors mb-1">
                          {other.title}
                        </h5>
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">
                          {other.event_date ? format(new Date(other.event_date), "dd/MM/yyyy") : "Em breve"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      <ContactBar />
      <Footer />
    </main>
  );
}
