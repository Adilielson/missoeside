import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";

const posts = [
  {
    title: "5 Maneiras de Apoiar Missões Sem Sair de Casa",
    author: "Ricardo Santos",
    category: "Engajamento",
    date: "10",
    month: "ABR",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2040&auto=format&fit=crop",
  },
  {
    title: "O Impacto da Educação no Futuro das Nações",
    author: "Ana Oliveira",
    category: "Educação",
    date: "15",
    month: "MAR",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
  },
  {
    title: "Relato de Campo: 30 Dias Servindo na Amazônia",
    author: "Marcos Lima",
    category: "Campo",
    date: "02",
    month: "FEV",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop",
  },
];

export function Blog() {
  return (
    <section id="blog" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <SectionTag icon={Calendar} text="Últimas Notícias" light />
            <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
              Fique por Dentro do <br />
              <span className="text-brand-orange">Nosso Blog</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="w-12 h-12 rounded-full border border-brand-orange/20 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all text-brand-orange">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full border border-brand-orange/20 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all text-brand-orange">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden mb-6">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-white rounded-2xl p-3 text-center min-w-[60px] shadow-xl">
                  <p className="text-xl font-black text-brand-dark leading-none">{post.date}</p>
                  <p className="text-[10px] font-bold text-brand-orange tracking-widest uppercase">{post.month}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">
                <span>Por {post.author}</span>
                <span className="w-1 h-1 bg-brand-dark/20 rounded-full" />
                <span>{post.category}</span>
              </div>

              <h3 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-brand-orange transition-colors line-clamp-2">
                {post.title}
              </h3>

              <div className="flex items-center gap-2 text-brand-dark/40 font-bold text-sm group-hover:text-brand-dark transition-colors">
                <span>Leia Mais</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
