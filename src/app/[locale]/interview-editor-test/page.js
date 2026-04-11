"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const InterviewEditor = dynamic(
  () => import("../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);

// Sample HTML to test loading existing interview content
const SAMPLE_HTML = `<p><strong>Der bewaffnete Konflikt in Kolumbien begann vor über 70 Jahren. Was waren die Hauptursachen?</strong></p>
<p>Obwohl die Gründe unterschiedlich sind, haben die Gruppen gemeinsame Wurzeln: die Forderung nach sozialer Gerechtigkeit und nach einer gerechten Agrarreform.</p>
<p>Aber auch die Auswirkungen des Kalten Krieges auf Kolumbien spielten eine Rolle. Die Kampffronten und die Präsenz der Guerillas in verschiedenen Teilen des Landes.</p>
<p><strong>Wie viele illegale bewaffnete Gruppen existieren derzeit in Kolumbien?</strong></p>
<p>Es gibt derzeit vier Hauptgruppen, die in verschiedenen Regionen des Landes aktiv sind und unterschiedliche politische Ausrichtungen haben.</p>`;

export default function InterviewEditorTestPage() {
  const [html, setHtml] = useState("");
  const [loadSample, setLoadSample] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            InterviewEditor — Test
          </h1>
          <p className="text-gray-500 text-sm">
            Página de prueba aislada. El editor no está conectado a ningún formulario de artículo.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setLoadSample(true)}
              className="px-4 py-2 bg-[#BD0E0D] text-white text-sm rounded-lg hover:bg-[#a50c0b] transition-colors"
            >
              Cargar HTML de muestra
            </button>
            <button
              onClick={() => { setHtml(""); setLoadSample(false); }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Editor
          </h2>
          <InterviewEditor
            key={loadSample ? "sample" : "empty"}
            value={loadSample ? SAMPLE_HTML : ""}
            onChange={setHtml}
          />
        </div>

        {/* HTML output */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
            HTML generado
          </h2>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-all border border-gray-200">
            {html || <span className="text-gray-400">— vacío —</span>}
          </pre>
        </div>

        {/* Rendered preview */}
        {html && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
              Renderizado final (como lo verá el lector)
            </h2>
            <div
              className="prose max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
