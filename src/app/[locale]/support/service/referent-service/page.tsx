"use client";

import { useLocale } from "next-intl";

export default function ReferentServicePage() {
  const locale = useLocale();

  const contentDe = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Referent*innenservice
      </h1>

      <p>
        Für Veranstaltungen zu Lateinamerika können wir passende Referent*innen
        oder Panelteilnehmer*innen vermitteln. Wir freuen uns über frühzeitige
        Anfragen, versuchen aber auch kurzfristige Gesuche möglich zu machen.
        Unsere Redaktionsmitglieder können zu politischen und gesellschaftlichen
        Entwicklungen in verschiedenen lateinamerikanischen Ländern (u.a.
        Argentinien, Ecuador, El Salvador, Guatemala, Kolumbien, Mexiko, Peru,
        Uruguay) oder länderübergreifend zu sozialen Bewegungen,
        Menschenrechten, Migration, Klima &amp; Energiewende, LGBTIQ+,
        politischem Exil, Erinnerungspolitik, Musik, Literatur und Kino
        referieren.
      </p>

      <p>
        <strong>Sprachen je nach Referent*in:</strong> Deutsch, Spanisch,
        Englisch
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
        Servicio de ponentes
      </h1>

      <p>
        Para eventos sobre América Latina podemos poner a disposición ponentxs
        en paneles adecuados. Agradecemos las solicitudes con antelación, pero
        también intentamos atender peticiones de último momento siempre que sea
        posible. Integrantes de nuestra redacción pueden dar charlas sobre
        desarrollos políticos y sociales en distintos países de América Latina
        (entre otros Argentina, Ecuador, El Salvador, Guatemala, Colombia,
        México, Perú, Uruguay) o de manera regional sobre movimientos sociales,
        derechos humanos, migración, clima y transición energética, LGBTIQ+,
        exilio político, políticas de la memoria, música, literatura y cine.
      </p>

      <p>
        <strong>Idiomas según la persona ponente:</strong> alemán, español,
        inglés
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
