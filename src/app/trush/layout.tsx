import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent/CookieConsent";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ILA | Informationstelle Lateinamerika",
  description: "Das Lateinamerika-Magazin",
};

// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            <Header />

            {/* Eliminamos `container` para evitar márgenes */}
            <main className="flex-grow w-full px-4 sm:px-6 lg:px-8">
              {children}
            </main>

            <Footer />
          </div>
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
