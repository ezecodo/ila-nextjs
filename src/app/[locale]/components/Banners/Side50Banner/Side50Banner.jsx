"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
      className="relative overflow-hidden text-white p-3 md:p-5 shadow-xl flex flex-col items-center text-center gap-5 -mx-4 sm:mx-0"
      style={{
        background: "radial-gradient(ellipse at top left, #9dc994 0%, #89B881 45%, #5a8a54 100%)",
      }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-1/2 -right-6 w-20 h-20 rounded-full bg-black/10" />
      <div className="absolute -top-4 right-1/3 w-12 h-12 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-center w-full justify-center gap-2">
        <div className="text-center flex-1 min-w-0">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white break-words">
            {t.title}
          </h3>
        </div>
      </div>

      <div className="relative z-10 w-full text-center">
        <p className="text-lg md:text-xl leading-tight md:leading-snug font-medium text-white/95">
          {t.fullText}
        </p>
      </div>

      <div className="relative z-10 w-full mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            href="/order/abo"
            className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta1}
          </Link>
          <Link
            href="/support/participate"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta2}
          </Link>
          <Link
            href="/support/donations"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta3}
          </Link>
        </div>
      </div>
    </div>
  );
}
