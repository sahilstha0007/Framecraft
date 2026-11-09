/**
 * Kala Bazaar logo — a vermilion seal carrying the Devanagari word for art
 * (कला) beside the two-tone wordmark. The square echoes a thangka's brocade
 * mount; the gold glyph nods to gold leaf used across Nepali painting.
 */
export default function LogoParticles() {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      {/* कला seal */}
      <span
        className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-gradient-to-br from-[#b3271f] to-[#7c150f] shadow-[0_2px_12px_rgba(179,39,31,0.35)] overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/70 to-transparent" />
        <span className="font-heading text-gold-300 text-sm sm:text-base leading-none pt-0.5">
          कला
        </span>
      </span>
      {/* Wordmark */}
      <span className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-charcoal-800 dark:text-cream-100">
        Kala<span className="text-gold-500 dark:text-gold-400">Bazaar</span>
      </span>
    </span>
  );
}
