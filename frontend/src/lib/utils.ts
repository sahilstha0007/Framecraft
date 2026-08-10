/**
 * Tiny dependency-free class-name joiner.
 * This project has no `clsx` / `tailwind-merge`, so this is the minimal
 * equivalent: join all truthy string entries with a space.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
