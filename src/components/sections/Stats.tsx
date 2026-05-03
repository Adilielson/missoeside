import { motion } from "framer-motion";
import { Users, Globe, Briefcase, Heart } from "lucide-react";
import { Counter } from "../Counter";

const stats = [
  {
    icon: Globe,
    value: 190,
    suffix: "+",
    label: "Missões Realizadas",
  },
  {
    icon: Users,
    value: 560,
    suffix: "+",
    label: "Doadores Mundiais",
  },
  {
    icon: Briefcase,
    value: 110,
    suffix: "+",
    label: "Voluntários",
  },
  {
    icon: Heart,
    value: 260,
    suffix: "+",
    label: "Crianças Atendidas",
  },
];

export function Stats() {
  return (
    <section className="py-16 md:py-24 bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 sm:mb-8 relative group-hover:bg-brand-orange/10 transition-all duration-500">
                {/* Animated Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-2 border-dashed border-brand-orange/20 rounded-full"
                />
                <stat.icon className="w-9 h-9 sm:w-12 sm:h-12 text-white group-hover:text-brand-orange transition-colors duration-500" />
              </div>
              
              <div className="text-3xl sm:text-5xl font-black text-white mb-2">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
