// app/[locale]/test-pdf/page.jsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Importar dinámicamente sin SSR
const PDFFlipbook = dynamic(
  () =>
    import(
      "../../../app/[locale]/dashboard-users/pdf-abo/components/PdfViewer/PdfViewer"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BD0E0D]"></div>
      </div>
    ),
  },
);

export default function TestPDF() {
  return (
    <div className="min-h-screen p-8">
      <Suspense
        fallback={
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BD0E0D]"></div>
          </div>
        }
      >
        <PDFFlipbook
          pdfUrl="/pdfs/ila434_Dossier_Mais.pdf"
          title="Test PDF Viewer"
          locale="de"
        />
      </Suspense>
    </div>
  );
}
