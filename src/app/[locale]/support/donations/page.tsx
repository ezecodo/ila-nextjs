"use client";

import { useEffect } from "react";

export default function DonatePage() {
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

  return (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
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

      {/* Widget Twingle */}
      <div id="twingle-container" className="mt-10" />
    </div>
  );
}
