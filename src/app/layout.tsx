import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header"; // Importa tu Header
import Footer from "@/components/Footer"; // Importa tu Footer
import SearchBar from "@/components/SearchBar"; // Importa la barra de búsqueda

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header /> {/* Encabezado de la página */}
        <SearchBar /> {/* Barra de búsqueda */}
        <main>{children}</main> {/* Contenido principal */}
        <Footer /> {/* Pie de página */}
      </body>
    </html>
  );
}
