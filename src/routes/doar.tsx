// ============================================================================
// ⚠️ ADAPTAÇÃO TEMPORÁRIA — LANÇAMENTO SEM ASAAS EM PRODUÇÃO
// ----------------------------------------------------------------------------
// Esta página foi substituída temporariamente por dados bancários + PIX
// enquanto a homologação do Asaas não está concluída.
// O código original do checkout Asaas está preservado em:
//   src/routes/_doar.asaas.backup.tsx.txt
// Para reverter: substituir o conteúdo deste arquivo pelo do backup.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Copy, Check, Landmark, ArrowLeft, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ofertaMissionaria from "@/assets/qrcode-pix-ide.png.asset.json";
import logoIde from "@/assets/logo-ide.png";
import { trackEvent } from "@/hooks/useAnalytics";

export const Route = createFileRoute("/doar")({
  head: () => ({
    meta: [
      { title: "Doe Agora — IDE Missões para o Mundo" },
      { name: "description", content: "Faça uma doação via PIX ou transferência bancária e transforme vidas através de missões." },
      { property: "og:title", content: "Doe Agora — IDE Missões" },
      { property: "og:description", content: "Sua doação transforma vidas. Contribua hoje via PIX ou transferência." },
    ],
  }),
  component: DoarPage,
});

const PIX_KEY = "65.267.286/0001-11";
const TITULAR = "Agência Cristã Missionária IDE";
const BANCO = "Caixa Econômica Federal";
const AGENCIA = "0553";
const CONTA = "0555 / 1292 / 000570691693-0";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado!`);
      const isPix = /pix|cnpj/i.test(label);
      trackEvent(isPix ? "copiar_pix_cnpj" : "copiar_dado_bancario", {
        metadata: { location: "doar_page", label },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`Copie manualmente: ${value}`);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-white/10 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-bold">{label}</p>
        <p className="font-semibold text-white truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 w-10 h-10 rounded-full bg-white/5 hover:bg-brand-orange/20 border border-white/10 hover:border-brand-orange flex items-center justify-center transition-all"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="w-4 h-4 text-brand-orange" /> : <Copy className="w-4 h-4 text-white/70" />}
      </button>
    </div>
  );
}

function DoarPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-orange/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-orange/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-brand-orange transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
          </Link>
          <img src={logoIde} alt="IDE Missões" className="h-10 w-auto" />
        </div>

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-full px-4 py-2 mb-6">
            <Heart className="w-4 h-4 text-brand-orange fill-brand-orange" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">Oferta Missionária</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
            Sua doação transforma <span className="text-brand-orange">vidas</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Contribua de forma rápida e segura via <strong className="text-white">PIX</strong> ou
            <strong className="text-white"> transferência bancária</strong>. Cada centavo é direcionado
            integralmente para nossas frentes missionárias.
          </p>
        </div>

        {/* Donation Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* PIX */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-2xl font-black">PIX</h2>
                <p className="text-white/50 text-sm">Aponte a câmera do celular</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-3 sm:p-4 mb-6 max-w-sm mx-auto">
              <img
                src={`https://missoeside.lovable.app${ofertaMissionaria.url}`}
                alt="QR Code PIX - Oferta Missionária IDE"
                className="w-full h-auto rounded-2xl"
              />
            </div>

            <div className="space-y-0">
              <CopyRow label="Chave PIX (CNPJ)" value={PIX_KEY} />
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center">
                <Landmark className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Transferência Bancária</h2>
                <p className="text-white/50 text-sm">Caixa Econômica Federal</p>
              </div>
            </div>

            <div className="space-y-0">
              <CopyRow label="Titular" value={TITULAR} />
              <CopyRow label="Banco" value={BANCO} />
              <CopyRow label="Agência" value={AGENCIA} />
              <CopyRow label="Conta Corrente" value={CONTA} />
              <CopyRow label="CNPJ" value={PIX_KEY} />
            </div>

            <div className="mt-6 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 text-sm text-white/80">
              <p>
                Após realizar a doação, se desejar, envie o comprovante para nosso contato e ajudaremos
                a direcionar sua contribuição. <strong className="text-brand-orange">Deus abençoe!</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-10 text-white/40 text-sm">
          <p>Em breve disponibilizaremos doações por cartão de crédito e boleto.</p>
        </div>
      </div>
    </main>
  );
}
