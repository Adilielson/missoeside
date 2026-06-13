import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  Image as ImageIcon,
  Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/posts")({
  component: PostsPage,
});

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
};

function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<Partial<Post>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    status: "DRAFT",
    cover_image: null,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error: any) {
      toast.error("Erro ao carregar posts: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenForm(post?: Post) {
    if (post) {
      console.log("Opening form for editing post:", post);
      setEditingPost(post);
      setFormData({
        ...post,
        content: post.content || ""
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "",
        tags: [],
        status: "DRAFT",
        cover_image: null,
      });
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    }
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    console.log("HandleSave triggered. Current content in formData:", formData.content);
    setSaving(true);
    try {
      if (!formData.title || !formData.slug) {
        throw new Error("Título e Slug são obrigatórios.");
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags || [],
        status: formData.status,
        cover_image: formData.cover_image,
        updated_at: new Date().toISOString(),
      };

      console.log("Saving post ID:", editingPost?.id);
      console.log("Payload content length:", payload.content?.length);

      if (editingPost) {
        console.log("Starting Supabase Update for ID:", editingPost.id);
        const { data, error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", editingPost.id)
          .select();
        
        if (error) {
          console.error("Supabase Update Error:", error);
          throw error;
        }
        
        console.log("Update success, returned data:", data);
        
        if (!data || data.length === 0) {
          console.warn("No rows updated! Checking if record exists...");
          const { data: verify } = await supabase.from("posts").select("id").eq("id", editingPost.id).single();
          if (!verify) throw new Error("O registro não foi encontrado no banco de dados.");
          else throw new Error("O registro existe mas a atualização não afetou nenhuma linha.");
        }

        toast.success("Post atualizado com sucesso!");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("posts")
          .insert([{ ...payload, author_id: user?.id }])
          .select();
          
        if (error) throw error;
        toast.success("Post criado com sucesso!");
      }
      await fetchPosts();
      setIsFormOpen(false);
      setEditingPost(null);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoSave(content: string) {
    if (!editingPost || !content || content === editingPost.content) return;
    
    setIsAutoSaving(true);
    try {
      console.log("Auto-saving content for ID:", editingPost.id, "Length:", content.length);
      const { error } = await supabase
        .from("posts")
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingPost.id);
      
      if (error) throw error;
      console.log("Auto-save successful");
      
      // Update the local list so the "edit" state remains consistent
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content } : p));
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setTimeout(() => setIsAutoSaving(false), 1000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Post excluído!");
      fetchPosts();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  async function handleToggleStatus(post: Post) {
    const newStatus = post.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    try {
      const { error } = await supabase
        .from("posts")
        .update({ 
          status: newStatus,
          published_at: newStatus === "PUBLISHED" ? new Date().toISOString() : post.published_at 
        } as any)
        .eq("id", post.id);
      if (error) throw error;
      toast.success(`Post ${newStatus === "PUBLISHED" ? "publicado" : "movido para rascunho"}!`);
      fetchPosts();
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + error.message);
    }
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `post-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-covers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-covers")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, cover_image: publicUrl }));
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Blog / Artigos</h2>
          <p className="text-white/50">Gerencie o conteúdo e notícias do IDE.</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-[#e8440c] hover:bg-[#c93a09] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Artigo
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
        <Search className="w-5 h-5 text-white/30" />
        <input 
          type="text" 
          placeholder="Buscar artigos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none"
        />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Artigo</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Categoria</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Publicação</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e8440c]" />
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-white/40">
                  Nenhum post encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((p) => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0 border border-white/10">
                        {p.cover_image ? (
                          <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-2.5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{p.title}</p>
                        <p className="text-[11px] text-white/40 font-mono">/{p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10 text-white/60">
                      {p.category || "Sem categoria"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-white/40">
                      {p.published_at ? format(new Date(p.published_at), "dd/MM/yyyy") : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] tracking-wider",
                      p.status === "PUBLISHED" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {p.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStatus(p)}
                        title={p.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                      >
                        {p.status === "PUBLISHED" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenForm(p)}
                        id={`edit-post-${p.id}`}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(p.id)}
                        className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#e8440c]" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/40 text-sm">
              Nenhum post encontrado.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredPosts.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  {/* Header: Image + Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden shrink-0 border border-white/10">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-full h-full p-3 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{p.title}</p>
                      <p className="text-[11px] text-white/40 font-mono truncate">/{p.slug}</p>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">
                      <Tag className="w-3 h-3 mr-1" />
                      {p.category || "Sem categoria"}
                    </Badge>
                    <Badge className={cn(
                      "font-bold text-[10px] tracking-wider",
                      p.status === "PUBLISHED" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {p.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                    </Badge>
                    <span className="text-[11px] text-white/40">
                      {p.published_at ? format(new Date(p.published_at), "dd/MM/yyyy") : "-"}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleStatus(p)}
                      className="text-white/40 hover:text-white hover:bg-white/5 h-8 text-xs px-3"
                    >
                      {p.status === "PUBLISHED" ? (
                        <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Despublicar</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Publicar</>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenForm(p)}
                      className="text-white/40 hover:text-white hover:bg-white/5 h-8 text-xs px-3"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(p.id)}
                      className="text-white/40 hover:text-red-400 hover:bg-red-400/10 h-8 text-xs px-3 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-none sm:max-w-4xl w-full h-dvh sm:h-auto sm:max-h-[90vh] !inset-0 sm:!inset-auto !translate-x-0 sm:!translate-x-[-50%] !translate-y-0 sm:!translate-y-[-50%] !rounded-none sm:!rounded-2xl overflow-y-auto bg-[#0a1628] border-white/10 text-white p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">
              {editingPost ? "Editar Artigo" : "Novo Artigo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-2 sm:py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Título do Artigo</Label>
                <Input 
                  value={formData.title || ""} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: A importância das missões"
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Slug (URL)</Label>
                <Input 
                  value={formData.slug || ""} 
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                  placeholder="ex-titulo-do-artigo"
                  className="bg-white/5 border-white/10 font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Resumo (Excerpt)</Label>
                <Textarea 
                  value={formData.excerpt || ""} 
                  onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  placeholder="Um breve resumo para a listagem..."
                  className="bg-white/5 border-white/10 resize-none h-24"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Conteúdo</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('content-image-upload')?.click()}
                      className="h-7 text-[10px] bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <ImageIcon className="w-3 h-3 mr-1" /> Inserir Imagem
                    </Button>
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest self-center">Aceita Markdown</span>
                    {isAutoSaving && (
                      <span className="text-[10px] text-brand-orange uppercase font-bold tracking-widest self-center animate-pulse flex items-center gap-1">
                        <Loader2 className="w-2 h-2 animate-spin" /> Salvando...
                      </span>
                    )}
                  </div>
                </div>
                <Textarea 
                  value={formData.content || ""} 
                  onChange={e => {
                    const newContent = e.target.value;
                    setFormData(prev => ({ ...prev, content: newContent }));
                    
                    // Auto-save logic
                    if (editingPost) {
                      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
                      autoSaveTimerRef.current = setTimeout(() => {
                        handleAutoSave(newContent);
                      }, 1000); // Salva após 1 segundo de inatividade
                    }
                  }}
                  placeholder="Escreva seu artigo aqui... Use Markdown para formatação (ex: # Título, **Negrito**)"
                  className="bg-white/5 border-white/10 resize-none h-[400px] font-sans leading-relaxed p-6"
                />
                <input 
                  id="content-image-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    toast.loading("Enviando imagem...");
                    try {
                      const fileExt = file.name.split(".").pop();
                      const fileName = `${Math.random()}.${fileExt}`;
                      const filePath = `post-content/${fileName}`;

                      const { error: uploadError } = await supabase.storage
                        .from("project-covers")
                        .upload(filePath, file);

                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = supabase.storage
                        .from("project-covers")
                        .getPublicUrl(filePath);

                      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;
                      setFormData(prev => ({ 
                        ...prev, 
                        content: (prev.content || "") + imageMarkdown 
                      }));
                      toast.dismiss();
                      toast.success("Imagem inserida!");
                    } catch (error: any) {
                      toast.dismiss();
                      toast.error("Erro no upload: " + error.message);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Categoria</Label>
                <Input 
                  value={formData.category || ""} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  placeholder="Ex: Teologia, Notícias"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Tags (separadas por vírgula)</Label>
                <Input 
                  value={formData.tags?.join(", ") || ""} 
                  onChange={e => setFormData({...formData, tags: e.target.value.split(",").map(t => t.trim())})}
                  placeholder="missões, bíblia, ide"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Capa do Artigo</Label>
                <div 
                  className="relative aspect-video rounded-xl bg-white/5 border-2 border-dashed border-white/10 overflow-hidden group cursor-pointer"
                  onClick={() => document.getElementById('post-cover-upload')?.click()}
                >
                  {formData.cover_image ? (
                    <>
                      <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Upload Capa</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#e8440c]" />
                    </div>
                  )}
                </div>
                <input 
                  id="post-cover-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadCover}
                  className="hidden"
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#e8440c] hover:bg-[#c93a09] font-black h-14 rounded-xl text-lg shadow-lg shadow-[#e8440c]/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingPost ? "Atualizar Artigo" : "Criar Artigo"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
