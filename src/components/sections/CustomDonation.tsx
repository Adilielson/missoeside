// ============================================================================
// ⚠️ ADAPTAÇÃO TEMPORÁRIA — LANÇAMENTO SEM ASAAS EM PRODUÇÃO
// ----------------------------------------------------------------------------
// O painel esquerdo (formulário Asaas) foi substituído por dados bancários
// e QR Code PIX enquanto a integração Asaas não está em produção.
// Para reverter: restaurar este arquivo da versão anterior no histórico.
// As demais rotas (/doar, edge functions, webhooks) seguem intactas.
// ============================================================================
import { motion } from "framer-motion";
import { Copy, Check, Landmark } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import ofertaMissionaria from "@/assets/qrcode-pix-ide.png.asset.json";

const PIX_KEY = "65.267.286/0001-11";
const BANCO = "Caixa Econômica Federal";
const AGENCIA = "0553";
const CONTA = "0555 / 1292 / 000570691693-0";
const TITULAR = "Agência Cristã Missionária IDE";

export function CustomDonation() {
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente: " + PIX_KEY);
    }
  };

  return (
    <section id="doacoes" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-dark/90" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-[32px] sm:rounded-[48px] lg:rounded-[60px] overflow-hidden shadow-2xl">
          {/* Left: PIX + Dados Bancários (substitui temporariamente o form Asaas) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-brand-dark/60 backdrop-blur-md p-8 sm:p-12 lg:p-16 text-white"
          >
            <SectionTag text="Doe via PIX ou Transferência" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3">Oferta Missionária</h2>
            <p className="text-white/60 mb-8 font-medium">
              Aponte a câmera do seu celular para o QR Code abaixo e contribua com qualquer valor.
            </p>

            <div className="bg-white rounded-3xl p-3 sm:p-4 mb-6 max-w-xs mx-auto sm:mx-0">
              <img
                src={`https://missoeside.lovable.app${ofertaMissionaria.url}`}
                alt="QR Code PIX - Oferta Missionária IDE"
                className="w-full h-auto rounded-2xl"
              />
            </div>

            <Button
              onClick={copyPix}
              className="w-full bg-brand-gradient hover:opacity-90 text-white text-base sm:text-lg py-6 sm:py-7 rounded-full shadow-lg shadow-brand-orange/20 transition-all active:scale-95 mb-4"
            >
              {copied ? (
                <>
                  <Check className="mr-2 w-5 h-5" /> Chave PIX copiada
                </>
              ) : (
                <>
                  <Copy className="mr-2 w-5 h-5" /> Copiar Chave PIX (CNPJ)
                </>
              )}
            </Button>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm space-y-1.5">
              <div className="flex items-center gap-2 text-brand-orange font-bold uppercase tracking-widest text-xs mb-2">
                <Landmark className="w-4 h-4" /> Dados Bancários
              </div>
              <p><span className="text-white/50">Titular:</span> <span className="font-semibold">{TITULAR}</span></p>
              <p><span className="text-white/50">Banco:</span> <span className="font-semibold">{BANCO}</span></p>
              <p><span className="text-white/50">Agência:</span> <span className="font-semibold">{AGENCIA}</span></p>
              <p><span className="text-white/50">Conta Corrente:</span> <span className="font-semibold">{CONTA}</span></p>
              <p><span className="text-white/50">Chave PIX (CNPJ):</span> <span className="font-semibold">{PIX_KEY}</span></p>
            </div>
          </motion.div>

          {/* Right: Info Panel (inalterado) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-brand-orange p-8 sm:p-12 lg:p-20 text-white flex flex-col justify-center"
          >
            <SectionTag text="Faça uma Doação" className="bg-white/20 border-white/30" />
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 leading-tight">
              Sua Generosidade Alimenta a Esperança do Mundo
            </h3>
            <p className="text-white/80 mb-10 sm:mb-12 text-base sm:text-lg leading-relaxed">
              Cada centavo doado é direcionado integralmente para as nossas frentes missionárias.
              Juntos, podemos alcançar lugares onde ninguém mais vai.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between font-black text-xl">
                <span>Total Arrecadado</span>
                <span>85%</span>
              </div>
              <div className="h-4 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "85%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-white"
                />
              </div>
              <div className="flex justify-between font-bold opacity-80">
                <span>R$ 425.000,00</span>
                <span>Meta: R$ 500.000,00</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
