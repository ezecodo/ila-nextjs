import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import { Oswald } from "next/font/google";
import { ThemeProvider } from "next-themes";
import MatomoAnalytics from "./components/MatomoAnalytics/MatomoAnalytics";

import "@/app/globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import LayoutShell from "../[locale]/components/LayoutShell/LayoutShell";
import CookieConsent from "./components/CookieConsent/CookieConsent";
import { CartProvider } from "./components/Cart/CartContext";
import CartSelectionBar from "./components/Cart/CartSelectionBar";

import { locales, type Locale } from "../../../i18n";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  preload: true,
  display: "swap",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: true,
  display: "swap",
});
const futura = localFont({
  src: [
    {
      path: "../../fonts/FuturaCyrillicBook.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/FuturaCyrillicMedium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/FuturaCyrillicBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/FuturaCyrillicExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-futura",
  preload: true,
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "ila | Informationsstelle Lateinamerika",
    description: "Das Lateinamerika-Magazin",
    icon: "/favicon.ico",
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${futura.variable} ${oswald.variable} antialiased flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SessionProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <CartProvider>
                <LayoutShell>{children}</LayoutShell>
                <CartSelectionBar />
                <CookieConsent />
                <MatomoAnalytics />
              </CartProvider>
            </NextIntlClientProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
