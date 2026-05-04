import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ContactBar } from "@/components/sections/ContactBar";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, MapPin, Share2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import hero2 from "@/assets/hero-2.png";

export const Route = createFileRoute("/projeto")({
  component: ProjectPage,
});

const galleryImages = [
  hero2,
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop",
];

function ProjectPage() {
  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white bg-brand-light">
      <Navbar />
      
      {/* Hero Section of the Post */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <img 
            src={hero2} 
            alt="Projeto África Xai Xai" 
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
            {/* Main Post Image Moved Up */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-video w-full rounded-3xl overflow-hidden mb-12 shadow-2xl border-4 border-white/5"
            >
              <img 
                src={hero2} 
                alt="Destaque do Projeto" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            <SectionTag icon={Heart} text="Saúde / Missões" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8">
              África: <span className="text-brand-orange">Xai Xai / Gaza</span>
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-bold text-sm uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <span>04 de Maio, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" />
                <span>Moçambique, África</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 relative -mt-10 lg:-mt-16 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-brand-orange/5"
              >
                <div className="prose prose-lg max-w-none text-brand-dark/70 leading-relaxed">
                  <p className="text-xl font-bold text-brand-dark mb-6">
                    A Agência Cristã Missionária IDE está mobilizando esforços para transformar a realidade da comunidade de Xai Xai, na província de Gaza, Moçambique.
                  </p>
                  
                  <p className="mb-6">
                    Moçambique enfrenta desafios significativos no acesso a água potável e saneamento básico. Em Xai Xai, muitas famílias ainda dependem de fontes de água não tratada, o que resulta em altos índices de doenças hídricas, afetando principalmente as crianças da região.
                  </p>

                  <h3 className="text-2xl font-black text-brand-dark mt-10 mb-4 uppercase tracking-tight">O Que Estamos Fazendo</h3>
                  <p className="mb-6">
                    Nosso projeto foca na construção de poços artesianos equipados com sistemas de filtragem solar. Não se trata apenas de cavar um poço, mas de garantir que a comunidade tenha autonomia e saúde a longo prazo. Além da infraestrutura, nossa equipe de missionários realiza treinamentos sobre higiene e cuidados com a saúde.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                    <div className="bg-brand-light p-6 rounded-3xl border border-brand-orange/10">
                      <h4 className="font-black text-brand-orange mb-2 uppercase tracking-widest text-xs">Objetivo do Projeto</h4>
                      <p className="text-sm font-medium">Instalação de 5 poços artesianos de alta profundidade para servir mais de 10.000 pessoas.</p>
                    </div>
                    <div className="bg-brand-light p-6 rounded-3xl border border-brand-orange/10">
                      <h4 className="font-black text-brand-orange mb-2 uppercase tracking-widest text-xs">Impacto Espiritual</h4>
                      <p className="text-sm font-medium">Através da água física, levamos a "Água da Vida", estabelecendo pontos de pregação e apoio espiritual.</p>
                    </div>
                  </div>

                  <p>
                    Junte-se a nós nesta causa. Cada contribuição nos aproxima de mais um metro perfurado, de mais uma criança saudável e de uma comunidade que pode sonhar com um futuro melhor. O amor de Deus se manifesta através de nossas ações práticas.
                  </p>
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

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Donation Widget */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-brand-dark rounded-[40px] p-8 md:p-10 text-white shadow-2xl sticky top-32"
              >
                <h3 className="text-2xl font-black mb-6 leading-tight">Ajude este Projeto</h3>
                <p className="text-white/60 mb-8 text-sm leading-relaxed">
                  Sua doação é o combustível para que possamos continuar alcançando vidas em Xai Xai.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between font-black text-lg">
                    <span>Progresso</span>
                    <span className="text-brand-orange">65%</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange w-[65%]" />
                  </div>
                  <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
                    <span>R$ 13.000,00</span>
                    <span>Meta: R$ 20.000,00</span>
                  </div>
                </div>

                <Button className="w-full bg-brand-gradient hover:opacity-90 text-white py-8 rounded-2xl font-black text-lg shadow-lg shadow-brand-orange/20">
                  Apoiar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-center text-[10px] uppercase tracking-widest font-bold text-white/30 mt-6">
                  Doação Segura e Transparente
                </p>
              </motion.div>

              {/* Related Projects */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white rounded-[40px] p-8 border border-brand-orange/5 shadow-xl"
              >
                <h4 className="text-lg font-black text-brand-dark mb-6 uppercase tracking-tight">Outros Projetos</h4>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={`https://images.unsplash.com/photo-${1500000000000 + i}?q=80&w=200&auto=format&fit=crop`} 
                          alt="Outro Projeto" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div>
                        <h5 className="font-black text-brand-dark text-sm leading-tight group-hover:text-brand-orange transition-colors mb-1">
                          Educação Infantil em Gaza
                        </h5>
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">África</p>
                      </div>
                    </div>
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
