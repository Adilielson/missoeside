import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Loader2, Search, User, Calendar } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
});

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
};

function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, cover_image, category, published_at")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <SectionTag icon={FileText} text="Conhecimento e Reflexão" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8 uppercase tracking-tighter">
              Nosso <span className="text-brand-orange">Blog</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
              Artigos, notícias e estudos sobre missões, evangelismo e a vida cristã. Mantenha-se informado e inspirado.
            </p>

            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar artigos..."
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
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-brand-dark/40 text-xl font-bold">Nenhum artigo encontrado.</p>
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="text-brand-orange font-bold uppercase tracking-widest mt-4"
              >
                Limpar Busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Link to="/blog/$slug" params={{ slug: post.slug }} className="block overflow-hidden rounded-[40px] mb-8 aspect-[16/9] bg-white shadow-xl relative">
                    <img 
                      src={post.cover_image || ""} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-6 left-6 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                      {post.category || "Artigo"}
                    </div>
                  </Link>
                  
                  <div className="px-4">
                    <div className="flex items-center gap-6 mb-4 text-brand-dark/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {post.published_at ? format(new Date(post.published_at), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Recent"}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        IDE Missões
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-black text-brand-dark mb-4 group-hover:text-brand-orange transition-colors leading-tight">
                      <Link to="/blog/$slug" params={{ slug: post.slug }}>{post.title}</Link>
                    </h3>
                    <p className="text-brand-dark/50 text-lg mb-8 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <Link 
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="inline-flex items-center gap-2 text-brand-orange font-black uppercase tracking-widest group/link"
                    >
                      Ler Artigo Completo
                      <ArrowRight className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
