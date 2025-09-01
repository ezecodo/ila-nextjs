"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function DonatePage() {
  const locale = useLocale();

  useEffect(() => {
    const id = "_" + Math.random().toString(36).substr(2, 9);
    const container = document.createElement("div");
    container.id = "twingle-public-embed-" + id;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;
    script.src = `https://spenden.twingle.de/embed/informationsstelle-lateinamerika-ila-e-v/spenden-allgemein/tw686e76ea72a53/widget/${id}`;

    const wrapper = document.getElementById("twingle-container");
    if (wrapper) {
      wrapper.innerHTML = "";
      wrapper.appendChild(container);
      container.after(script);
    }
  }, []);

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700">Spenden</h1>

      <p>
        Ein Printmedium ohne Großsponsoren und Geld vom Staat – das ist die ila.
        Nur dank unserer Community sind wir seit 1976 ein unabhängiges Medium.
        Fast unsere ganze Arbeit ist ehrenamtlich. Niemand bekommt ein Honorar
        dafür, auf Vernetzungstreffen zu fahren oder Interviews mit
        Kleinbäuerinnen und Filmemachern zu führen.
      </p>

      <p>Eure Spenden finanzieren unsere Reproduktionsarbeit:</p>
      <ul>
        <li>
          Die kleine Miete für unsere gemütlichen Büros in einem historischen
          sozialpolitischen Hausprojekt in der Bonner Innenstadt
        </li>
        <li>Papier, Kulis, Druckerpatronen, Büromaterial</li>
        <li>Unsere Steuerberatung</li>
        <li>Zwei halbe Bürostellen</li>
        <li>Den Kaffee für die Ehrenamtlichen ❤️</li>
      </ul>

      <p>
        Die nachhaltigste Unterstützung für unsere Arbeit ist es, Mitglied vom
        Förderkreis zu werden und uns monatlich zu unterstützen. 1 Euro? 100
        Euro? 1000 Euro? Wir haben alle unterschiedliche Möglichkeiten, aber
        alles hilft! Spendenoptionen:
      </p>

      <ul>
        <li>
          <strong>Dauerspenden</strong> – per Dauerauftrag, Kreditkarte oder
          Paypal (demnächst auch mit SEPA-Lastschriftmandat).
        </li>
        <li>
          <strong>Einmalspenden</strong> – per Überweisung, Kreditkarte, Paypal
          oder Briefumschlag
        </li>
        <li>
          <strong>Sachspenden</strong> – z.B. Kaffee und andere Getränke fürs
          Büro!
        </li>
      </ul>

      <p>
        Als gemeinnütziger Verein können wir euch eine Spendenquittung
        ausstellen.
      </p>
      <p>
        Ihr helft damit, Aktivist*innen, Forscher*innen und Journalist*innen aus
        Lateinamerika und Europa zu connecten. Nebenbei erhalten wir gemeinsam
        50 Jahre Bewegungsgedächtnis lebendig.
      </p>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700">Donaciones</h1>

      <p>
        Un medio impreso sin grandes patrocinadores ni dinero del Estado – eso
        es la ila. Solo gracias a nuestra comunidad somos desde 1976 un medio
        independiente. Casi todo nuestro trabajo es voluntario. Nadie recibe
        honorarios por viajar a encuentros de redes o por entrevistar a
        campesinas y cineastas.
      </p>

      <p>Tus donaciones financian nuestro trabajo cotidiano:</p>
      <ul>
        <li>
          El modesto alquiler de nuestra acogedora oficina en un histórico
          proyecto sociopolítico en el centro de Bonn
        </li>
        <li>Papel, bolígrafos, cartuchos de impresión, material de oficina</li>
        <li>Nuestros servicios de asesoría fiscal</li>
        <li>Dos medias jornadas de trabajo administrativo</li>
        <li>El café para las personas voluntarias ❤️</li>
      </ul>

      <p>
        La forma más sostenible de apoyar nuestro trabajo es hacerse miembrx del
        círculo de apoyo y contribuir con una donación mensual. ¿1 euro? ¿100
        euros? ¿1000 euros? Cada persona tiene diferentes posibilidades, ¡pero
        todo ayuda! Opciones de donación:
      </p>

      <ul>
        <li>
          <strong>Donaciones periódicas</strong> – por orden permanente, tarjeta
          de crédito o Paypal (pronto también con domiciliación SEPA).
        </li>
        <li>
          <strong>Donaciones únicas</strong> – por transferencia bancaria,
          tarjeta, Paypal o incluso en sobre
        </li>
        <li>
          <strong>Donaciones en especie</strong> – por ejemplo, café y otras
          bebidas para la oficina
        </li>
      </ul>

      <p>
        Como asociación sin fines de lucro podemos emitir certificados de
        donación.
      </p>
      <p>
        Con tu apoyo ayudas a conectar activistas, investigadorxs e
        investigadorxs y periodistas de América Latina y Europa. Y al mismo
        tiempo mantenemos vivo un archivo de 50 años de memoria de los
        movimientos.
      </p>
    </>
  );

  return (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      {locale === "es" ? contentEs : contentDe}

      {/* Widget Twingle */}
      <div id="twingle-container" className="mt-10" />
    </div>
  );
}
