"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";

interface ImageZoomProps {
  images: { image: string; title: string }[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function ImageZoom({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
}: ImageZoomProps) {
  const t = useTranslations("galleryPage");
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, onPrev, onNext]);

  const current = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 dark:bg-charcoal-900/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 text-charcoal-700 dark:text-white/70 hover:text-charcoal-900 dark:hover:text-white transition-colors"
            aria-label={t("close")}
          >
            <X size={28} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-charcoal-500 dark:text-white/60 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 sm:left-8 z-10 p-3 text-charcoal-700 dark:text-white/70 hover:text-charcoal-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-[color,background-color]"
                aria-label={t("previous")}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 sm:right-8 z-10 p-3 text-charcoal-700 dark:text-white/70 hover:text-charcoal-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-[color,background-color]"
                aria-label={t("next")}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[70vh] sm:h-[80vh]">
              <NextImage
                src={current.image}
                alt={current.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                loading="eager"
                className="object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-charcoal-800 dark:text-white font-heading text-lg">{current.title}</h3>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}