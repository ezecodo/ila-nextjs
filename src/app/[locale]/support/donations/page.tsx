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
        Eine Zeitschrift ohne Großsponsoren und Geld vom Staat – das ist die
        ila. Nur dank unserer Community sind wir seit 1976 ein unabhängiges
        Medium.
      </p>

      <p>
        Die nachhaltigste Unterstützung für unsere Arbeit ist es, Mitglied vom
        Förderkreis zu werden und uns monatlich zu unterstützen. 1 Euro? 100
        Euro? 1000 Euro? Alles hilft!
      </p>

      {/* Widget Twingle */}
      <div id="twingle-container" className="my-10" />

      <p>
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
        Una revista sin grandes patrocinadores ni dinero del Estado – eso es la
        ila. Solo gracias a nuestra comunidad somos desde 1976 un medio
        independiente.
      </p>

      <p>
        La forma más sostenible de apoyar nuestro trabajo es hacerse miembrx del
        círculo de apoyo y contribuir con una donación mensual. ¿1 euro? ¿100
        euros? ¿1000 euros? ¡Todo ayuda!
      </p>

      {/* Widget Twingle */}
      <div id="twingle-container" className="my-10" />

      <p>
        Casi todo nuestro trabajo es voluntario. Nadie recibe honorarios por
        viajar a encuentros de redes o por entrevistar a campesinas y cineastas.
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
        Como asociación sin fines de lucro podemos emitir certificados de
        donación.
      </p>
      <p>
        Con tu apoyo ayudas a conectar activistas, investigadorxs y periodistas
        de América Latina y Europa. Y al mismo tiempo mantenemos vivo un archivo
        de 50 años de memoria de los movimientos.
      </p>
    </>
  );

  return (
    <div
      className="prose prose-lg max-w-3xl mx-auto py-10
               text-gray-900 dark:text-gray-100
               dark:prose-headings:text-gray-100
               dark:prose-strong:text-gray-100
               dark:prose-a:text-red-400 dark:prose-a:hover:text-red-500
               dark:prose-li:marker:text-gray-400"
    >
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
