"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Calendar, Clock, ChevronLeft, ArrowRight, MapPin, Loader2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import PaymentMethods from "@/components/PaymentMethods";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

export default function BookingPage() {
  const t = useTranslations("bookingPage");
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Service list comes from translations so the flow speaks the active locale.
  const services = t.raw("services") as string[];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split("T")[0];
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.create("/api/bookings", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        service: selectedService,
        date: selectedDate,
        time: selectedTime || null,
        message: formData.notes || null,
      });
      setConfirmed(true);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-charcoal-900/[0.03] border border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:placeholder-white/25 focus:outline-none focus:border-gold-500/60 dark:focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30 transition-colors";

  if (confirmed) {
    return (
      <section className="pt-32 pb-24 bg-cream-50 dark:bg-[#0a0a08] min-h-screen flex items-center">
        <div className="max-w-lg mx-auto px-4 text-center w-full">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-20 h-20 mx-auto border border-gold-400/40 bg-gold-400/10 rounded-full flex items-center justify-center mb-8">
              <CheckCircle size={38} className="text-gold-400" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-charcoal-900 dark:text-white">
              {t("confirmedTitle1")} <span className="italic text-gold-400">{t("confirmedTitle2")}</span>
            </h1>
            <p className="mt-4 text-charcoal-600 dark:text-white/50">
              {t("confirmedBody")}
            </p>
            <div className="mt-9 text-left relative p-7 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
              <span
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                aria-hidden="true"
              />
              <div className="space-y-4">
                <SummaryRow label={t("service")} value={selectedService} />
                <SummaryRow
                  label={t("date")}
                  value={
                    selectedDate
                      ? new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"
                  }
                />
                <SummaryRow label={t("time")} value={selectedTime} />
                <SummaryRow label={t("name")} value={formData.name} />
                <SummaryRow label={t("email2")} value={formData.email} />
              </div>
            </div>
            <p className="mt-7 text-sm text-charcoal-500 dark:text-white/35">
              {t("confirmationSent", { email: formData.email })}
            </p>
            <div className="mt-8 text-left">
              <PaymentMethods />
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

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
        image="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1920&q=85"
      />

      {/* Booking Form */}
      <section className="py-14 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sign-in nudge — bookings are linked to your account when signed in */}
          {!loading && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02]">
              <p className="text-xs text-charcoal-600 dark:text-white/45 flex items-center gap-2">
                <UserRound size={14} className="text-gold-400" />
                {user ? (
                  <>
                    {t("signedInAs", { name: user.name })}{" "}
                    <Link href="/account" className="text-gold-600 dark:text-gold-400 hover:underline font-medium">
                      {t("trackLink")}
                    </Link>
                  </>
                ) : (
                  <>
                    {t("trackHint")}{" "}
                    <Link href="/login" className="text-gold-600 dark:text-gold-400 hover:underline font-medium">
                      {t("trackSignIn")}
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    s <= step
                      ? "bg-gold-500 text-[#0a0a08]"
                      : "bg-charcoal-900/[0.04] border border-charcoal-200/70 text-charcoal-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/30"
                  }`}
                >
                  {s < step ? <CheckCircle size={14} /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${s <= step ? "text-charcoal-800 dark:text-white/80" : "text-charcoal-500 dark:text-white/30"}`}>
                  {s === 1 ? t("stepService") : s === 2 ? t("stepDateTime") : t("stepDetails")}
                </span>
                {s < 3 && <div className="w-8 h-px bg-white/10 mx-1" />}
              </div>
            ))}
          </div>            <div className="relative p-8 sm:p-10 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
            <span
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
              aria-hidden="true"
            />
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white mb-1.5">
                    {t("serviceTitle")}
                  </h2>
                  <p className="text-charcoal-600 dark:text-white/45 mb-7">{t("serviceBody")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSelectedService(s); setStep(2); }}
                        className={`group p-5 rounded-lg border-2 text-left transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                          selectedService === s
                            ? "border-gold-400/60 bg-gold-400/[0.07]"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <span className={`text-sm font-medium ${selectedService === s ? "text-gold-600 dark:text-gold-300" : "text-charcoal-700 group-hover:text-charcoal-900 dark:text-white/70 dark:group-hover:text-white"}`}>
                          {s}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex items-center gap-3 mb-7">
                    <button
                      onClick={() => setStep(1)}
                      className="p-1.5 text-charcoal-500 hover:text-gold-600 dark:text-white/40 dark:hover:text-gold-300 transition-colors cursor-pointer"
                      aria-label={t("backToServices")}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("dateTitle")}</h2>
                      <p className="text-sm text-charcoal-500 dark:text-white/40">{t("service")}: {selectedService}</p>
                    </div>
                  </div>

                  <div className="space-y-7">
                    {/* Date */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700 dark:text-white/70 mb-2.5">
                        <Calendar size={15} className="text-gold-400" />
                        {t("dateLabel")}
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className={inputClass}
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700 dark:text-white/70 mb-2.5">
                        <Clock size={15} className="text-gold-400" />
                        {t("timeLabel")}
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {timeSlots.map((tSlot) => (
                          <button
                            key={tSlot}
                            onClick={() => setSelectedTime(tSlot)}
                            className={`py-2.5 text-sm rounded-lg border transition-all duration-300 cursor-pointer ${
                              selectedTime === tSlot
                                ? "border-gold-400/60 bg-gold-400/[0.07] text-gold-300"
                                : "border-charcoal-200 text-charcoal-600 hover:border-charcoal-400 hover:text-charcoal-900 dark:border-white/10 dark:text-white/55 dark:hover:border-white/25 dark:hover:text-white"
                            }`}
                          >
                            {tSlot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="mt-9 inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-colors duration-300 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {t("continue")}
                    <ArrowRight size={15} />
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex items-center gap-3 mb-7">
                    <button
                      onClick={() => setStep(2)}
                      className="p-1.5 text-charcoal-500 hover:text-gold-600 dark:text-white/40 dark:hover:text-gold-300 transition-colors cursor-pointer"
                      aria-label={t("backToDateTime")}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("detailsTitle")}</h2>
                      <p className="text-sm text-charcoal-500 dark:text-white/40">
                        {selectedService} — {selectedDate && new Date(selectedDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {selectedTime}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-white/70 mb-1.5">{t("fullName")} *</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder={t("placeholderName")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-charcoal-700 dark:text-white/70 mb-1.5">{t("email")} *</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder={t("placeholderEmail")} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal-700 dark:text-white/70 mb-1.5">{t("phone")}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder={t("placeholderPhone")} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-white/70 mb-1.5">{t("notes")}</label>
                      <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className={`${inputClass} resize-none`} placeholder={t("notesPlaceholder")} />
                    </div>
                  </div>

                  {submitError && (
                    <p className="mt-5 text-xs text-red-500 dark:text-red-400">{submitError}</p>
                  )}
                  <button
                    onClick={handleConfirm}
                    disabled={!formData.name || !formData.email || submitting}
                    className="mt-9 inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-colors duration-300 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                    {submitting ? "…" : t("confirm")}
                    {!submitting && <ArrowRight size={15} />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payments we accept */}
          <div className="mt-8">
            <PaymentMethods />
          </div>

          {/* Studio reminder */}
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-charcoal-500 dark:text-white/35">
            <MapPin size={13} className="text-gold-400/60" />
            {t("studioReminder")}
          </p>
        </div>
      </section>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 text-sm">
      <span className="text-charcoal-500 dark:text-white/40 flex-shrink-0">{label}</span>
      <span className="font-medium text-charcoal-800 dark:text-white/85 text-right">{value}</span>
    </div>
  );
}
