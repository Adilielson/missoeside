import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";

const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(full_name)
    `)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(3);
  
  if (error) throw error;
  return data;
};

export function Blog() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts-home"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return (
      <section id="blog" className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-brand-dark/60">Carregando blog...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <SectionTag icon={Calendar} text="Últimas Notícias" light />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark leading-tight">
              Fique por Dentro do <br />
              <span className="text-brand-orange">Nosso Blog</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white"
              onClick={() => {
                const el = document.querySelector("#blog-scroll");
                if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white"
              onClick={() => {
                const el = document.querySelector("#blog-scroll");
                if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div 
          id="blog-scroll"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 overflow-x-auto lg:overflow-visible pb-4 no-scrollbar scroll-smooth"
        >
          {posts?.map((post, index) => {
            const date = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
            const day = format(date, "dd");
            const month = format(date, "MMM", { locale: ptBR }).toUpperCase().replace(".", "");

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Link to="/blog/$slug" params={{ slug: post.slug }}>
                  <div className="relative aspect-[4/3] rounded-[28px] sm:rounded-[40px] overflow-hidden mb-6">
                    <img 
                      src={post.cover_image || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2040&auto=format&fit=crop"} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-6 left-6 bg-white rounded-2xl p-3 text-center min-w-[60px] shadow-xl">
                      <p className="text-xl font-black text-brand-dark leading-none">{day}</p>
                      <p className="text-[10px] font-bold text-brand-orange tracking-widest uppercase">{month}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">
                    <span>Por {Array.isArray(post.author) ? post.author[0]?.full_name : (post.author as any)?.full_name || "IDE Missões"}</span>
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
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
