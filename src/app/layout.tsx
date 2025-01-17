import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Estilos de Font Awesome
import Header from "@/components/Header"; // Encabezado
import Footer from "@/components/Footer"; // Pie de página
import SearchBar from "@/components/SearchBar"; // Barra de búsqueda

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
        <Header />
        <SearchBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
