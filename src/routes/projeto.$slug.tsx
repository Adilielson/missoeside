import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ContactBar } from "@/components/sections/ContactBar";
import { motion } from "framer-motion";
import { Heart, Calendar, MapPin, Share2, ArrowRight, ChevronLeft } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getProjectBySlug, getOtherProjects } from "@/data/projects";

export const Route = createFileRoute("/projeto/$slug")({
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const project = getProjectBySlug(slug);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (!project) return;
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % project.gallery.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [project]);

  if (!project) {
    return (
      <main className="min-h-screen bg-brand-light flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-4xl font-black text-brand-dark mb-6">Projeto não encontrado</h1>
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white py-6 px-8 rounded-2xl font-bold">
            <Link to="/">Ver todos os projetos</Link>
          </Button>
        </div>
      </main>
    );
  }

  const otherProjects = getOtherProjects(project.slug);
  const progressPercent = Math.min(Math.round((project.raisedAmount / project.goalAmount) * 100), 100);

  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white bg-brand-light">
      <Navbar dark />
      <div className="absolute top-28 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 pointer-events-auto inline-flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] sm:text-xs p-0 hover:text-brand-orange transition-colors">
            <Link to="/">
              <ChevronLeft className="w-4 h-4" />
              Voltar para Início
            </Link>
          </Button>
        </div>
      </div>
      {/* Hero Section of the Post */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <img 
            src={project.coverImage} 
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
            {/* Static Image as it was before */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-video w-full rounded-3xl overflow-hidden mb-12 shadow-2xl border-4 border-white/5"
            >
              <img 
                src={project.coverImage} 
                alt={project.title} 
                className="w-full h-full object-cover"
              />
            </motion.div>

            <SectionTag icon={Heart} text={project.category} />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8">
              {project.title}: <span className="text-brand-orange">{project.subtitle}</span>
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-bold text-sm uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <span>{project.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" />
                <span>{project.location}</span>
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
            <div className="lg:col-span-8 space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-brand-orange/5"
              >
                <div className="prose prose-lg max-w-none text-brand-dark/70 leading-relaxed">
                  <p className="text-xl font-bold text-brand-dark mb-6">
                    {project.introText}
                  </p>
                  
                  <p className="mb-6">
                    {project.bodyText}
                  </p>

                  <h3 className="text-2xl font-black text-brand-dark mt-10 mb-4 uppercase tracking-tight">O Que Estamos Fazendo</h3>
                  <p className="mb-6">
                    {project.whatWeDo}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                    <div className="bg-brand-light p-6 rounded-3xl border border-brand-orange/10">
                      <h4 className="font-black text-brand-orange mb-2 uppercase tracking-widest text-xs">Objetivo do Projeto</h4>
                      <p className="text-sm font-medium">{project.projectGoal}</p>
                    </div>
                    <div className="bg-brand-light p-6 rounded-3xl border border-brand-orange/10">
                      <h4 className="font-black text-brand-orange mb-2 uppercase tracking-widest text-xs">Impacto Espiritual</h4>
                      <p className="text-sm font-medium">{project.spiritualImpact}</p>
                    </div>
                  </div>

                  <p>
                    {project.callToAction}
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
                  Sua doação é o combustível para que possamos continuar alcançando vidas em {project.subtitle}.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between font-black text-lg">
                    <span>Progresso</span>
                    <span className="text-brand-orange">{progressPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange transition-all duration-1000" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
                    <span>{project.raisedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span>Meta: {project.goalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => alert(`Apoiar: ${project.title}`)}
                  className="w-full bg-brand-gradient hover:opacity-90 text-white py-8 rounded-2xl font-black text-lg shadow-lg shadow-brand-orange/20"
                >
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
                  {otherProjects.map((other) => (
                    <Link 
                      key={other.id} 
                      to="/projeto/$slug" 
                      params={{ slug: other.slug }}
                      className="flex gap-4 group cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={other.coverImage} 
                          alt={other.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div>
                        <h5 className="font-black text-brand-dark text-sm leading-tight group-hover:text-brand-orange transition-colors mb-1">
                          {other.title}: {other.subtitle}
                        </h5>
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">{other.country}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Full Width Automatic Bottom Gallery */}
      <section className="pb-24 bg-brand-light overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 mb-12">
          <SectionTag icon={Heart} text="Galeria do Projeto" />
          <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter">
            Nossa Jornada em <span className="text-brand-orange">Imagens</span>
          </h2>
        </div>

        <div className="relative group">
          <div className="flex gap-6 overflow-hidden py-10">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                duration: 30, 
                ease: "linear", 
                repeat: Infinity 
              }}
              className="flex gap-6 shrink-0"
            >
              {[...project.gallery, ...project.gallery].map((img, i) => (
                <div 
                  key={i} 
                  className="w-[300px] md:w-[450px] aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white"
                >
                  <img 
                    src={img} 
                    alt={`Galeria ${i}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <ContactBar />
      <Footer />
    </main>
  );
}
