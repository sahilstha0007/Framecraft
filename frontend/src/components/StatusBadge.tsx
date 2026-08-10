/** Maps a status value to its i18n key, e.g. "in_progress" → "statusInProgress". */
export function statusKey(status: string): string {
  return `status${status
    .replace(/(^|_)(.)/g, (_, __, c: string) => c.toUpperCase())}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  confirmed: "bg-sky-400/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  in_progress: "bg-violet-400/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  ready: "bg-gold-400/15 text-gold-700 dark:text-gold-300 border-gold-500/40",
  delivered: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-400/10 text-red-600 dark:text-red-300 border-red-500/30",
};

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[0.65rem] font-medium tracking-wide whitespace-nowrap ${
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      }`}
    >
      {label}
    </span>
  );
}
