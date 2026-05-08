import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Save, Plug, Check, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/superadmin")({
  head: () => ({ meta: [{ title: "Superadmin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SuperadminPage,
});

type FieldDef = {
  key: string;
  label: string;
  description: string;
  service?: "asaas" | "resend" | "uazapi";
  serviceLabel?: string;
};

const FIELDS: FieldDef[] = [
  { key: "ASAAS_API_KEY", label: "Asaas API Key", description: "Chave da API do Asaas (production ou sandbox).", service: "asaas", serviceLabel: "Asaas" },
  { key: "ASAAS_BASE_URL", label: "Asaas Base URL", description: "Ex: https://api-sandbox.asaas.com/v3 ou https://api.asaas.com/v3" },
  { key: "ASAAS_WEBHOOK_TOKEN", label: "Asaas Webhook Token", description: "Token secreto enviado pelo Asaas no header asaas-access-token." },
  { key: "RESEND_API_KEY", label: "Resend API Key", description: "Chave da API do Resend (re_...).", service: "resend", serviceLabel: "Resend" },
  { key: "RESEND_FROM", label: "Resend From", description: "Email remetente verificado. Ex: contato@ide.org.br" },
  { key: "UAZAPI_URL", label: "UazAPI URL", description: "URL completa da sua instância UazAPI.", service: "uazapi", serviceLabel: "UazAPI" },
  { key: "UAZAPI_TOKEN", label: "UazAPI Token", description: "Token de autenticação da instância UazAPI." },
  { key: "UAZAPI_INSTANCE", label: "UazAPI Instance", description: "Nome/identificador da instância configurada." },
];

type SettingState = { configured: boolean; preview: string; updated_at: string | null };

function SuperadminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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
      toast.success(`${key} salvo com sucesso`);
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

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a1628] px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e8440c] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Superadmin</h1>
              <p className="text-xs text-white/50">Acesso restrito ao desenvolvedor</p>
            </div>
          </div>
          <label className="text-xs font-bold text-white/60 tracking-wider">SENHA</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 h-12 bg-white/5 border-white/10 text-white"
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

  return (
    <main className="min-h-screen bg-[#0a1628] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8440c] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Credenciais do Sistema</h1>
              <p className="text-sm text-white/50">Gerencie as integrações externas</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {FIELDS.map((f) => {
            const s = settings[f.key];
            const isSaving = savingKey === f.key;
            const isShown = !!show[f.key];
            return (
              <div key={f.key} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white">{f.label}</h3>
                      {s?.configured ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ✅ Configurado
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ⚠️ Não configurado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1">{f.description}</p>
                    {s?.preview && (
                      <p className="text-xs text-white/40 mt-1 font-mono">Atual: {s.preview}</p>
                    )}
                  </div>
                  {f.service && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testingSvc === f.service || !s?.configured}
                      onClick={() => test(f.service!)}
                      className="bg-transparent border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {testingSvc === f.service ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                      Testar {f.serviceLabel}
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={isShown ? "text" : "password"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={s?.configured ? "Digite para substituir o valor atual" : "Digite o valor"}
                      className="h-11 bg-[#0a1628] border-white/10 text-white pr-10 font-mono text-sm"
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
                    className="h-11 bg-[#e8440c] hover:bg-[#c93a09] font-bold px-4"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          Os valores são armazenados na tabela system_settings e usados pelas Edge Functions.
        </p>
      </div>
    </main>
  );
}
