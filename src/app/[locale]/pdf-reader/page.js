"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PdfReader = dynamic(() => import("../components/PdfReader/PdfReader"), { ssr: false });

export default function PdfReaderDevPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlParam = searchParams.get("url");

  const [inputUrl, setInputUrl] = useState(urlParam || "");
  const [activeUrl, setActiveUrl] = useState(urlParam || "");
  const [showReader, setShowReader] = useState(!!urlParam);

  if (showReader && activeUrl) {
    return (
      <PdfReader
        pdfUrl={activeUrl}
        title="ila — PDF Reader (dev)"
        onClose={() => setShowReader(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-lg">
        <h1
          className="text-white text-3xl font-black mb-1"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          ila PDF Reader
        </h1>
        <p className="text-gray-400 text-sm mb-8">Desarrollo — introduce una URL de PDF para testear</p>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">
              URL del PDF (Cloudinary u otra)
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputUrl) {
                  setActiveUrl(inputUrl);
                  setShowReader(true);
                }
              }}
              placeholder="https://res.cloudinary.com/..."
              className="w-full bg-gray-800 text-white text-sm px-4 py-3 rounded-lg border border-gray-700 focus:border-[#BD0E0D] focus:outline-none placeholder-gray-600"
            />
          </div>

          <button
            onClick={() => {
              if (inputUrl) {
                setActiveUrl(inputUrl);
                setShowReader(true);
              }
            }}
            disabled={!inputUrl}
            className="w-full py-3 bg-[#BD0E0D] hover:bg-[#a50c0b] disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors"
          >
            Abrir Reader →
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-6 text-center">
          También puedes usar <code className="text-gray-500">?url=https://...</code> en la URL
        </p>
      </div>
    </div>
  );
}
