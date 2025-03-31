import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation APIs
// that consideran la configuración de locales definidos
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
