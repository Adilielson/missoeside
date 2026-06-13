import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { SectionTag } from "../SectionTag";
import voluntariosAsset from "@/assets/voluntarios-ide.png.asset.json";
const voluntariosImg = voluntariosAsset.url;
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Volunteers() {
  return (
    <section className="py-16 md:py-24 bg-brand-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="aspect-[4/5] rounded-[32px] sm:rounded-[60px] overflow-hidden border-[8px] sm:border-[16px] border-white shadow-2xl relative">
            <img 
              src={voluntariosImg} 
              alt="Voluntários" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[2px] border-brand-orange/20 rounded-[44px] pointer-events-none m-2" />
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-orange/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-burgundy/10 rounded-full blur-3xl -z-10" />
        </motion.div>

        {/* Right Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <SectionTag icon={Heart} text="Junte-se a Nós" light />
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark mb-6 sm:mb-8 leading-tight">
            Torne-se as Mãos e Pés <br className="hidden sm:block" />
            <span className="text-brand-orange">da Nossa Missão</span>
          </h2>

          <p className="text-base sm:text-lg text-brand-dark/60 mb-8 sm:mb-10 leading-relaxed">
            Não importa sua profissão ou habilidade, há um lugar para você na IDE. 
            Seja no campo missionário, no suporte administrativo ou na intercessão, 
            sua vida pode ser o canal para a mudança que o mundo precisa.
          </p>

          <Accordion type="single" defaultValue="item-1" className="space-y-4">
            <AccordionItem value="item-1" className="border-none bg-white rounded-3xl px-5 sm:px-8 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <span className="text-lg font-black text-brand-dark text-left">Reconhecimento e Realização</span>
              </AccordionTrigger>
              <AccordionContent className="text-brand-dark/50 leading-relaxed pb-6">
                Experimente a profunda alegria de servir ao próximo e ver vidas sendo 
                transformadas diante de seus olhos. O impacto que você causa volta para 
                você em forma de gratidão e propósito.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-none bg-white rounded-3xl px-5 sm:px-8 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <span className="text-lg font-black text-brand-dark text-left">Por Que Se Tornar Voluntário?</span>
              </AccordionTrigger>
              <AccordionContent className="text-brand-dark/50 leading-relaxed pb-6">
                Ser voluntário na IDE é uma oportunidade de crescimento pessoal e espiritual. 
                Você desenvolverá novas habilidades, conhecerá novas culturas e fará 
                parte de algo muito maior do que você mesmo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-none bg-white rounded-3xl px-5 sm:px-8 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <span className="text-lg font-black text-brand-dark text-left">Faça Parte de uma Comunidade</span>
              </AccordionTrigger>
              <AccordionContent className="text-brand-dark/50 leading-relaxed pb-6">
                Conecte-se com pessoas que compartilham os mesmos valores e a mesma 
                paixão por missões. Na IDE, formamos uma família unida pelo amor 
                e pelo desejo de ver o mundo alcançado.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
