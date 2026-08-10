"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import {
  Check,
  Camera,
  Image,
  Palette,
  Ruler,
  Shield,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { glassTypes, matOptions } from "@/lib/data";
import type { GlassType, MatOption } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { useLocale, useTranslations } from "next-intl";
import ContactForm from "@/components/ContactForm";
import PageHeader from "@/components/PageHeader";
import { formatNPR } from "@/lib/nepali";

// Style names are translated at render time — ids stay stable.
const frameStyles = [
  { id: "classic", nameKey: "styleClassic", preview: "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=400&q=80", colors: ["#8B4513", "#A0522D", "#D2691E", "#DEB887"] },
  { id: "modern", nameKey: "styleModern", preview: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80", colors: ["#708090", "#2F4F4F", "#000000", "#C0C0C0"] },
  { id: "gold", nameKey: "styleGold", preview: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400&q=80", colors: ["#FFD700", "#DAA520", "#B8860B", "#F0E68C"] },
  { id: "minimal", nameKey: "styleMinimal", preview: "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?w=400&q=80", colors: ["#FFFFFF", "#F5F5F0", "#404040", "#000000"] },
  { id: "canvas", nameKey: "styleCanvas", preview: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80", colors: ["#DEB887", "#F5DEB3", "#D2B48C", "#8B7355"] },
  { id: "walnut", nameKey: "styleWalnut", preview: "https://images.unsplash.com/photo-1515288207449-100e125abccb?w=400&q=80", colors: ["#5C4033", "#6B3A2A", "#8B6914", "#A0522D"] },
];

const sizeOptions = [
  { label: '8" × 10"', value: "8x10", price: 0 },
  { label: '11" × 14"', value: "11x14", price: 1000 },
  { label: '16" × 20"', value: "16x20", price: 2000 },
  { label: '18" × 24"', value: "18x24", price: 2800 },
  { label: '20" × 24"', value: "20x24", price: 3500 },
  { label: '24" × 36"', value: "24x36", price: 4500 },
  { label: "customSize", value: "custom", price: 6000 },
];

export default function CustomFramingPage() {
  const t = useTranslations("customPage");
  const locale = useLocale();
  // Locale-aware NPR formatting (Devanagari numerals in the Nepali locale).
  const npr = (n: number) => formatNPR(n, locale);
  // Live options from the API — fall back to the bundled catalog.
  const { data: liveGlass } = useLocalizedCollection<GlassType>("glass-types", glassTypes);
  const { data: liveMats } = useLocalizedCollection<MatOption>("mat-options", matOptions);

  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedGlass, setSelectedGlass] = useState("standard");
  const [selectedMat, setSelectedMat] = useState("none");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const basePrice = 2500;
  const stylePrice = selectedStyle ? 1500 : 0;
  const selectedSizeOption = sizeOptions.find((s) => s.value === selectedSize);
  const sizePrice = selectedSizeOption?.price || 0;
  const glassPrice = liveGlass.find((g) => g.id === selectedGlass)?.price || 0;
  const matPrice = liveMats.find((m) => m.id === selectedMat)?.price || 0;
  const estimatedPrice = basePrice + stylePrice + sizePrice + glassPrice + matPrice;

  const sizeLabel = selectedSizeOption
    ? selectedSizeOption.value === "custom"
      ? t("customSize")
      : selectedSizeOption.label
    : selectedSize;

  const steps = [
    { num: 1, label: t("step1"), icon: Image },
    { num: 2, label: t("step2"), icon: Palette },
    { num: 3, label: t("step3"), icon: Ruler },
    { num: 4, label: t("step4"), icon: Shield },
    { num: 5, label: t("step5"), icon: Sparkles },
  ];

  const selectedClass = "border-gold-400/60 bg-gold-400/[0.07]";
  const idleClass = "border-charcoal-200/70 hover:border-charcoal-300 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:hover:border-white/20 dark:bg-white/[0.02]";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">
                {t("uploadTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-charcoal-600 dark:text-white/45">
                {t("uploadBody")}
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-charcoal-300 dark:border-white/15 rounded-lg p-12 text-center cursor-pointer hover:border-gold-500/60 dark:hover:border-gold-400/50 transition-colors duration-500 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />

              {uploadedImage ? (
                <div className="relative">
                  <NextImage src={uploadedImage} alt="Uploaded" width={500} height={300} className="max-h-64 w-auto mx-auto rounded-sm object-contain" unoptimized />
                  <p className="mt-3 text-sm text-charcoal-600 dark:text-white/40">{t("changeImage")}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto border border-gold-400/25 bg-gold-400/[0.05] rounded-full flex items-center justify-center mb-4 group-hover:bg-gold-400/10 transition-colors duration-500">
                    <Camera size={26} className="text-gold-400" />
                  </div>
                  <p className="text-charcoal-800 dark:text-white/80 font-medium">{t("uploadHint")}</p>
                  <p className="text-sm text-charcoal-600 dark:text-white/40 mt-1">{t("uploadFormats")}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("styleTitle")}</h3>
              <p className="mt-1.5 text-sm text-charcoal-600 dark:text-white/45">
                {t("styleBody")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {frameStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                    selectedStyle === style.id ? selectedClass : idleClass
                  }`}
                >
                  <div className="relative h-20 rounded-md mb-3 overflow-hidden">
                    <NextImage src={style.preview} alt={t(style.nameKey)} fill sizes="160px" className="object-cover" />
                    {selectedStyle === style.id && (
                      <div className="absolute inset-0 bg-gold-400/20" />
                    )}
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {style.colors.slice(0, 3).map((c) => (
                      <div key={c} className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-charcoal-800 dark:text-white/80">{t(style.nameKey)}</span>
                  {selectedStyle === style.id && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                      <Check size={13} className="text-[#0a0a08]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("sizeTitle")}</h3>
              <p className="mt-1.5 text-sm text-charcoal-600 dark:text-white/45">
                {t("sizeBody")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sizeOptions.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSize(size.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-center cursor-pointer ${
                    selectedSize === size.value ? selectedClass : idleClass
                  }`}
                >
                  <span className="text-sm font-medium text-charcoal-800 dark:text-white/80">{size.value === "custom" ? t("customSize") : size.label}</span>
                  {size.value !== "custom" && (
                    <span className="block text-xs text-charcoal-500 dark:text-white/35 mt-1">+{npr(size.price)}</span>
                  )}
                </button>
              ))}
            </div>

            {selectedSize === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-2 gap-4 p-5 bg-charcoal-900/[0.03] border border-charcoal-200/70 dark:bg-white/[0.03] dark:border-white/[0.08] rounded-lg"
              >
                <div>
                  <label className="block text-sm text-charcoal-700 dark:text-white/60 mb-1.5">{t("widthLabel")}</label>
                  <input type="number" placeholder="8" className="w-full px-3 py-2.5 border border-charcoal-200 rounded-md bg-charcoal-900/[0.03] text-charcoal-900 placeholder-charcoal-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-white/25 focus:outline-none focus:border-gold-500/60 dark:focus:border-gold-400/50" />
                </div>
                <div>
                  <label className="block text-sm text-charcoal-700 dark:text-white/60 mb-1.5">{t("heightLabel")}</label>
                  <input type="number" placeholder="10" className="w-full px-3 py-2.5 border border-charcoal-200 rounded-md bg-charcoal-900/[0.03] text-charcoal-900 placeholder-charcoal-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-white/25 focus:outline-none focus:border-gold-500/60 dark:focus:border-gold-400/50" />
                </div>
              </motion.div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("glassTitle")}</h3>
              <p className="mt-1.5 text-sm text-charcoal-600 dark:text-white/45">
                {t("glassBody")}
              </p>
            </div>

            <div className="space-y-3">
              {liveGlass.map((glass) => (
                <button
                  key={glass.id}
                  onClick={() => setSelectedGlass(glass.id)}
                  className={`w-full p-5 rounded-lg border-2 transition-all duration-300 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                    selectedGlass === glass.id ? selectedClass : idleClass
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-semibold text-charcoal-900 dark:text-white">{glass.name}</h4>
                      <p className="text-sm text-charcoal-600 dark:text-white/45 mt-1">{glass.description}</p>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {glass.features.map((f) => (
                          <li key={f} className="text-[0.6rem] font-mono tracking-[0.1em] uppercase bg-charcoal-900/[0.05] border border-charcoal-200/70 text-charcoal-600 dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white/50 px-2 py-1 rounded">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${glass.price === 0 ? "text-gold-600 dark:text-gold-400" : "text-charcoal-700 dark:text-white/70"}`}>
                      {glass.price === 0 ? t("included") : `+${npr(glass.price)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("matTitle")}</h3>
              <p className="mt-1.5 text-sm text-charcoal-600 dark:text-white/45">
                {t("matBody")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {liveMats.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setSelectedMat(mat.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-center cursor-pointer ${
                    selectedMat === mat.id ? selectedClass : idleClass
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-md border border-white/10 mb-3"
                    style={{ backgroundColor: mat.color === "transparent" ? "#f5f0e8" : mat.color }}
                  >
                    {mat.id === "double" && (
                      <div className="h-full w-full" style={{ background: "linear-gradient(135deg, #404040 50%, #e8d5c0 50%)" }} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-charcoal-800 dark:text-white/80">{mat.name}</span>
                  {mat.price > 0 && (
                    <span className="block text-xs text-charcoal-500 dark:text-white/35 mt-1">+{npr(mat.price)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Header */}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("description")}
      />

      {/* Interactive Builder */}
      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Step Progress */}
            <div className="lg:col-span-1 lg:sticky lg:top-28">
              <div className="relative p-6 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <h3 className="font-mono text-[0.6rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/40 mb-6">
                  {t("progressTitle")}
                </h3>
                <div className="space-y-2">
                  {steps.map((s) => (
                    <button
                      key={s.num}
                      onClick={() => setStep(s.num)}
                      className={`flex items-center gap-3.5 w-full p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                        step === s.num
                          ? "bg-gold-400/[0.08]"
                          : step > s.num
                          ? "hover:bg-white/[0.03]"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step > s.num
                            ? "bg-gold-500 text-[#0a0a08]"
                            : step === s.num
                            ? "bg-gold-400/20 text-gold-400 ring-1 ring-gold-400/50"
                            : "bg-charcoal-900/[0.04] text-charcoal-500 border border-charcoal-200/70 dark:bg-white/[0.04] dark:text-white/30 dark:border-white/[0.08]"
                        }`}
                      >
                        {step > s.num ? <Check size={14} /> : <s.icon size={14} />}
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-medium ${step === s.num ? "text-gold-600 dark:text-gold-300" : "text-charcoal-600 dark:text-white/60"}`}>
                          {s.label}
                        </div>
                      </div>
                      {step === s.num && (
                        <span className="ml-auto w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Price summary inside the rail (mobile-friendly too) */}
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <h4 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/40 mb-4">
                    {t("priceTitle")}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <PriceRow label={t("baseFraming")} value={npr(basePrice)} />
                    {selectedStyle && <PriceRow label={t("frameStyle")} value={`+${npr(stylePrice)}`} />}
                    {selectedSize && selectedSize !== "custom" && (
                      <PriceRow label={`${t("step3")} (${sizeLabel})`} value={`+${npr(sizePrice)}`} />
                    )}
                    {selectedGlass !== "standard" && <PriceRow label={t("glassUpgrade")} value={`+${npr(glassPrice)}`} />}
                    {selectedMat !== "none" && <PriceRow label={t("matting")} value={`+${npr(matPrice)}`} />}
                    <div className="pt-3 mt-3 border-t border-white/[0.08] flex justify-between font-heading font-bold text-lg text-gold-400">
                      <span>{t("estimatedTotal")}</span>
                      <span>{npr(estimatedPrice)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.65rem] text-charcoal-500 dark:text-white/30 leading-relaxed">
                    {t("priceNote")}
                  </p>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="lg:col-span-2">
              <div className="relative p-8 sm:p-10 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02] min-h-[420px]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-10 pt-6 border-t border-white/[0.08]">
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-charcoal-600 hover:text-gold-600 dark:text-white/60 dark:hover:text-gold-300 disabled:opacity-25 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={15} />
                    {t("previous")}
                  </button>
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-colors duration-300 cursor-pointer"
                    >
                      {t("nextStep")}
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-colors duration-300 cursor-pointer"
                    >
                      {t("requestQuote")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      {showQuoteForm && (
        <section className="py-16 sm:py-24 bg-cream-50 dark:bg-black relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(212,168,56,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-4">
                  <span className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50" aria-hidden="true" />
                  <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                    {t("quoteEyebrow")}
                  </span>
                  <span className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/50" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-heading text-3xl font-bold text-charcoal-900 dark:text-white">
                  {t("quoteTitle")} <span className="italic text-gold-400">{t("quoteTitleAccent")}</span>
                </h2>
                <p className="mt-3 text-charcoal-600 dark:text-white/50">
                  {t("quoteBody")}
                </p>
              </div>
              <div className="relative p-8 sm:p-10 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <ContactForm variant="quote" />
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-charcoal-700 dark:text-white/55">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
