export default function EditorialPage() {
  return (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
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
    </div>
  );
}
