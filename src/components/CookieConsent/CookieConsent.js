"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasAcceptedCookies = localStorage.getItem("cookiesAccepted");
    if (!hasAcceptedCookies) {
      setShowPopup(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setShowPopup(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookiesAccepted", "false");
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
        <h2 className="text-lg font-bold">🍪 Uso de Cookies</h2>
        <p className="text-sm text-gray-700 mt-2">
          Usamos cookies para mejorar tu experiencia en nuestro sitio. Puedes
          aceptar o rechazar el uso de cookies no esenciales.
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={acceptCookies}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Aceptar Cookies
          </button>
          <button
            onClick={rejectCookies}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Rechazar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <a href="/privacy" className="underline text-blue-600">
            Más información sobre nuestras cookies
          </a>
        </p>
      </div>
    </div>
  );
}
