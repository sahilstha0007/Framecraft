"use client";

import { motion } from "framer-motion";
import { Service } from "@/lib/types";
import {
  Frame,
  Paintbrush,
  StretchHorizontal,
  Printer,
  Building2,
  Home,
  Truck,
  Brush,
  Sprout,
} from "lucide-react";
import { Check, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CardCorners } from "./FrameCorner";

const iconMap: Record<string, React.ReactNode> = {
  Frame: <Frame size={26} />,
  Paintbrush: <Paintbrush size={26} />,
  StretchHorizontal: <StretchHorizontal size={26} />,
  Printer: <Printer size={26} />,
  Building2: <Building2 size={26} />,
  Home: <Home size={26} />,
  Truck: <Truck size={26} />,
  Brush: <Brush size={26} />,
  Sprout: <Sprout size={26} />,
};

interface ServiceCardProps {
  service: Service;
  index: number;
}

export default function ServiceCard({ service, index }: ServiceCardProps) {
  const t = useTranslations("servicesPage");
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative h-full bg-charcoal-900/[0.02] p-8 border border-charcoal-200/60 dark:bg-white/[0.02] dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/30 hover:-translate-y-1 transition-[border-color,transform] duration-500"
    >
      <CardCorners className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon — fills gold on hover */}
      <div className="w-14 h-14 flex items-center justify-center border border-gold-400/25 bg-gold-400/[0.04] text-gold-400 group-hover:bg-gold-500 group-hover:text-[#0a0a08] group-hover:border-gold-500 transition-[background-color,color,border-color] duration-500">
        {iconMap[service.icon] || <Frame size={26} aria-hidden="true" />}
      </div>

      <h3 className="mt-6 font-heading text-xl font-semibold text-charcoal-900 group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-300 transition-colors duration-500">
        {service.title}
      </h3>

      <p className="mt-3 text-sm text-charcoal-600 dark:text-white/45 leading-relaxed">
        {service.description}
      </p>

      {/* Features */}
      <ul className="mt-6 space-y-2.5">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-charcoal-600 dark:text-white/60">
            <Check size={15} className="mt-0.5 text-gold-400 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/booking"
        className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 transition-colors duration-300 group/link focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-[#0a0a08]"
      >
        {t("bookThisService")}
        <ArrowRight size={14} aria-hidden="true" className="group-hover/link:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
