import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, Lock, QrCode, CreditCard, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import logoIde from "@/assets/logo-ide.png";
import bgImage from "@/assets/africa-xai-xai.png";

export const Route = createFileRoute("/doar")({
  head: () => ({
    meta: [
      { title: "Doe Agora — IDE Missões para o Mundo" },
      { name: "description", content: "Faça uma doação e transforme vidas através de missões." },
      { property: "og:title", content: "Doe Agora — IDE Missões" },
      { property: "og:description", content: "Sua doação transforma vidas. Contribua hoje." },
    ],
  }),
  component: DoarPage,
});

const META = 500000;
const PRESETS = [200, 100, 75, 50, 25];
type Method = "PIX" | "CREDIT_CARD" | "BOLETO";
type DonationType = "MONTHLY" | "ONE_TIME";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DoarPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { project?: string };
  const projectSlug = search.project;

  const [raised, setRaised] = useState(0);
  const [type, setType] = useState<DonationType>("ONE_TIME");
  const [amount, setAmount] = useState<number>(100);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [method, setMethod] = useState<Method>("PIX");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<{ name: string; cover_image: string | null; short_description: string | null } | null>(null);

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [birth, setBirth] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // card
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // result modals
  const [pixData, setPixData] = useState<{ qr: string | null; payload: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("donations")
        .select("amount,status")
        .in("status", ["CONFIRMED", "RECEIVED"]);
      if (data) setRaised(data.reduce((s: number, d: { amount: number | string | null }) => s + Number(d.amount || 0), 0));
    })();

    if (projectSlug) {
      (async () => {
        const { data } = await supabase
          .from("projects")
          .select("name, cover_image, short_description")
          .eq("slug", projectSlug)
          .single();
        if (data) setProjectData(data);
      })();
    }
  }, [projectSlug]);

  const finalAmount = customMode ? Number(customValue.replace(",", ".")) || 0 : amount;
  const progress = Math.min(100, (raised / META) * 100);

  async function handleSubmit() {
    if (!accepted) return toast.error("Aceite as Políticas de Privacidade.");
    if (!name || !phone || !cpf || !postalCode) return toast.error("Preencha os campos obrigatórios (incluindo o CEP).");
    if (finalAmount < 5) return toast.error("Valor mínimo: R$ 5,00");
    if (method === "CREDIT_CARD" && (!cardNumber || !cardExp || !cardCvv))
      return toast.error("Preencha os dados do cartão.");

    setLoading(true);
    try {
      // Parse expiry: aceita "MM/AA", "MM/AAAA" ou "MMAA"
      const cleanExp = cardExp.replace(/\D/g, "");
      const mm = cleanExp.slice(0, 2);
      const yyRaw = cleanExp.slice(2);
      const yy = yyRaw.length === 2 ? `20${yyRaw}` : yyRaw;
      
      if (method === "CREDIT_CARD" && (mm.length !== 2 || yy.length !== 4)) {
        setLoading(false);
        return toast.error("Validade do cartão inválida. Use MM/AA");
      }
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          donor_name: name, // Envia o nome real para o processamento interno/Asaas
          donor_email: email,
          donor_phone: phone,
          donor_cpf: cpf,
          is_anonymous: isAnonymous,
          donor_birthdate: birth,
          donor_postal_code: postalCode,
          amount: finalAmount,
          type,
          payment_method: method,
          campaign: projectSlug || "Geral",
          project_name: projectData?.name || "Geral",
          card:
            method === "CREDIT_CARD"
              ? {
                  holderName: name,
                  number: cardNumber,
                  expiryMonth: mm,
                  expiryYear: yy,
                  ccv: cardCvv,
                }
              : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success("Doação registrada! Obrigado 💛");

      if (method === "PIX") {
        setPixData({ qr: data.pix_qrcode, payload: data.pix_payload });
      } else if (method === "BOLETO" && data.boleto_url) {
        window.open(data.boleto_url, "_blank");
        navigate({ 
          to: "/obrigado", 
          search: { name: name, project: projectData?.name || "IDE Missões" } 
        });
      } else if (method === "CREDIT_CARD") {
        toast.success("Pagamento processado com sucesso!");
        navigate({ 
          to: "/obrigado", 
          search: { name: name, project: projectData?.name || "IDE Missões" } 
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar doação.");
    } finally {
      setLoading(false);
    }
  }

  function copyPix() {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-brand-dark">
      {/* LEFT: Form */}
      <section className="w-full lg:w-[45%] flex flex-col px-5 sm:px-10 py-8 overflow-y-auto">
        <Link to="/" className="inline-block mb-6">
          <img src={logoIde} alt="IDE Missões" className="h-12 w-auto" />
        </Link>

        <div className="max-w-xl w-full mx-auto bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Faça uma Doação Agora</h1>
          <p className="text-white/60 mt-1">Sua doação transforma vidas!</p>

          {/* Type */}
          <Section title="SELECIONE TIPO DA DOAÇÃO">
            <div className="grid grid-cols-2 gap-3">
              {(["MONTHLY", "ONE_TIME"] as DonationType[]).map((t) => (
                <Toggle key={t} active={type === t} onClick={() => setType(t)}>
                  {t === "MONTHLY" ? "Mensal" : "Único"}
                </Toggle>
              ))}
            </div>
          </Section>

          {/* Amount */}
          <Section title="SELECIONE VALOR DA DOAÇÃO">
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map((v) => (
                <Toggle
                  key={v}
                  active={!customMode && amount === v}
                  onClick={() => {
                    setCustomMode(false);
                    setAmount(v);
                  }}
                >
                  {brl(v)}
                </Toggle>
              ))}
              <Toggle active={customMode} onClick={() => setCustomMode(true)}>
                OUTRO
              </Toggle>
            </div>
            {customMode && (
              <Input
                type="text"
                placeholder="Valor personalizado (R$ 0,00)"
                className="mt-3 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
              />
            )}
          </Section>

          {/* Personal */}
          <Section title="SEUS DADOS">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Nome Completo*" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              <Input placeholder="Celular com DDD*" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              <Input placeholder="CPF/CNPJ*" value={cpf} onChange={(e) => setCpf(e.target.value)} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              <Input 
                placeholder="CEP*" 
                value={postalCode} 
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 8))} 
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" 
              />
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-white/70 cursor-pointer bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-brand-orange rounded"
              />
              <span className="font-medium">Quero que minha doação seja anônima no site</span>
            </label>
          </Section>

          {/* Method */}
          <Section title="SELECIONE FORMA DE PAGAMENTO">
            <div className="grid grid-cols-3 gap-3">
              <MethodBtn active={method === "PIX"} onClick={() => setMethod("PIX")} icon={<QrCode className="w-4 h-4" />}>
                PIX
              </MethodBtn>
              <MethodBtn active={method === "CREDIT_CARD"} onClick={() => setMethod("CREDIT_CARD")} icon={<CreditCard className="w-4 h-4" />}>
                CARTÃO
              </MethodBtn>
              <MethodBtn active={method === "BOLETO"} onClick={() => setMethod("BOLETO")} icon={<FileText className="w-4 h-4" />}>
                BOLETO
              </MethodBtn>
            </div>

            {method === "CREDIT_CARD" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input placeholder="Número do cartão" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="h-12 col-span-2 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                <Input 
                  placeholder="Validade (MM/AA)" 
                  value={cardExp} 
                  maxLength={5}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardExp(v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                  }} 
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" 
                />
                <Input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
            )}
          </Section>

          {/* Terms */}
          <label className="flex items-start gap-2 mt-6 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 accent-brand-orange"
            />
            <span>Li e aceito as Políticas de Privacidade</span>
          </label>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 h-14 text-base font-black bg-[#e8440c] hover:bg-[#c93a09] text-white rounded-xl shadow-lg shadow-[#e8440c]/30"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                DOAR {brl(finalAmount)}
              </>
            )}
          </Button>

          <div className="mt-5 flex flex-col items-center gap-1 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Você está em um ambiente seguro
            </span>
            <span>Powered by Asaas</span>
          </div>
        </div>
      </section>

      {/* RIGHT: Image / Project Info */}
      <aside className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <img 
          src={projectData?.cover_image || bgImage} 
          alt={projectData?.name || "Missões IDE"} 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/60 via-[#0a1628]/40 to-[#e8440c]/30" />
        <div className="absolute bottom-10 left-10 right-10 text-white z-10">
          {projectData ? (
            <>
              <div className="inline-flex items-center gap-2 bg-brand-orange/90 px-4 py-2 rounded-full mb-6 backdrop-blur-md shadow-lg border border-white/20">
                <Heart className="w-4 h-4 fill-white animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Projeto Selecionado</span>
              </div>
              <h2 className="text-5xl font-black leading-tight drop-shadow-2xl mb-4">
                {projectData.name}
              </h2>
              <p className="text-lg text-white/90 max-w-xl drop-shadow-lg leading-relaxed font-medium">
                {projectData.short_description}
              </p>
              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-sm font-bold text-white/70 uppercase tracking-widest">
                  Destino da doação: <span className="text-brand-orange">{projectData.name}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-black leading-tight drop-shadow-lg">
                Cada doação alcança uma vida.
              </h2>
              <p className="mt-2 text-white/90 max-w-md drop-shadow">
                Juntos, levamos esperança aos lugares onde ninguém mais vai.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* PIX modal */}
      <Dialog open={!!pixData} onOpenChange={(o) => !o && setPixData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pague com PIX</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {pixData?.qr ? (
              <img src={pixData.qr} alt="QR Code PIX" className="w-64 h-64 rounded-lg border" />
            ) : (
              <p className="text-sm text-slate-500">QR Code indisponível.</p>
            )}
            {pixData?.payload && (
              <>
                <p className="text-xs text-slate-500 break-all bg-slate-50 p-3 rounded font-mono">
                  {pixData.payload}
                </p>
                <Button onClick={copyPix} className="w-full bg-[#e8440c] hover:bg-[#c93a09]">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold text-white/50 tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl font-bold text-sm border-2 transition-all",
        active
          ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-brand-orange/30"
          : "bg-white/5 border-white/10 text-white/80 hover:border-brand-orange/60"
      )}
    >
      {children}
    </button>
  );
}

function MethodBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl font-bold text-xs sm:text-sm border-2 flex items-center justify-center gap-2 transition-all",
        active
          ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-brand-orange/30"
          : "bg-white/5 border-white/10 text-white/80 hover:border-brand-orange/60"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
