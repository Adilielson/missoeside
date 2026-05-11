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
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/team")({
  component: TeamAdminPage,
});

type TeamMember = {
  id: string;
  name: string;
  role: string;
  area: string;
  slug: string;
  short_bio: string | null;
  full_bio: string | null;
  image_url: string | null;
  specialties: string[];
  featured: boolean;
  display_order: number;
  status: "DRAFT" | "PUBLISHED";
  instagram_url: string | null;
  linkedin_url: string | null;
  created_at: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const empty: Partial<TeamMember> = {
  name: "",
  role: "",
  area: "",
  slug: "",
  short_bio: "",
  full_bio: "",
  image_url: "",
  specialties: [],
  featured: false,
  display_order: 0,
  status: "DRAFT",
  instagram_url: "",
  linkedin_url: "",
};

function TeamAdminPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<TeamMember>>(empty);
  const [specialtiesInput, setSpecialtiesInput] = useState("");

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setMembers(data as TeamMember[]);
    } catch (e: any) {
      toast.error("Erro ao carregar equipe: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function openForm(m?: TeamMember) {
    if (m) {
      setEditing(m);
      setFormData(m);
      setSpecialtiesInput((m.specialties || []).join(", "));
    } else {
      setEditing(null);
      setFormData(empty);
      setSpecialtiesInput("");
    }
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.name || !formData.role || !formData.area) {
        throw new Error("Nome, Cargo e Área são obrigatórios.");
      }
      const slug = formData.slug?.trim() || slugify(formData.name);
      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name!,
        role: formData.role!,
        area: formData.area!,
        slug,
        short_bio: formData.short_bio || null,
        full_bio: formData.full_bio || null,
        image_url: formData.image_url || null,
        specialties,
        featured: !!formData.featured,
        display_order: Number(formData.display_order) || 0,
        status: (formData.status as "DRAFT" | "PUBLISHED") || "DRAFT",
        instagram_url: formData.instagram_url || null,
        linkedin_url: formData.linkedin_url || null,
      };

      if (editing) {
        const { error } = await supabase.from("team_members").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Membro atualizado!");
      } else {
        const { error } = await supabase.from("team_members").insert([payload]);
        if (error) throw error;
        toast.success("Membro criado!");
      }
      setIsFormOpen(false);
      fetchMembers();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este membro?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Excluído!");
    fetchMembers();
  }

  async function toggleStatus(m: TeamMember) {
    const newStatus = m.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const { error } = await supabase
      .from("team_members")
      .update({ status: newStatus })
      .eq("id", m.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success(newStatus === "PUBLISHED" ? "Publicado!" : "Movido para rascunho");
    fetchMembers();
  }

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.area.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Equipe</h2>
          <p className="text-white/50">Gerencie os membros da equipe do IDE Missões.</p>
        </div>
        <Button onClick={() => openForm()} className="bg-[#e8440c] hover:bg-[#c93a09] font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Membro
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
        <Search className="w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nome, cargo ou área..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none"
        />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Membro</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Cargo</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Área</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e8440c]" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-white/40">Nenhum membro encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/10">
                        {m.image_url ? (
                          <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-2.5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{m.name}</p>
                        <p className="text-[11px] text-white/40 font-mono">/{m.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm">{m.role}</span></TableCell>
                  <TableCell><span className="text-sm text-white/60">{m.area}</span></TableCell>
                  <TableCell>
                    <Badge className={cn("font-bold text-[10px] tracking-wider",
                      m.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>
                      {m.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(m)} className="text-white/40 hover:text-white hover:bg-white/5">
                        {m.status === "PUBLISHED" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openForm(m)} className="text-white/40 hover:text-white hover:bg-white/5">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-white/40 hover:text-red-400 hover:bg-red-400/10">
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editing ? "Editar Membro" : "Novo Membro"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Nome</Label>
              <Input value={formData.name || ""} onChange={(e) => {
                const name = e.target.value;
                setFormData({ ...formData, name, slug: editing ? formData.slug : slugify(name) });
              }} className="bg-white/5 border-white/10" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Cargo</Label>
              <Input value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="Ex: Diretor Geral" className="bg-white/5 border-white/10" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Área de Atuação no IDE</Label>
              <Input value={formData.area || ""} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="Ex: Liderança Executiva" className="bg-white/5 border-white/10" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Slug (URL)</Label>
              <Input value={formData.slug || ""} onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })} className="bg-white/5 border-white/10 font-mono" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">URL da Foto</Label>
              <Input value={formData.image_url || ""} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Bio Curta</Label>
              <Textarea value={formData.short_bio || ""} onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })} placeholder="Frase de apresentação..." className="bg-white/5 border-white/10 resize-none h-20" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Bio Completa</Label>
              <Textarea value={formData.full_bio || ""} onChange={(e) => setFormData({ ...formData, full_bio: e.target.value })} placeholder="Descrição detalhada..." className="bg-white/5 border-white/10 resize-none h-40" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Especialidades (separadas por vírgula)</Label>
              <Input value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.target.value)} placeholder="Liderança Executiva, Estratégia de Negócio, Parcerias" className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Instagram</Label>
              <Input value={formData.instagram_url || ""} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/..." className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">LinkedIn</Label>
              <Input value={formData.linkedin_url || ""} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Ordem</Label>
              <Input type="number" value={formData.display_order ?? 0} onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })} className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Status</Label>
              <Select value={formData.status || "DRAFT"} onValueChange={(v) => setFormData({ ...formData, status: v as "DRAFT" | "PUBLISHED" })}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DRAFT">Rascunho</SelectItem><SelectItem value="PUBLISHED">Publicado</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between md:col-span-2 bg-white/5 rounded-xl px-4 py-3">
              <div>
                <Label className="text-sm font-bold">Destaque</Label>
                <p className="text-xs text-white/40">Cartão elevado na home</p>
              </div>
              <Switch checked={!!formData.featured} onCheckedChange={(v) => setFormData({ ...formData, featured: v })} />
            </div>

            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#e8440c] hover:bg-[#c93a09] font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
