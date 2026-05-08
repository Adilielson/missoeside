import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  Plug,
  Shield,
  CreditCard,
  Mail,
  MessageCircle,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  head: () => ({ meta: [{ title: "Superadmin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SuperadminPage,
});

type FieldDef = {
  key: string;
  label: string;
  description: string;
  placeholder?: string;
};

type GroupDef = {
  id: string;
  name: string;
  tagline: string;
  icon: typeof CreditCard;
  service?: "asaas" | "resend" | "uazapi";
  fields: FieldDef[];
};

const GROUPS: GroupDef[] = [
  {
    id: "asaas",
    name: "Asaas",
    tagline: "Gateway de pagamento",
    icon: CreditCard,
    service: "asaas",
    fields: [
      { key: "ASAAS_API_KEY", label: "API Key", description: "Chave da API do Asaas (production ou sandbox).", placeholder: "$aact_..." },
      { key: "ASAAS_BASE_URL", label: "Base URL", description: "URL da API. Sandbox ou produção.", placeholder: "https://api-sandbox.asaas.com/v3" },
      { key: "ASAAS_WEBHOOK_TOKEN", label: "Webhook Token", description: "Token secreto enviado no header asaas-access-token." },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    tagline: "Envio de emails transacionais",
    icon: Mail,
    service: "resend",
    fields: [
      { key: "RESEND_API_KEY", label: "API Key", description: "Chave da API do Resend.", placeholder: "re_..." },
      { key: "RESEND_FROM", label: "Email Remetente", description: "Email verificado usado como From.", placeholder: "contato@ide.org.br" },
    ],
  },
  {
    id: "uazapi",
    name: "UazAPI",
    tagline: "Mensagens via WhatsApp",
    icon: MessageCircle,
    service: "uazapi",
    fields: [
      { key: "UAZAPI_URL", label: "URL da Instância", description: "URL completa da sua instância UazAPI.", placeholder: "https://free.uazapi.com" },
      { key: "UAZAPI_TOKEN", label: "Token", description: "Token de autenticação da instância." },
      { key: "UAZAPI_INSTANCE", label: "Nome da Instância", description: "Identificador da instância configurada." },
    ],
  },
];

type SettingState = { configured: boolean; preview: string; updated_at: string | null };

function SuperadminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeGroup, setActiveGroup] = useState<string>(GROUPS[0].id);
  const [settings, setSettings] = useState<Record<string, SettingState>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingSvc, setTestingSvc] = useState<string | null>(null);

  async function call(action: string, body: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke("superadmin-settings", {
      body: { action, ...body },
      headers: { "x-superadmin-password": password },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const data = await call("list");
      setSettings(data.settings);
      setAuthed(true);
    } catch (err: any) {
      toast.error(err.message === "Unauthorized" ? "Senha incorreta" : err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function refresh() {
    try {
      const data = await call("list");
      setSettings(data.settings);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function save(key: string) {
    if (!values[key]) return toast.error("Digite um valor antes de salvar.");
    setSavingKey(key);
    try {
      await call("save", { key, value: values[key] });
      toast.success(`${key} salvo`);
      setValues((v) => ({ ...v, [key]: "" }));
      await refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  async function test(service: string) {
    setTestingSvc(service);
    try {
      const r = await call("test", { service });
      if (r.ok) toast.success(r.message);
      else toast.error(r.message || "Falha no teste");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTestingSvc(null);
    }
  }

  function logout() {
    setAuthed(false);
    setPassword("");
    setSettings({});
    setValues({});
  }

  // ---------- LOGIN ----------
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,68,12,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(232,68,12,0.08),transparent_50%)]" />
        <form onSubmit={handleLogin} className="relative w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e8440c] to-[#c93a09] flex items-center justify-center shadow-lg shadow-[#e8440c]/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Superadmin</h1>
              <p className="text-xs text-white/50">Acesso restrito</p>
            </div>
          </div>
          <label className="text-xs font-bold text-white/60 tracking-wider">SENHA DE ACESSO</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 h-12 bg-black/30 border-white/10 text-white"
            autoFocus
          />
          <Button
            type="submit"
            disabled={authLoading || !password}
            className="w-full mt-5 h-12 bg-[#e8440c] hover:bg-[#c93a09] font-bold"
          >
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Entrar</>}
          </Button>
        </form>
      </main>
    );
  }

  // ---------- DASHBOARD ----------
  const group = GROUPS.find((g) => g.id === activeGroup)!;
  const groupConfigured = group.fields.every((f) => settings[f.key]?.configured);

  return (
    <main className="min-h-screen bg-[#0a1628] text-white flex">
      {/* SIDEBAR */}
      <aside className="w-72 shrink-0 border-r border-white/5 bg-black/20 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8440c] to-[#c93a09] flex items-center justify-center shadow-lg shadow-[#e8440c]/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight">Superadmin</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Painel Dev</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[10px] font-bold text-white/30 tracking-widest px-3 py-2">INTEGRAÇÕES</p>
          {GROUPS.map((g) => {
            const Icon = g.icon;
            const ok = g.fields.every((f) => settings[f.key]?.configured);
            const some = g.fields.some((f) => settings[f.key]?.configured);
            const active = g.id === activeGroup;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                  active
                    ? "bg-[#e8440c]/15 border border-[#e8440c]/30 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    active ? "bg-[#e8440c] text-white" : "bg-white/5 text-white/70"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.name}</p>
                  <p className="text-[11px] text-white/40 truncate">{g.tagline}</p>
                </div>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : some ? "bg-amber-400" : "bg-white/20"
                  )}
                />
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <section className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 lg:p-12">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e8440c] to-[#c93a09] flex items-center justify-center shadow-xl shadow-[#e8440c]/20">
                <group.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">{group.name}</h2>
                <p className="text-sm text-white/50">{group.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold",
                  groupConfigured
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                )}
              >
                {groupConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {groupConfigured ? "Tudo configurado" : "Pendente"}
              </span>
              {group.service && (
                <Button
                  type="button"
                  size="sm"
                  disabled={testingSvc === group.service || !groupConfigured}
                  onClick={() => test(group.service!)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                >
                  {testingSvc === group.service ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                  Testar conexão
                </Button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {group.fields.map((f) => {
              const s = settings[f.key];
              const isSaving = savingKey === f.key;
              const isShown = !!show[f.key];
              return (
                <div
                  key={f.key}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{f.label}</h3>
                        {s?.configured ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> CONFIGURADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold tracking-wider">
                            <AlertCircle className="w-3 h-3" /> NÃO CONFIGURADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-1">{f.description}</p>
                      {s?.preview && (
                        <p className="text-xs text-white/40 mt-2 font-mono bg-black/30 inline-block px-2 py-1 rounded">
                          {s.preview}
                        </p>
                      )}
                    </div>
                    <code className="text-[10px] text-white/30 font-mono px-2 py-1 rounded bg-black/20 shrink-0">
                      {f.key}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={isShown ? "text" : "password"}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        placeholder={f.placeholder ?? (s?.configured ? "Digite para substituir" : "Digite o valor")}
                        className="h-11 bg-black/30 border-white/10 text-white pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((sh) => ({ ...sh, [f.key]: !sh[f.key] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
                      >
                        {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={() => save(f.key)}
                      disabled={isSaving || !values[f.key]}
                      className="h-11 bg-[#e8440c] hover:bg-[#c93a09] font-bold px-5"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-white/30 mt-10">
            Os valores são armazenados em <code className="text-white/50">system_settings</code> e usados pelas Edge Functions.
          </p>
        </div>
      </section>
    </main>
  );
}
