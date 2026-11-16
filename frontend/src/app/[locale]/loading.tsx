/**
 * Route-level loading state. Shown while a page's server data streams in, so
 * navigation never flashes a blank white screen. Pure CSS + inline SVG — no
 * client JS, no hydration work.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]" role="status" aria-label="Loading">
      <div className="relative px-12 py-10 sm:px-16 sm:py-12">
        {/* Animated frame corners */}
        <svg className="absolute inset-0 h-full w-full text-gold-400/50" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="kala-corner" d="M2 22 V2 H22" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <path className="kala-corner" d="M78 2 H98 V22" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <path className="kala-corner" d="M98 78 V98 H78" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <path className="kala-corner" d="M22 98 H2 V78" fill="none" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-gradient-to-br from-[#b3271f] to-[#7c150f] font-heading text-base text-gold-200 shadow-[0_2px_16px_rgba(179,39,31,0.35)]">
            कला
          </span>
          <p className="mt-5 font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900 dark:text-cream-100">
            Kala<span className="text-gold-500 dark:text-gold-400">Bazaar</span>
          </p>
          <p className="mt-2 font-mono text-[0.65rem] tracking-[0.35em] uppercase text-gold-600 dark:text-gold-400/70">
            कला बजार
          </p>
          <div className="mt-6 h-px w-40 overflow-hidden bg-gold-400/15">
            <div className="kala-loading-line h-full w-1/3 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
