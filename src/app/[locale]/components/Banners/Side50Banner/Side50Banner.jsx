"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import confetti from "canvas-confetti";

export default function Banner50Compact() {
  const locale = useLocale();
  const bannerRef = useRef(null);
  const [hasLaunchedConfetti, setHasLaunchedConfetti] = useState(false);

  const content = {
    de: {
      title: "Wir werden 50!",
      fullText: `Es wäre Zeit, die ila an den Nagel zu hängen und sich zurückzulehnen.  In einer Gegenwart wo rechte Kräfte im Vormarsch sind und dennoch überall Menschen tagtäglich widerstehen, für ein gutes Leben und solidarische Gesellschaften kämpfen? Wir feiern und machen weiter. Und ihr?`,
      cta1: "Abonnieren",
      cta2: "Mitmachen",
      cta3: "Spenden",
    },
    es: {
      title: "¡Cumplimos 50!",
      fullText: `Sería tiempo de colgar los guantes y relajarse. ¿En un presente donde las fuerzas de derecha están en auge y, sin embargo, en todas partes la gente resiste día a día, luchando por una buena vida y sociedades solidarias? Celebramos y seguimos. ¿Y tú?`,
      cta1: "Suscríbete",
      cta2: "Únete",
      cta3: "Dona",
    },
  };

  const t = content[locale] || content.de;

  // Resalta la palabra "ila" con la tipografía del logo (Futura).
  const renderWithIla = (text) =>
    text.split(/(\bila\b)/g).map((part, i) =>
      part === "ila" ? (
        <span
          key={i}
          className="font-bold lowercase"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          ila
        </span>
      ) : (
        part
      ),
    );

  // 🎊 Solo en MOBILE: lanzar confetti cuando el banner es visible
  useEffect(() => {
    // Detectar si es mobile
    const isMobile = window.innerWidth < 768; // md breakpoint de Tailwind

    if (!isMobile || !bannerRef.current || hasLaunchedConfetti) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLaunchedConfetti) {
            launchConfetti();
            setHasLaunchedConfetti(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.3, // Cuando el 30% del banner es visible
      },
    );

    observer.observe(bannerRef.current);

    return () => observer.disconnect();
  }, [hasLaunchedConfetti]);

  const launchConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
      scalar: 1.5,
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { x: 0.3, y: 0.7 },
        colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
        scalar: 1.5,
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { x: 0.7, y: 0.7 },
        colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
        scalar: 1.5,
      });
    }, 300);
  };

  return (
    <div
      ref={bannerRef}
      className="relative overflow-hidden bg-[#89B881] text-white p-3 md:p-5 shadow-md flex flex-col items-center text-center gap-5 -mx-4 sm:mx-0"
    >
      <div className="relative z-10 flex items-center w-full justify-center gap-2">
        <div className="text-center flex-1 min-w-0">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white break-words">
            {t.title}
          </h3>
        </div>
      </div>

      <div className="relative z-10 w-full text-center">
        <p className="text-lg md:text-xl leading-tight md:leading-snug font-medium text-white/95">
          {renderWithIla(t.fullText)}
        </p>
      </div>

      <div className="relative z-10 w-full mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { href: "/order/abo", label: t.cta1 },
            { href: "/support/participate", label: t.cta2 },
            { href: "/support/donations", label: t.cta3 },
          ].map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group inline-flex items-center justify-center gap-1.5 rounded-none bg-white px-4 py-2.5 text-base md:text-lg font-bold text-[#4f7a49] shadow-sm transition-all hover:shadow-md"
            >
              {b.label}
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
