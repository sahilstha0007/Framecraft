"use client";

import { motion } from "framer-motion";

interface FrameCornerProps {
  className?: string;
  size?: number;
  color?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "all";
  strokeWidth?: number;
  animate?: boolean;
}

const cornerPath = (size: number) => ({
  top: `M 0,${size} L 0,0 L ${size},0`,
  bottom: `M 0,-${size} L 0,0 L ${size},0`,
});

export default function FrameCorner({
  className = "",
  size = 24,
  color = "currentColor",
  position = "top-left",
  strokeWidth = 1.5,
  animate = false,
}: FrameCornerProps) {
  const corners = position === "all"
    ? ["top-left", "top-right", "bottom-left", "bottom-right"]
    : [position];

  const getTransform = (pos: string) => {
    switch (pos) {
      case "top-left": return "rotate(0)";
      case "top-right": return "rotate(90deg)";
      case "bottom-left": return "rotate(-90deg)";
      case "bottom-right": return "rotate(180deg)";
      default: return "rotate(0)";
    }
  };

  return (
    <span className={`inline-block ${className}`} aria-hidden="true">
      {corners.map((pos, i) => (
        <span
          key={pos}
          className="inline-block"
          style={{ transform: getTransform(pos) }}
        >
          {animate ? (
            <motion.svg
              width={size}
              height={size}
              viewBox={`0 0 ${size + 4} ${size + 4}`}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeInOut" }}
            >
              <path
                d={`M 2,${size + 2} L 2,2 L ${size + 2},2`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                className="path"
              />
            </motion.svg>
          ) : (
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size + 4} ${size + 4}`}
            >
              <path
                d={`M 2,${size + 2} L 2,2 L ${size + 2},2`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
              />
            </svg>
          )}
        </span>
      ))}
    </span>
  );
}

export function SectionDivider({ color = "text-gold-400", className = "" }: { color?: string; className?: string }) {
  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <div className="flex items-center gap-6">
        <FrameCorner size={16} position="top-right" color="currentColor" className={color} />
        <span className="w-12 h-px bg-current opacity-40" />
        <FrameCorner size={16} position="top-left" color="currentColor" />
      </div>
    </div>
  );
}

export function CardCorners({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* Top-left */}
      <svg className="absolute top-0 left-0" width="16" height="16" viewBox="0 0 20 20">
        <path d="M 2,18 L 2,2 L 18,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gold-400/40" />
      </svg>
      {/* Top-right */}
      <svg className="absolute top-0 right-0" width="16" height="16" viewBox="0 0 20 20" style={{ transform: "rotate(90deg)" }}>
        <path d="M 2,18 L 2,2 L 18,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gold-400/40" />
      </svg>
      {/* Bottom-left */}
      <svg className="absolute bottom-0 left-0" width="16" height="16" viewBox="0 0 20 20" style={{ transform: "rotate(-90deg)" }}>
        <path d="M 2,18 L 2,2 L 18,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gold-400/40" />
      </svg>
      {/* Bottom-right */}
      <svg className="absolute bottom-0 right-0" width="16" height="16" viewBox="0 0 20 20" style={{ transform: "rotate(180deg)" }}>
        <path d="M 2,18 L 2,2 L 18,2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gold-400/40" />
      </svg>
    </span>
  );
}