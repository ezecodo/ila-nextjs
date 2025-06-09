import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import "@/app/globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent/CookieConsent";

import { locales, type Locale } from "../../../i18n"; // ✅ Importamos locales válidos

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

type Props = {
  children: ReactNode;
  params: {
    locale: string;
  };
};

export async function generateMetadata() {
  return {
    title: "ILA | Informationstelle Lateinamerika",
    description: "Das Lateinamerika-Magazin",
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  // 🔐 Validamos que el idioma sea uno de los definidos
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
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow w-full px-2 sm:px-4 md:px-6 lg:px-10 xl:px-16">
                {children}
              </main>
              <Footer />
            </div>
            <CookieConsent />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
