import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function Counter({ value, duration = 2, suffix = "" }: CounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        (ref.current as HTMLElement).textContent = Math.floor(latest).toString() + suffix;
      }
    });
  }, [springValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}
