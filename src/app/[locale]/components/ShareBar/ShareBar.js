"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";

export default function ShareBar({ title }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  const encodedTitle = encodeURIComponent(
    title || "Mirá este artículo de ILA:"
  );
  const encodedURL = encodeURIComponent(url);

  const iconStyle =
    "bg-white border border-red-500 text-red-600 p-2 rounded hover:bg-red-50 transition";

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t z-50 md:hidden">
      <div className="flex justify-around items-center px-4 py-2">
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconStyle}
        >
          <FaWhatsapp size={20} />
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconStyle}
        >
          <FaTelegramPlane size={20} />
        </a>
        <a
          href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
          className={iconStyle}
        >
          <FaEnvelope size={20} />
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            alert("Enlace copiado");
          }}
          className={iconStyle}
        >
          <FaLink size={20} />
        </button>
      </div>
    </div>
  );
}
