import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Calendar,
  MapPin,
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/events")({
  component: EventsPage,
});

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  event_date: string | null;
  end_date: string | null;
  status: "DRAFT" | "PUBLISHED";
  max_attendees: number | null;
  registration_url: string | null;
  created_at: string;
};

function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Event>>({
    title: "",
    slug: "",
    description: "",
    location: "",
    city: "",
    state: "",
    event_date: "",
    end_date: "",
    status: "DRAFT",
    max_attendees: 0,
    registration_url: "",
    cover_image: null,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data as Event[]);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenForm(event?: Event) {
    if (event) {
      setEditingEvent(event);
      setFormData({
        ...event,
        event_date: event.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : "",
        end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : "",
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        slug: "",
        description: "",
        location: "",
        city: "",
        state: "",
        event_date: "",
        end_date: "",
        status: "DRAFT",
        max_attendees: 0,
        registration_url: "",
        cover_image: null,
      });
    }
    setIsFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.title || !formData.slug) {
        throw new Error("Título e Slug são obrigatórios.");
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        location: formData.location || null,
        city: formData.city || null,
        state: formData.state || null,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        status: formData.status,
        max_attendees: formData.max_attendees || null,
        registration_url: formData.registration_url || null,
        cover_image: formData.cover_image || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(payload as any)
          .eq("id", editingEvent.id);
        if (error) throw error;
        toast.success("Evento atualizado com sucesso!");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("events")
          .insert([{ ...payload, author_id: user?.id } as any]);
        if (error) throw error;
        toast.success("Evento criado com sucesso!");
      }
      setIsFormOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      toast.success("Evento excluído!");
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  async function handleToggleStatus(event: Event) {
    const newStatus = event.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      toast.success(`Evento ${newStatus === "PUBLISHED" ? "publicado" : "movido para rascunho"}!`);
      fetchEvents();
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
      const filePath = `event-covers/${fileName}`;

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

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Eventos</h2>
          <p className="text-white/50">Gerencie os eventos e congressos do IDE.</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-[#e8440c] hover:bg-[#c93a09] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Evento
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 h-12">
        <Search className="w-5 h-5 text-white/30" />
        <input 
          type="text" 
          placeholder="Buscar eventos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none"
        />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Evento</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
              <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Local</TableHead>
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
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-white/40">
                  Nenhum evento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((e) => (
                <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0 border border-white/10">
                        {e.cover_image ? (
                          <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-2.5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{e.title}</p>
                        <p className="text-[11px] text-white/40 font-mono">/{e.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {e.event_date ? (
                        <>
                          <p className="font-bold">{format(new Date(e.event_date), "dd 'de' MMMM", { locale: ptBR })}</p>
                          <p className="text-white/40">{format(new Date(e.event_date), "HH:mm")}</p>
                        </>
                      ) : (
                        <p className="text-white/40">Não definida</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-bold">{e.location || "Online"}</p>
                      <p className="text-white/40">{e.city}{e.state ? `, ${e.state}` : ""}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] tracking-wider",
                      e.status === "PUBLISHED" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {e.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStatus(e)}
                        title={e.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                      >
                        {e.status === "PUBLISHED" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenForm(e)}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(e.id)}
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
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Título do Evento</Label>
                <Input 
                  value={formData.title || ""} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Congresso Missionário 2024"
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Slug (URL)</Label>
                <Input 
                  value={formData.slug || ""} 
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                  placeholder="ex-congresso-2024"
                  className="bg-white/5 border-white/10 font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Descrição</Label>
                <Textarea 
                  value={formData.description || ""} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes sobre o evento..."
                  className="bg-white/5 border-white/10 resize-none h-48"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Data de Início</Label>
                  <Input 
                    type="datetime-local"
                    value={formData.event_date || ""} 
                    onChange={e => setFormData({...formData, event_date: e.target.value})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Data de Término</Label>
                  <Input 
                    type="datetime-local"
                    value={formData.end_date || ""} 
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Local do Evento</Label>
                <Input 
                  value={formData.location || ""} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Igreja Central ou Online"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Cidade</Label>
                  <Input 
                    value={formData.city || ""} 
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: São Paulo"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Estado (UF)</Label>
                  <Input 
                    value={formData.state || ""} 
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    placeholder="Ex: SP"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">URL de Inscrição</Label>
                <Input 
                  value={formData.registration_url || ""} 
                  onChange={e => setFormData({...formData, registration_url: e.target.value})}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/50 tracking-widest uppercase">Capa do Evento</Label>
                <div 
                  className="relative aspect-video rounded-xl bg-white/5 border-2 border-dashed border-white/10 overflow-hidden group cursor-pointer"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  {formData.cover_image ? (
                    <>
                      <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Calendar className="w-8 h-8 text-white" />
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
                  id="cover-upload"
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
                    editingEvent ? "Atualizar Evento" : "Criar Evento"
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
