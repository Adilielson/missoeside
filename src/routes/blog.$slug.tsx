import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ContactBar } from "@/components/sections/ContactBar";
import { motion } from "framer-motion";
import { User, Calendar, Share2, ArrowRight, ChevronLeft, Loader2, Tag } from "lucide-react";
import { SectionTag } from "@/components/SectionTag";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
});

type DbPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
};

function PostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<DbPost | null>(null);
  const [otherPosts, setOtherPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  async function fetchPost() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .single();

      if (error) throw error;
      setPost(data as DbPost);

      // Fetch other posts
      const { data: others } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "PUBLISHED")
        .neq("slug", slug)
        .limit(3);
      
      if (others) setOtherPosts(others as DbPost[]);
    } catch (error) {
      console.error("Error fetching post:", error);
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

  if (!post) {
    return (
      <main className="min-h-screen bg-brand-light flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-4xl font-black text-brand-dark mb-6">Artigo não encontrado</h1>
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white py-6 px-8 rounded-2xl font-bold">
            <Link to="/blog">Ver todos os artigos</Link>
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
            <Link to="/blog">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para Blog
            </Link>
          </Button>
        </div>
      </div>
      
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <img 
            src={post.cover_image || ""} 
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
            <SectionTag icon={Tag} text={post.category || "BLOG"} />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-8">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 font-bold text-sm uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <span>{post.published_at ? format(new Date(post.published_at), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Recent"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-brand-orange" />
                <span>IDE Missões</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 relative -mt-10 lg:-mt-16 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-video w-full rounded-[40px] overflow-hidden mb-12 shadow-2xl border-4 border-white/5"
            >
              <img 
                src={post.cover_image || ""} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-[40px] p-8 md:p-16 shadow-xl border border-brand-orange/5"
            >
              <div className="prose prose-lg prose-orange max-w-none text-brand-dark/70 leading-relaxed">
                {post.excerpt && (
                  <p className="text-2xl font-bold text-brand-dark mb-10 leading-snug">
                    {post.excerpt}
                  </p>
                )}
                
                <div className="markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({node, ...props}) => <h2 className="text-3xl font-black text-brand-dark mt-12 mb-6" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-2xl font-black text-brand-dark mt-8 mb-4" {...props} />,
                      p: ({node, ...props}) => <p className="mb-6 leading-relaxed text-lg text-brand-dark/70" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-8 space-y-3" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-8 space-y-3" {...props} />,
                      li: ({node, ...props}) => <li className="text-lg text-brand-dark/70" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-brand-orange pl-6 py-2 italic my-10 bg-brand-light/50 rounded-r-2xl" {...props} />
                      ),
                      strong: ({node, ...props}) => <strong className="font-black text-brand-dark" {...props} />,
                      img: ({node, ...props}) => (
                        <img 
                          className="w-full rounded-[32px] my-10 shadow-lg border border-brand-orange/5" 
                          loading="lazy"
                          {...props} 
                        />
                      ),
                    }}
                  >
                    {post.content || ""}
                  </ReactMarkdown>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-4 py-1.5 bg-brand-light text-brand-orange rounded-full text-xs font-bold uppercase tracking-widest">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

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
        </div>
      </section>

      <section className="py-24 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between mb-12">
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Continue <span className="text-brand-orange">Lendo</span></h4>
            <Button asChild variant="link" className="text-brand-orange font-bold uppercase tracking-widest">
              <Link to="/blog">Ver Blog Completo</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {otherPosts.map((other) => (
              <Link 
                key={other.id} 
                to="/blog/$slug" 
                params={{ slug: other.slug }}
                className="bg-white/5 rounded-[30px] overflow-hidden group border border-white/5"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={other.cover_image || ""} 
                    alt={other.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <h5 className="font-black text-white text-lg group-hover:text-brand-orange transition-colors line-clamp-2 mb-2">
                    {other.title}
                  </h5>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    {other.published_at ? format(new Date(other.published_at), "dd/MM/yyyy") : "Recente"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContactBar />
      <Footer />
    </main>
  );
}
