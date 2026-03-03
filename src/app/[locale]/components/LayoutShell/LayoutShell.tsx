"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Header from "../Header";
import Footer from "../Footer";

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideLayout = pathname === "/de/links" || pathname === "/es/links";

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow w-full px-2 sm:px-3 md:px-4 lg:px-6 pt-[80px] md:pt-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
