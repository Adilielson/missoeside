import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Target, Sparkles, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTag } from "@/components/SectionTag";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";

export const Route = createFileRoute("/sobre")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-light selection:bg-brand-orange selection:text-white">
      <Navbar dark />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(224,90,31,0.2),transparent_70%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              asChild
              variant="ghost"
              className="text-white hover:text-brand-orange hover:bg-white/10 gap-2 pl-0"
            >
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Início
              </Link>
            </Button>
          </motion.div>

          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SectionTag icon={Heart} text="Nossa Essência" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight"
            >
              Agência Cristã <br />
              <span className="text-brand-orange">Missionária IDE</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/70 leading-relaxed mb-8"
            >
              Nossa missão é ir por todo o mundo e pregar o evangelho a toda criatura, sendo o braço estendido de Cristo em cada nação.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Missão",
                text: "Ser o braço estendido de Cristo em cada nação, provendo auxílio prático e esperança espiritual através de missões globais integradas.",
                color: "bg-brand-orange/10 text-brand-orange"
              },
              {
                icon: Globe,
                title: "Visão",
                text: "Alcançar os lugares mais remotos e as comunidades mais vulneráveis, criando um ecossistema de generosidade e transformação sustentável.",
                color: "bg-brand-burgundy/10 text-brand-burgundy"
              },
              {
                icon: Sparkles,
                title: "Valores",
                text: "Fé inabalável, transparência radical, amor em ação e o compromisso solene de proclamar a palavra de Deus.",
                color: "bg-brand-dark/10 text-brand-dark"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] border border-brand-orange/5 bg-brand-light/50 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">{item.title}</h3>
                <p className="text-brand-dark/60 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story/Essence Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[40px] overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
                  alt="Missão IDE"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-orange rounded-full p-8 text-white hidden md:flex flex-col justify-center items-center text-center shadow-2xl">
                <MessageSquare className="w-8 h-8 mb-4" />
                <p className="font-black text-lg">"Onde houver uma necessidade, estaremos lá."</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark mb-8 leading-tight">
                Um Chamado para Ir <br />
                <span className="text-brand-orange">Além das Fronteiras.</span>
              </h2>
              <div className="space-y-6 text-lg text-brand-dark/70 leading-relaxed">
                <p>
                  A Agência Cristã Missionária IDE nasceu de um chamado profundo para levar compaixão e a luz do evangelho onde a necessidade é mais urgente. Acreditamos que a fé se manifesta através de obras concretas que transformam realidades.
                </p>
                <p>
                  Cada projeto que iniciamos é uma resposta direta a um clamor por socorro. Não buscamos apenas números, mas histórias restauradas e vidas impactadas pela mensagem de esperança.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                  <div className="px-6 py-3 bg-brand-orange/5 rounded-full border border-brand-orange/20 text-brand-orange font-bold text-sm">
                    Amor em Ação
                  </div>
                  <div className="px-6 py-3 bg-brand-burgundy/5 rounded-full border border-brand-burgundy/20 text-brand-burgundy font-bold text-sm">
                    Vidas Transformadas
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
