"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    _paq: unknown[][];
  }
}

export default function MatomoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasConsent, setHasConsent] = useState(false);

  // Escuchar consentimiento inicial y cambios
  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem("cookiesAccepted") === "true";
      setHasConsent(consent);
    };

    checkConsent();
    window.addEventListener("cookieConsentChanged", checkConsent);

    return () => {
      window.removeEventListener("cookieConsentChanged", checkConsent);
    };
  }, []);

  // Inicializar Matomo cuando hay consentimiento
  useEffect(() => {
    if (!hasConsent) return;
    if (document.querySelector('script[src*="matomo.js"]')) return;

    window._paq = window._paq || [];
    window._paq.push(["trackPageView"]);
    window._paq.push(["enableLinkTracking"]);

    const u = "//matomo.ila-web.de/";
    window._paq.push(["setTrackerUrl", u + "matomo.php"]);
    window._paq.push(["setSiteId", "1"]);

    const script = document.createElement("script");
    script.async = true;
    script.src = u + "matomo.js";
    document.head.appendChild(script);
  }, [hasConsent]);

  // Trackear cambios de ruta (SPA navigation)
  useEffect(() => {
    if (!hasConsent || !window._paq) return;

    const url =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    window._paq.push(["setCustomUrl", url]);
    window._paq.push(["trackPageView"]);
  }, [pathname, searchParams, hasConsent]);

  return null;
}
