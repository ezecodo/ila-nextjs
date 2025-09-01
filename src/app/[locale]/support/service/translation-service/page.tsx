"use client";

import { useLocale } from "next-intl";

export default function TranslationServicePage() {
  const locale = useLocale();

  const contentDe = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Dolmetsch- und Übersetzungsservice
      </h1>

      <p>
        Wir haben ein fachlich und sprachlich hoch kompetentes Team für die
        Übersetzung von Fachtexten, Sachbüchern, literarischen Texten und
        Dokumenten. Außerdem vermitteln wir Konsekutiv- und
        Simultandolmetscher*innen für Spanisch-Deutsch und Deutsch-Spanisch.
      </p>

      <p>
        <strong>Bitte beachten:</strong> Nicht alle sind staatlich anerkannte
        Übersetzer*innen.
      </p>

      <p>
        <strong>Kontakt:</strong>{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>{" "}
        <br />
        <strong>Kosten:</strong> Verhandlungsbasis
      </p>
    </div>
  );

  const contentEs = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Servicio de interpretación y traducción
      </h1>

      <p>
        Contamos con un equipo altamente competente en lo técnico y lo
        lingüístico para la traducción de textos especializados, libros de
        divulgación, textos literarios y documentos. Además, ponemos en contacto
        con intérpretes consecutivos y simultáneos para español-alemán y
        alemán-español.
      </p>

      <p>
        <strong>Importante:</strong> no todas las personas traductoras cuentan
        con reconocimiento oficial del Estado.
      </p>

      <p>
        <strong>Contacto:</strong>{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>{" "}
        <br />
        <strong>Costos:</strong> a convenir
      </p>
    </div>
  );

  return <>{locale === "es" ? contentEs : contentDe}</>;
}
