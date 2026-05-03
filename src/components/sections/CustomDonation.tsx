import { motion } from "framer-motion";
import { Heart, DollarSign } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { cn } from "@/lib/utils";

const quickAmounts = [10, 20, 50, 100, 200];

export function CustomDonation() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");

  return (
    <section id="doacoes" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
          alt="Donate background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-dark/90" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-[32px] sm:rounded-[48px] lg:rounded-[60px] overflow-hidden shadow-2xl">
          {/* Left: Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-brand-dark/40 backdrop-blur-md p-8 sm:p-12 lg:p-20 text-white"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8 sm:mb-10">Doe Agora</h2>
            
            <p className="text-white/60 mb-8 font-medium">Escolha um valor para transformar uma vida:</p>
            
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-4 mb-8">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "px-4 sm:px-8 py-3 sm:py-4 rounded-full font-black transition-all border-2 text-sm sm:text-base",
                    selectedAmount === amount 
                      ? "bg-brand-orange border-brand-orange text-white" 
                      : "bg-white/5 border-white/10 text-white hover:border-brand-orange/50"
                  )}
                >
                  R${amount}
                </button>
              ))}
            </div>

            <div className="relative mb-10">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 font-black">R$</span>
              <input 
                type="number"
                placeholder="Valor Personalizado"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full bg-white/5 border-2 border-white/10 rounded-full py-5 pl-14 pr-6 focus:outline-none focus:border-brand-orange transition-all font-black text-xl"
              />
            </div>

            <Button className="w-full bg-brand-gradient hover:opacity-90 text-white text-xl py-8 rounded-full shadow-lg shadow-brand-orange/20 transition-all active:scale-95">
              Fazer Doação <Heart className="ml-2 w-6 h-6 fill-white" />
            </Button>
          </motion.div>

          {/* Right: Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-brand-orange p-12 lg:p-20 text-white flex flex-col justify-center"
          >
            <SectionTag text="Faça uma Doação" className="bg-white/20 border-white/30" />
            <h3 className="text-4xl font-black mb-6 leading-tight">
              Sua Generosidade Alimenta <br />a Esperança do Mundo
            </h3>
            <p className="text-white/80 mb-12 text-lg leading-relaxed">
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
