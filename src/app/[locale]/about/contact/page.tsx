// app/[locale]/about/contact/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function ContactPage() {
  const locale = useLocale();

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Kontakt</h1>

      <p className="font-semibold">Informationsstelle Lateinamerika e.V.</p>
      <p>Oscar-Romero-Haus</p>
      <p>Heerstr. 205</p>
      <p>53111 Bonn</p>

      <p className="mt-4">
        <a
          href="mailto:ila-bonn@t-online.de"
          className="text-red-600 hover:underline"
        >
          ila-bonn@t-online.de
        </a>
      </p>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Contacto</h1>

      <p className="font-semibold">
        Oficina de Información sobre América Latina (ILA) e.V.
      </p>
      <p>Oscar-Romero-Haus</p>
      <p>Heerstr. 205</p>
      <p>53111 Bonn</p>

      <p className="mt-4">
        <a
          href="mailto:ila-bonn@t-online.de"
          className="text-red-600 hover:underline"
        >
          ila-bonn@t-online.de
        </a>
      </p>
    </>
  );

  return (
    <div className="prose prose-lg max-w-2xl mx-auto py-10">
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
