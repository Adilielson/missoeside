import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [env, setEnv] = useState("sandbox");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const keyMap = Object.fromEntries(data.map(item => [item.key, item.value]));
        setApiKey(keyMap.ASAAS_API_KEY || "");
        setEnv(keyMap.ASAAS_ENV || "sandbox");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = [
        { key: "ASAAS_API_KEY", value: apiKey },
        { key: "ASAAS_ENV", value: env }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(update);
        if (error) throw error;
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2">Configurações</h1>
        <p className="text-white/60">Gerencie as integrações e parâmetros do sistema.</p>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Integração Asaas</CardTitle>
          <CardDescription className="text-white/40">
            Configure sua chave de API e o ambiente de processamento de pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="env">Ambiente</Label>
            <Select value={env} onValueChange={setEnv}>
              <SelectTrigger id="env" className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                <SelectItem value="production">Produção (Real)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/40 flex items-center gap-1">
              Ambiente atual: <span className={env === 'sandbox' ? 'text-yellow-500 font-bold uppercase' : 'text-green-500 font-bold uppercase'}>{env}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave de API (Access Token)</Label>
            <Input 
              id="apiKey"
              type="password"
              placeholder="Digite seu token do Asaas"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-white/40">
                O token pode ser gerado em Configurações {">"} Integrações no painel do Asaas.
              </p>
              <a 
                href={env === 'sandbox' ? 'https://sandbox.asaas.com/customerConfig/index' : 'https://www.asaas.com/customerConfig/index'} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-brand-orange hover:underline flex items-center gap-1"
              >
                Abrir painel Asaas <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-6"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
