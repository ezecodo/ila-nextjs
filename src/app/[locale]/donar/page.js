"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function DonarPage() {
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      {locale === "es" ? (
        <>
          <h1 className="text-3xl font-bold mb-4">Donar a ILA</h1>
          <p className="mb-4">
            Tu donación nos ayuda a seguir publicando artículos, ediciones y
            mantener el archivo digital. ¡Gracias por tu apoyo!
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">Spenden an ILA</h1>
          <p className="mb-4">
            Ihre Spende hilft uns, weiterhin Artikel und Ausgaben zu
            veröffentlichen und unser digitales Archiv zu pflegen. Vielen Dank
            für Ihre Unterstützung!
          </p>
        </>
      )}
      <div id="twingle-container" />
    </div>
  );
}
