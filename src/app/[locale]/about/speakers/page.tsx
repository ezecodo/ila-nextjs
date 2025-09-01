// app/[locale]/about/referent/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function ReferentPage() {
  const locale = useLocale();

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Referent:innen</h1>

      <p>
        Einige Redakteur*innen und Mitarbeiter*innen der ila arbeiten als
        Referent*innen und informieren Presse und Öffentlichkeit über das
        politische Geschehen in Lateinamerika. Sie freuen sich über Einladungen
        zur aktiven Teilnahme an Ihrer Informations- oder
        Diskussionsveranstaltung. Kontakt über die ila.
      </p>
      <p>
        Hier eine Liste (in alphabetischer Reihenfolge) von Referent:innen, die
        zu verschiedenen Themen – alle natürlich in Zusammenhang mit
        Lateinamerika bzw. einzelnen Ländern des Kontinents – eingeladen werden
        können.
      </p>
      <p>
        Kontakt über die ila. Kosten: Verhandlungsbasis. Bei den mit „ebag“
        gekennzeichneten Referent:innen ist unter bestimmten Bedingungen eine
        Abrechnung der Veranstaltung über die Europäische Akademie
        Nordrhein-Westfalen möglich. Näheres unter{" "}
        <a
          href="https://www.ebag-bonn.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600"
        >
          www.ebag-bonn.de
        </a>{" "}
        oder bei der ila.
      </p>

      <ul className="mt-6 space-y-6">
        <li>
          <p className="font-semibold">Ulf Baumgärtner</p>
          <p>
            Themen: Landfrage, Menschenrechte, Krieg und Frieden,
            Neokolonialismus in Lateinamerika, Kaffee, Fairer Handel,
            Jugendbanden.
          </p>
          <p>Kosten: Verhandlungsbasis. Abrechnung über ebag möglich.</p>
        </li>
        <li>
          <p className="font-semibold">Gert Eisenbürger</p>
          <p>
            Themen: Politische Perspektiven in Lateinamerika, Literatur,
            Uruguay, Argentinien, Linke in Lateinamerika.
          </p>
          <p>Kosten: Verhandlungsbasis.</p>
        </li>
        <li>
          <p className="font-semibold">Werner Rätz</p>
          <p>
            Themen: bedingungsloses Grundeinkommen, Sozialsysteme,
            Globalisierung, (Bio)Diversität, Gentechnologie, Menschenrechte,
            Krieg und Frieden, Wasser/Privatisierung.
          </p>
          <p>
            Kosten: Verhandlungsbasis. Abrechnung über ebag möglich. <br />
            Internet:{" "}
            <a
              href="https://www.werner-raetz.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600"
            >
              www.werner-raetz.de
            </a>
          </p>
        </li>
        <li>
          <p className="font-semibold">Britt Weyde</p>
          <p>
            Themen: Uruguay, Argentinien, Soziale Bewegungen, Musik, Migration,
            Umweltkonflikte.
          </p>
          <p>Kosten: Verhandlungsbasis.</p>
        </li>
      </ul>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Ponentes</h1>

      <p>
        Algunas redactoras y redactores, así como colaboradoras y colaboradores
        de la ila, trabajan como ponentas y ponentes e informan a la prensa y al
        público sobre la situación política en América Latina. Están disponibles
        para participar activamente en eventos informativos o de debate.
        Contacto a través de la ila.
      </p>
      <p>
        A continuación, una lista (en orden alfabético) de ponentes que pueden
        ser invitados para distintos temas, todos ellos relacionados con América
        Latina o países concretos del continente.
      </p>
      <p>
        Contacto a través de la ila. Costes: a convenir. En el caso de ponentes
        marcados con “ebag”, bajo ciertas condiciones es posible facturar la
        actividad a través de la Academia Europea de Renania del Norte-
        Westfalia. Más información en{" "}
        <a
          href="https://www.ebag-bonn.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600"
        >
          www.ebag-bonn.de
        </a>{" "}
        o directamente en la ila.
      </p>

      <ul className="mt-6 space-y-6">
        <li>
          <p className="font-semibold">Ulf Baumgärtner</p>
          <p>
            Temas: cuestión de la tierra, derechos humanos, guerra y paz,
            neocolonialismo en América Latina, café, comercio justo, pandillas
            juveniles.
          </p>
          <p>Costes: a convenir. Posible facturación vía ebag.</p>
        </li>
        <li>
          <p className="font-semibold">Gert Eisenbürger</p>
          <p>
            Temas: perspectivas políticas en América Latina, literatura,
            Uruguay, Argentina, izquierda en América Latina.
          </p>
          <p>Costes: a convenir.</p>
        </li>
        <li>
          <p className="font-semibold">Werner Rätz</p>
          <p>
            Temas: renta básica incondicional, sistemas sociales, globalización,
            (bio)diversidad, biotecnología, derechos humanos, guerra y paz,
            agua/privatización.
          </p>
          <p>
            Costes: a convenir. Posible facturación vía ebag. <br />
            Web:{" "}
            <a
              href="https://www.werner-raetz.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600"
            >
              www.werner-raetz.de
            </a>
          </p>
        </li>
        <li>
          <p className="font-semibold">Britt Weyde</p>
          <p>
            Temas: Uruguay, Argentina, movimientos sociales, música, migración,
            conflictos medioambientales.
          </p>
          <p>Costes: a convenir.</p>
        </li>
      </ul>
    </>
  );

  return (
    <div className="prose prose-lg max-w-4xl mx-auto py-10">
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
