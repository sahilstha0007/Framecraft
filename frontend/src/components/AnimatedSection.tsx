"use client";

import { motion, type TargetAndTransition } from "framer-motion";

type AnimationVariant = "fade-up" | "fade-left" | "fade-right" | "fade-in";

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: AnimationVariant;
  animate?: boolean;
}

const variants: Record<AnimationVariant, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  "fade-up": { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  "fade-left": { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  "fade-right": { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
  "fade-in": { initial: { opacity: 0 }, animate: { opacity: 1 } },
};

export default function AnimatedSection({
  children,
  delay = 0,
  className = "",
  variant = "fade-up",
  animate = false,
}: AnimatedSectionProps) {
  const v = variants[variant];

  if (animate) {
    return (
      <motion.div
        initial={v.initial}
        animate={v.animate}
        transition={{ delay, duration: 0.6 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
