"use client";

import dynamic from "next/dynamic";

// IMPORTANTE: ssr: false es la clave para que funcione en Next.js 15
const PdfViewer = dynamic(() => import("./PdfViewerBase"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BD0E0D] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Laden...</p>
      </div>
    </div>
  ),
});

export default PdfViewer;
