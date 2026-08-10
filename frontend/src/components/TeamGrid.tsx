"use client";

import { teamMembers } from "@/lib/data";
import type { TeamMember } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import AnimatedSection from "./AnimatedSection";
import { CardCorners } from "./FrameCorner";
import NextImage from "next/image";

export default function TeamGrid() {
  const { data } = useLocalizedCollection<TeamMember>("team", teamMembers);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((member, i) => (
        <AnimatedSection key={member.id} delay={i * 0.08} className="group">
          <div className="relative h-72 overflow-hidden border border-charcoal-200/60 dark:border-white/[0.06] group-hover:border-gold-500/40 dark:group-hover:border-gold-400/30 transition-colors duration-500">
            <NextImage
              src={member.image}
              alt={member.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardCorners className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Experience badge */}
            <span className="absolute top-4 right-4 px-2.5 py-1 bg-gold-500 text-[#0a0a08] font-mono text-[0.5rem] tracking-[0.15em] uppercase">
              {member.experience}
            </span>
          </div>
          <div className="mt-5 px-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-charcoal-900 group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-300 transition-colors duration-500">
                {member.name}
              </h3>
            </div>
            <p className="mt-0.5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/70">
              {member.role}
            </p>
            <p className="mt-2.5 text-sm text-charcoal-600 dark:text-white/45 leading-relaxed">{member.bio}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}
