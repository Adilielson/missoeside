import { motion } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526660690293-bcd32dc3b123?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400&auto=format&fit=crop",
];

export function MarqueeGallery() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="relative flex overflow-x-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-8 py-4"
        >
          {[...images, ...images].map((src, index) => (
            <div 
              key={index} 
              className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shrink-0 border-8 border-brand-light shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer"
            >
              <img src={src} alt={`Mission ${index}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
