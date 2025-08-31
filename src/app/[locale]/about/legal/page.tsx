// app/[locale]/impressum/page.tsx
export default function ImpressumPage() {
  return (
    <div className="prose prose-lg max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Impressum</h1>

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        Informationsstelle Lateinamerika (ila) e.V. <br />
        Oscar-Romero-Haus, Heerstr. 205, 53111 Bonn
      </p>

      <h2>Vertreten durch</h2>
      <p>Vorsitzende: Naomi Rattunde, Ralf Heinen</p>

      <h2>Kontakt</h2>
      <p>
        Telefon: (0228) 65 86 13 <br />
        E-Mail:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>

      <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p>
        Britt Weyde <br />
        Oscar-Romero-Haus, Heerstr. 205, 53111 Bonn
      </p>

      <h2>Registergericht</h2>
      <p>
        Die Informationsstelle Lateinamerika ist eingetragen im Vereinsregister.{" "}
        <br />
        Amtsgericht Bonn. VR 4013
      </p>

      <h2>Rechtshinweise</h2>
      <p>
        Seit dem 9. Januar 2016 gilt die Verordnung (EU) Nr. 524/2013 über die
        Online-Beilegung verbraucherrechtlicher Streitigkeiten (kurz:
        ODR-Verordnung). Sie dient der Stärkung der Verbraucherrechte. Die
        Europäische Kommission stellt unter{" "}
        <a
          href="https://webgate.ec.europa.eu/odr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600"
        >
          https://webgate.ec.europa.eu/odr/
        </a>{" "}
        eine entsprechende Plattform zur außergerichtlichen
        Online-Streitbeilegung bereit.
      </p>

      <h2>Streitschlichtung</h2>
      <p>
        Wir sind weder bereit noch verpflichtet, an einem
        Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </p>

      <h2>Gemeinnützigkeit</h2>
      <p>
        Wir sind wegen der Förderung des Völkerverständigungsgedankens und der
        internationalen Gesinnung (Nr. 12 der Anlage 7 EStR) als gemeinnützigen
        Zwecken dienend anerkannt.
      </p>

      <p className="mt-10 text-sm text-gray-600">
        Weitere Informationen: Geschäftsbedingungen und Datenschutzerklärung
        finden Sie auf den entsprechenden Seiten.
      </p>
    </div>
  );
}
