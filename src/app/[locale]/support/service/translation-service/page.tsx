// app/[locale]/support/service/translation-service/page.tsx
export default function TranslationServicePage() {
  return (
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
}
