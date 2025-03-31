export const locales = ["es", "de"] as const;

export const defaultLocale = "es";

export type Locale = (typeof locales)[number];
