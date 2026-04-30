import { motion } from "framer-motion";
import { MessageSquare, Star, Quote } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { useState } from "react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    text: "Minha vida mudou completamente depois que conheci o trabalho da IDE. Ver a entrega dos missionários nos inspira a ser melhores todos os dias.",
    name: "Cláudio Ferreira",
    role: "Doador há 5 anos",
    image: "https://i.pravatar.cc/150?u=test1",
    stars: 5,
  },
  {
    text: "O treinamento que recebi foi essencial para minha ida ao campo. A IDE não apenas envia, mas cuida e capacita cada um de nós com excelência.",
    name: "Juliana Mendes",
    role: "Missionária na Índia",
    image: "https://i.pravatar.cc/150?u=test2",
    stars: 5,
  },
  {
    text: "Participar como voluntário nos eventos foi o primeiro passo para entender meu propósito. A comunidade é acolhedora e focada no que importa.",
    name: "Marcos Paulo",
    role: "Voluntário Local",
    image: "https://i.pravatar.cc/150?u=test3",
    stars: 5,
  },
  {
    text: "A transparência da agência me traz segurança para investir. Recebo relatórios detalhados de cada projeto que apoio financeiramente.",
    name: "Fernanda Costa",
    role: "Mantenedora de Projetos",
    image: "https://i.pravatar.cc/150?u=test4",
    stars: 5,
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-24 bg-brand-light/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionTag icon={MessageSquare} text="Depoimentos" light />
          <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
            Vozes de Quem Faz <br />
            <span className="text-brand-orange">Parte da Nossa História</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((test, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[40px] p-10 relative shadow-lg border border-brand-orange/5"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(test.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-orange text-brand-orange" />
                ))}
              </div>

              <div className="absolute top-10 right-10 text-brand-orange/10">
                <Quote className="w-16 h-16" strokeWidth={4} />
              </div>

              <p className="text-brand-dark/70 italic leading-relaxed mb-10 relative z-10">
                "{test.text}"
              </p>

              <div className="flex items-center gap-4">
                <img src={test.image} alt={test.name} className="w-14 h-14 rounded-full border-2 border-brand-orange/20" />
                <div>
                  <h4 className="font-black text-brand-dark">{test.name}</h4>
                  <p className="text-xs font-bold text-brand-orange uppercase tracking-widest">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                active === i ? "w-8 bg-brand-orange" : "bg-brand-orange/20"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
