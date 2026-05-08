import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Upload,
  Loader2,
  Globe,
  MapPin,
  Target,
  Image as ImageIcon
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/projects")({
  component: ProjectsPage,
});

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
  goal_amount: number | null;
  current_amount: number | null;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean | null;
  gallery: string[] | null;
  email_subject: string | null;
  email_template: string | null;
  created_at: string;
};

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<Project>>({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    category: "",
    country: "",
    city: "",
    goal_amount: 0,
    current_amount: 0,
    status: "DRAFT",
    featured: false,
    cover_image: null,
    gallery: [],
    email_subject: "Obrigado pela sua doação!",
    email_template: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenForm(project?: Project) {
    if (project) {
      setEditingProject(project);
      setFormData(project);
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        short_description: "",
        category: "",
        country: "",
        city: "",
        goal_amount: 0,
        current_amount: 0,
        status: "DRAFT",
        featured: false,
        cover_image: null,
        gallery: [],
      });
    }
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.name || !formData.slug) {
        throw new Error("Nome e Slug são obrigatórios.");
      }

      // Narrowing types for Supabase insert/update
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        category: formData.category,
        country: formData.country,
        city: formData.city,
        goal_amount: formData.goal_amount,
        current_amount: formData.current_amount,
        status: formData.status,
        featured: formData.featured,
        cover_image: formData.cover_image,
        gallery: formData.gallery || [],
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingProject.id);
        if (error) throw error;
        toast.success("Projeto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("projects")
          .insert([payload]);
        if (error) throw error;
        toast.success("Projeto criado com sucesso!");
      }
      setIsFormOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("Projeto excluído!");
      fetchProjects();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  async function handleToggleStatus(project: Project) {
    const newStatus = project.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", project.id);
      if (error) throw error;
      toast.success(`Projeto ${newStatus === "PUBLISHED" ? "publicado" : "movido para rascunho"}!`);
      fetchProjects();
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
      const filePath = `covers/${fileName}`;

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

  async function handleUploadGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("project-covers")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("project-covers")
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ 
        ...prev, 
        gallery: [...(prev.gallery || []), ...urls] 
      }));
      toast.success(`${urls.length} imagem(ns) enviada(s)!`);
    } catch (error: any) {
      toast.error("Erro no upload da galeria: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveGalleryImage(index: number) {
    setFormData(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Projetos / Missões</h2>
          <p className="text-white/50">Gerencie as missões e causas do IDE.</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-[#e8440c] hover:bg-[#c93a09] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Projeto
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
        <Search className="w-5 h-5 text-white/30" />
        <input 
          type="text" 
          placeholder="Buscar projetos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none"
        />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Projeto</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Meta</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e8440c]" />
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-white/40">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((p) => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0 border border-white/10">
                        {p.cover_image ? (
                          <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-2.5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[11px] text-white/40 font-mono">/{p.slug}</p>
                      </div>
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
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.goal_amount || 0)}</p>
                      <p className="text-[11px] text-white/40">Arrecadado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.current_amount || 0)}</p>
                    </div>
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingProject ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Nome do Projeto</Label>
                <Input 
                  value={formData.name || ""} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Missão Moçambique"
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Slug (URL)</Label>
                <Input 
                  value={formData.slug || ""} 
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                  placeholder="ex-missao-mocambique"
                  className="bg-white/5 border-white/10 font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Descrição Curta</Label>
                <Textarea 
                  value={formData.short_description || ""} 
                  onChange={e => setFormData({...formData, short_description: e.target.value})}
                  placeholder="Uma frase impactante sobre o projeto..."
                  className="bg-white/5 border-white/10 resize-none h-20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Objetivo do projeto</Label>
                <Textarea 
                  value={formData.description || ""} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o objetivo e detalhes do projeto..."
                  className="bg-white/5 border-white/10 resize-none h-48"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Categoria</Label>
                  <Input 
                    value={formData.category || ""} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Educação"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">País</Label>
                  <Input 
                    value={formData.country || ""} 
                    onChange={e => setFormData({...formData, country: e.target.value})}
                    placeholder="Ex: Moçambique"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Meta (R$)</Label>
                  <Input 
                    type="number"
                    value={formData.goal_amount || 0} 
                    onChange={e => setFormData({...formData, goal_amount: Number(e.target.value)})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Arrecadado (R$)</Label>
                  <Input 
                    type="number"
                    value={formData.current_amount || 0} 
                    onChange={e => setFormData({...formData, current_amount: Number(e.target.value)})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Imagem de Capa</Label>
                <div className="flex flex-col gap-4">
                  {formData.cover_image && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                      <img src={formData.cover_image} alt="Preview" className="w-full h-full object-cover" />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        onClick={() => setFormData({...formData, cover_image: null})}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="bg-white/5 border-white/10 flex-1 h-12 border-dashed"
                      onClick={() => document.getElementById('cover-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {formData.cover_image ? "Trocar Imagem" : "Upload Capa"}
                    </Button>
                    <input 
                      id="cover-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUploadCover}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Galeria de Imagens</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(formData.gallery || []).map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => document.getElementById('gallery-upload')?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-brand-orange/50 flex flex-col items-center justify-center gap-2 transition-colors bg-white/5"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
                  </button>
                </div>
                <input 
                  id="gallery-upload" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleUploadGallery}
                />
              </div>


              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Destaque</Label>
                  <p className="text-xs text-white/50">Mostrar na página inicial</p>
                </div>
                <Switch 
                  checked={formData.featured || false} 
                  onCheckedChange={v => setFormData({...formData, featured: v})} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Status</Label>
                  <p className="text-xs text-white/50">{formData.status === 'PUBLISHED' ? 'Público no site' : 'Apenas admin vê'}</p>
                </div>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: "DRAFT" | "PUBLISHED") => setFormData({...formData, status: v})}
                >
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1628] border-white/10 text-white">
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="md:col-span-2 pt-4 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsFormOpen(false)}
                className="hover:bg-white/5 text-white/60 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-[#e8440c] hover:bg-[#c93a09] font-bold min-w-[120px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Projeto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
