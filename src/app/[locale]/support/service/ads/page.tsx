"use client";

import { useLocale } from "next-intl";

export default function AdsPage() {
  const locale = useLocale();

  const contentDe = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700">Anzeigen</h1>

      <p>
        Mit einer Anzeige oder einer Beilage in der <strong>ila</strong> wird
        eine interessierte und qualifizierte Leser*innenschaft angesprochen.
        Zielgruppe der ila sind Menschen, die in vielfältiger Weise an
        Lateinamerika und dessen Kulturen interessiert sind. ila-Leser*innen
        sind engagierte Menschen, die in entwicklungspolitischen Initiativen und
        Institutionen, Menschenrechtsorganisationen, Studierenden- und
        Solidaritätsgruppen, Gewerkschaften und Kirchen oder in der Politik
        aktiv sind. Menschen, die sich für Literatur, Musik oder Filme aus
        Lateinamerika interessieren, Menschen, die durch Reisen ihren Horizont
        erweitern möchten. ila-Leser*innen sind Multiplikator*innen. Sie
        arbeiten in den Medien, universitären und anderen Forschungsinstituten,
        Schulen und der Erwachsenenbildung. Auch Entscheidungsträger*innen aus
        Politik, Wirtschaft, Nichtregierungsorganisationen und der
        Entwicklungszusammenarbeit Deutschlands sowie der EU schauen in die ila.
      </p>

      <h2>ila-Printausgabe</h2>
      <h3>Auflage und Vertrieb</h3>
      <p>
        Die ila erscheint zehn Mal im Jahr jeweils zur Monatsmitte und hat 48
        Seiten inkl. Umschlag im DIN A4-Format (in den Monaten Januar und August
        kommt kein Heft heraus). Jede Ausgabe der ila hat ein Dossier aus einem
        breit gefächerten Spektrum zwischen Politik, Wirtschaft und Kultur:
        Krieg, Militär, Polizei, Justiz, Ausbeutung von Mensch und Natur,
        Menschenrechte, soziale Bewegungen und Parteien, Feminismus, Ökologie,
        Landwirtschaft, Welthandel, Medien, Verschuldung, Stadtentwicklung,
        Literatur, Musik, Theater, Tanz, Sexualität, Tourismus, Essen und
        Trinken u.v.a.
      </p>
      <p>
        Die ila hat eine Auflage von 1100 Exemplaren, spezielle Ausgaben haben
        eine höhere Auflage. 90 Prozent werden im Abo in der Bundesrepublik
        Deutschland, Österreich, der Schweiz und Luxemburg vertrieben. Der Rest
        geht in den gut sortierten Buchhandel, wird über Einzelbestellungen
        verschickt oder bei politischen und kulturellen Veranstaltungen
        verkauft. Der Einzelpreis beträgt derzeit 7,- Euro.
      </p>
      <p>
        Die Gestaltung der Anzeigenvorlagen können wir auf Wunsch übernehmen.
        Wenn Sie Interesse an einer Anzeige- oder Beilagewerbung haben, nehmen
        Sie Kontakt mit uns auf:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>

      <h3>Formate und Preise</h3>
      <table className="table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">
              Format
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Maße (mm)
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Preis (€)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1/1 Seite</td>
            <td className="border border-gray-300 px-3 py-2">176 x 251</td>
            <td className="border border-gray-300 px-3 py-2">350,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">U4 (Rückseite)</td>
            <td className="border border-gray-300 px-3 py-2">190 x 230</td>
            <td className="border border-gray-300 px-3 py-2">450,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">
              1/2 Seite (1 Spalte)
            </td>
            <td className="border border-gray-300 px-3 py-2">85 x 251</td>
            <td className="border border-gray-300 px-3 py-2">150,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1/2 Spalte</td>
            <td className="border border-gray-300 px-3 py-2">85 x 125</td>
            <td className="border border-gray-300 px-3 py-2">100,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1/4 Spalte</td>
            <td className="border border-gray-300 px-3 py-2">85 x 63</td>
            <td className="border border-gray-300 px-3 py-2">50,-</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-sm italic">
        (Titelseite & Rückseite vierfarbig, Innenteil in schwarz-weiß. Alle
        Preise zzgl. der gesetzlichen Mehrwertsteuer.)
      </p>

      <h3>Beilagen</h3>
      <ul>
        <li>bis 20 gr: 225,- Euro je Tausend</li>
        <li>bis 40 gr: 300,- Euro je Tausend</li>
      </ul>
      <p>
        Mengenrabatt gewähren wir auf mindestens dreimal geschaltete Anzeigen
        (10 Prozent). Sonderkonditionen nach Absprache. Gestaltung Ihrer
        Anzeigen gegen einen geringen Aufpreis möglich, bei Mehrfachschaltung
        auch gratis.
      </p>
      <p>
        Anzeigenschluss ist jeweils der 25. des Vormonats. Bis dahin sollten die
        druckfertigen Unterlagen vorliegen, am liebsten via E-Mail (EPS- oder
        PDF-Datei mit eingebundenen Schriften) an:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
        . Weitere technische Details nach Absprache. Telefon: 0228 / 65 86 13.
      </p>

      <h3>Kontakt</h3>
      <address className="not-italic">
        Informationsstelle Lateinamerika e.V. <br />
        Oscar-Romero-Haus <br />
        Heerstr. 205 <br />
        53111 Bonn <br />
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </address>
    </div>
  );

  const contentEs = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700">Anuncios</h1>

      <p>
        Con un anuncio o un encarte en la <strong>ila</strong> llegas a un
        público lector interesado y cualificado. El público objetivo de la ila
        son personas interesadas en América Latina y sus culturas. Son lectoras
        y lectores comprometidos, activos en iniciativas e instituciones de
        desarrollo, organizaciones de derechos humanos, grupos estudiantiles y
        de solidaridad, sindicatos, iglesias o la política. Personas que se
        interesan por la literatura, la música o el cine de América Latina, o
        que buscan ampliar horizontes viajando. Son multiplicadores: trabajan en
        medios de comunicación, universidades, institutos de investigación,
        escuelas y educación de adultos. También responsables políticos,
        económicos, de ONG y de la cooperación alemana y europea leen la ila.
      </p>

      <h2>Edición impresa de la ila</h2>
      <h3>Tiraje y distribución</h3>
      <p>
        La ila aparece diez veces al año, a mediados de mes, con 48 páginas
        (incluida la portada) en formato DIN A4 (en enero y agosto no se
        publica). Cada número incluye un dossier con temas que abarcan desde
        política, economía y cultura hasta derechos humanos, movimientos
        sociales, feminismo, ecología, literatura, música, teatro, cine,
        sexualidad, turismo, gastronomía y mucho más.
      </p>
      <p>
        La ila tiene una tirada de 1.100 ejemplares, aunque algunos números
        especiales tienen mayor circulación. El 90% se distribuye por
        suscripción en Alemania, Austria, Suiza y Luxemburgo. El resto se vende
        en librerías, por pedido individual o en eventos políticos y culturales.
        El precio por ejemplar es actualmente de 7,- euros.
      </p>
      <p>
        Podemos encargarnos del diseño de tu anuncio si lo deseas. Si te
        interesa publicar un anuncio o encarte, ponte en contacto con nosotras:
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          {" "}
          ila-bonn@t-online.de
        </a>
      </p>

      <h3>Formatos y precios</h3>
      <table className="table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">
              Formato
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Medidas (mm)
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Precio (€)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">
              Página completa
            </td>
            <td className="border border-gray-300 px-3 py-2">176 x 251</td>
            <td className="border border-gray-300 px-3 py-2">350,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">Contraportada</td>
            <td className="border border-gray-300 px-3 py-2">190 x 230</td>
            <td className="border border-gray-300 px-3 py-2">450,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">
              1/2 página (columna)
            </td>
            <td className="border border-gray-300 px-3 py-2">85 x 251</td>
            <td className="border border-gray-300 px-3 py-2">150,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1/2 columna</td>
            <td className="border border-gray-300 px-3 py-2">85 x 125</td>
            <td className="border border-gray-300 px-3 py-2">100,-</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1/4 columna</td>
            <td className="border border-gray-300 px-3 py-2">85 x 63</td>
            <td className="border border-gray-300 px-3 py-2">50,-</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-sm italic">
        (Portada y contraportada a color, interior en blanco y negro. Todos los
        precios más IVA.)
      </p>

      <h3>Encartes</h3>
      <ul>
        <li>hasta 20 g: 225,- € por cada mil</li>
        <li>hasta 40 g: 300,- € por cada mil</li>
      </ul>
      <p>
        Ofrecemos descuento del 10% a partir de tres anuncios. Condiciones
        especiales a convenir. El diseño puede realizarse con pequeño recargo o
        gratis si se contratan varias inserciones.
      </p>
      <p>
        La fecha límite de entrega es el día 25 del mes anterior. Para entonces
        deben recibirse los archivos listos para imprimir, preferiblemente por
        correo electrónico (EPS o PDF con tipografías incrustadas) a:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
        . Más detalles técnicos bajo consulta. Teléfono: 0228 / 65 86 13.
      </p>

      <h3>Contacto</h3>
      <address className="not-italic">
        Informationsstelle Lateinamerika e.V. <br />
        Oscar-Romero-Haus <br />
        Heerstr. 205 <br />
        53111 Bonn <br />
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </address>
    </div>
  );

  return <>{locale === "es" ? contentEs : contentDe}</>;
}
