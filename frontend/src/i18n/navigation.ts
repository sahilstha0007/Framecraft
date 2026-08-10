import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Link / redirect / usePathname / useRouter.
// Every internal navigation must go through these so the locale prefix is
// applied automatically and links survive across languages.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
