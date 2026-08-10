/**
 * FrameCraft logo — clean text-based branding.
 * Uses Playfair Display (the project heading font) with a slim vertical
 * divider inspired by a framing mat edge, and a two-tone wordmark.
 */
export default function LogoParticles() {
  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3 select-none">
      {/* Decorative vertical bar — like a framing mat edge */}
      <span className="w-[3px] h-6 sm:h-7 rounded-full bg-gradient-to-b from-gold-500/70 to-gold-600/60 dark:from-gold-400/70 dark:to-gold-500/60" />
      {/* Wordmark */}
      <span className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-charcoal-800 dark:text-cream-100">
        Frame<span className="text-gold-500 dark:text-gold-400">Craft</span>
      </span>
    </span>
  );
}
