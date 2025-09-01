// app/[locale]/about/datenschutz/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function DatenschutzPage() {
  const locale = useLocale();

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Hinweise zum Datenschutz nach Art. 13 DSGVO
      </h1>

      <h2>Allgemeine Hinweise</h2>
      <p>
        Die am 25. Mai 2018 in Kraft tretende Datenschutzgrundverordnung (DSGVO)
        ist eine europäische Verordnung, die die Verarbeitung personenbezogener
        Daten regelt. Diese soll den Schutz personenbezogener Daten in der
        Europäischen Union sicherstellen. Da uns der Schutz Ihrer Daten und
        damit einhergehend Ihrer Privatsphäre sehr wichtig ist, verarbeiten wir
        von der Informationsstelle Lateinamerika e.V. Ihre personenbezogenen
        Daten ausschließlich im Einklang mit den gesetzlichen Vorgaben.
      </p>
      <p>
        Wir benutzen aus Sicherheitsgründen und zum Schutz der Übertragung
        vertraulicher Inhalte, wie zum Beispiel Anfragen, die Sie an uns als
        Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung.
      </p>
      <p>
        Bei der Kommunikation per E-Mail kann die vollständige Datensicherheit
        von uns nicht gewährleistet werden, so dass wir Ihnen bei vertraulichen
        Informationen den Postweg empfehlen.
      </p>

      <h2>Verantwortliche Stelle</h2>
      <p>
        Informationsstelle Lateinamerika (ila) e.V., Oscar-Romero-Haus, Heerstr.
        205, 53111 Bonn <br />
        Telefon: (0228) 65 86 13 – Fax: (0228) 63 12 26 <br />
        E-Mail:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>

      <h2>Verarbeiten von Daten</h2>
      <p>
        Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO. Die
        Angaben des Nutzers werden zwecks Bearbeitung der Anfrage sowie für den
        Fall, dass Anschlussfragen entstehen, gespeichert.
      </p>

      <h2>Dauer der Speicherung</h2>
      <p>
        Ihre Daten werden nur solange gespeichert, wie es für die Zwecke
        erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
      </p>

      <h2>Zugriffsdaten / Server-Logfiles</h2>
      <p>
        Wir erheben Daten über jeden Zugriff (Serverlogfiles). Dazu gehören:
        URL, Datum, Uhrzeit, Browserdaten, Referrer, IP-Adresse, Provider.
      </p>

      <h2>Einbindung von Dritten</h2>
      <p>
        Inhalte Dritter (YouTube, Google Maps, etc.) können eingebunden sein,
        dabei wird die IP-Adresse der Nutzer übermittelt.
      </p>

      <h2>AddToAny – Bookmark & Share</h2>
      <p>
        Über AddToAny können Inhalte geteilt werden. Wir erhalten keine Daten.
      </p>

      <h2>Typekit Web Fonts</h2>
      <p>
        Externe Schriften von Adobe Typekit sind eingebunden. Mehr Infos:{" "}
        <a
          href="http://www.adobe.com/privacy/typekit.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600"
        >
          Datenschutzhinweise
        </a>
      </p>

      <h2>Cookies</h2>
      <p>
        Diese Website verwendet Cookies. Sie können das im Browser deaktivieren,
        aber dann sind ggf. Funktionen eingeschränkt.
      </p>

      <h2>Nutzeranalyse mit Matomo</h2>
      <p>
        Wir nutzen Matomo zur Analyse. Daten werden anonymisiert in Deutschland
        gespeichert.
      </p>

      <h2>Ihre Rechte</h2>
      <ul>
        <li>Auskunft, Berichtigung oder Löschung</li>
        <li>Einschränkung der Verarbeitung</li>
        <li>Datenübertragbarkeit</li>
        <li>Widerspruch gegen Direktmarketing</li>
        <li>Widerrufsrecht bei Einwilligungen</li>
      </ul>

      <h2>Beschwerderecht</h2>
      <p>
        Sie können sich an die Datenschutzaufsicht NRW wenden: <br />
        Landesbeauftragte für Datenschutz NRW, Kavalleriestraße 2-4, 40213
        Düsseldorf <br />
        E-Mail:{" "}
        <a href="mailto:poststelle@ldi.nrw.de" className="text-red-600">
          poststelle@ldi.nrw.de
        </a>
      </p>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Avisos de protección de datos según el Art. 13 RGPD
      </h1>

      <h2>Indicaciones generales</h2>
      <p>
        El Reglamento General de Protección de Datos (RGPD), en vigor desde el
        25 de mayo de 2018, regula el tratamiento de datos personales en la
        Unión Europea. Como la protección de sus datos y de su privacidad es muy
        importante para nosotros, en la ila tratamos sus datos exclusivamente de
        acuerdo con lo dispuesto en la normativa vigente.
      </p>
      <p>
        Por motivos de seguridad y para proteger la transmisión de contenidos
        confidenciales, utilizamos en nuestra web cifrado SSL/TLS.
      </p>
      <p>
        En la comunicación por correo electrónico no puede garantizarse
        completamente la seguridad, por lo que recomendamos el uso del correo
        postal para información confidencial.
      </p>

      <h2>Responsable</h2>
      <p>
        Informationsstelle Lateinamerika (ila) e.V. <br />
        Oscar-Romero-Haus, Heerstr. 205, 53111 Bonn <br />
        Tel.: (0228) 65 86 13 – Fax: (0228) 63 12 26 <br />
        Correo:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>

      <h2>Tratamiento de datos</h2>
      <p>
        La base legal es el Art. 6, apdo. 1, letra b del RGPD. Los datos
        facilitados se almacenan con el fin de tramitar consultas y posibles
        preguntas posteriores.
      </p>

      <h2>Duración del almacenamiento</h2>
      <p>
        Sus datos se almacenan solo mientras sea necesario para los fines
        indicados o mientras existan obligaciones legales de conservación.
      </p>

      <h2>Acceso y registros del servidor</h2>
      <p>
        Recogemos datos de cada acceso (archivos de registro del servidor): URL,
        fecha, hora, datos del navegador, referrer, dirección IP, proveedor.
      </p>

      <h2>Contenido de terceros</h2>
      <p>
        Pueden integrarse contenidos de terceros (YouTube, Google Maps, etc.),
        lo que implica la transmisión de la dirección IP del usuario.
      </p>

      <h2>AddToAny – Compartir</h2>
      <p>
        A través de AddToAny se pueden compartir contenidos. La ila no recibe
        datos personales en este proceso.
      </p>

      <h2>Fuentes web de Typekit</h2>
      <p>
        Se integran fuentes externas de Adobe Typekit (EE. UU.). Más
        información:{" "}
        <a
          href="http://www.adobe.com/privacy/typekit.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600"
        >
          Política de privacidad de Typekit
        </a>
      </p>

      <h2>Cookies</h2>
      <p>
        Este sitio utiliza cookies. Puede desactivarlas en su navegador, aunque
        ello puede limitar algunas funciones.
      </p>

      <h2>Análisis con Matomo</h2>
      <p>
        Utilizamos Matomo para el análisis estadístico de visitas. Los datos se
        almacenan de forma anónima en Alemania.
      </p>

      <h2>Sus derechos</h2>
      <ul>
        <li>Acceso, rectificación o eliminación de sus datos</li>
        <li>Limitación del tratamiento</li>
        <li>Portabilidad de los datos</li>
        <li>Oposición al marketing directo</li>
        <li>Derecho a retirar su consentimiento</li>
      </ul>

      <h2>Derecho de reclamación</h2>
      <p>
        Puede dirigirse a la autoridad de control competente en NRW: <br />
        Autoridad de Protección de Datos de Renania del Norte-Westfalia <br />
        Kavalleriestraße 2-4, 40213 Düsseldorf <br />
        Correo:{" "}
        <a href="mailto:poststelle@ldi.nrw.de" className="text-red-600">
          poststelle@ldi.nrw.de
        </a>
      </p>
    </>
  );

  return (
    <div className="prose prose-lg max-w-4xl mx-auto py-10">
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
