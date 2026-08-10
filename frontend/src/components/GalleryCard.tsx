"use client";

import { motion } from "framer-motion";
import { GalleryItem } from "@/lib/types";
import { Expand, Heart } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";

interface GalleryCardProps {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}

export default function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const t = useTranslations("galleryPage");
  const [liked, setLiked] = useState(false);

  const heights = [
    "h-72 sm:h-80",
    "h-64 sm:h-72",
    "h-80 sm:h-96",
    "h-60 sm:h-68",
    "h-72 sm:h-84",
    "h-64 sm:h-76",
    "h-76 sm:h-88",
    "h-68 sm:h-72",
    "h-72 sm:h-80",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={t("viewItem", { title: item.title })}
      className={`group relative ${heights[index % heights.length]} overflow-hidden cursor-pointer border border-charcoal-200/60 dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/30 transition-colors duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400`}
    >
      <NextImage
        src={item.image}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/90 via-[#0a0a08]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
        <span className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400">
          {item.category}
        </span>
        <h3 className="mt-1.5 font-heading text-lg font-semibold text-white">{item.title}</h3>
        <p className="mt-1 text-sm text-white/60 line-clamp-2">{item.description}</p>
        <p className="mt-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-white/35">
          {t("client", { client: item.client })}
        </p>
      </div>

      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="w-9 h-9 flex items-center justify-center bg-[#0a0a08]/60 backdrop-blur border border-white/10 hover:border-white/25 transition-all duration-300 cursor-pointer"
          aria-label={liked ? t("unlike") : t("like")}
        >
          <Heart
            size={15}
            className={liked ? "fill-gold-400 text-gold-400" : "text-white/80"}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-9 h-9 flex items-center justify-center bg-[#0a0a08]/60 backdrop-blur border border-white/10 hover:border-white/25 transition-all duration-300 cursor-pointer"
          aria-label={t("expand")}
        >
          <Expand size={15} className="text-white/80" />
        </button>
      </div>
    </motion.div>
  );
}
