// app/[locale]/about/editorial/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function EditorialPage() {
  const locale = useLocale();

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Die Redaktion</h1>

      <p>
        Die ila wird von einem engagierten Redaktionsteam getragen, das jeden
        Monat die neue Ausgabe zusammenstellt. Zuarbeit kommt von ständigen
        Mitarbeiter*innen in Lateinamerika, den USA und Europa.
      </p>

      <p className="mt-6 font-semibold">
        Kontakt:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">La Redacción</h1>

      <p>
        La ILA está sostenida por un equipo editorial comprometido que prepara
        cada mes la nueva edición. Contamos también con la colaboración de
        colaboradores permanentes en América Latina, Estados Unidos y Europa.
      </p>

      <p className="mt-6 font-semibold">
        Contacto:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>
    </>
  );

  return (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
