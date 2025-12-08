// app/[locale]/about/editorial/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function EditorialPage() {
  const locale = useLocale();

  const contentDe = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">Die Redaktion</h1>

      <p>
        <strong>Alix Arnold</strong> lebt in Köln, ist seit 2001 bei der ila
        aktiv, schreibt am liebsten über Klassenkämpfe und soziale Bewegungen,
        und ist immer auf der Suche nach Musik der Revolten.
      </p>
      <p>
        <strong>Gert Eisenbürger</strong> ist seit 1980 Mitglied der
        ila-Redaktion. Von 1985 bis 2023 war er fest im Redaktionsbüro und
        verantwortlicher Redakteur der ila. Seine inhaltlichen Schwerpunkte sind
        die Länder des südlichen Lateinamerika, Bolivien, die Karibik,
        belletristische und biographische Literatur sowie Flucht- und
        Migrationsbewegungen aus und nach Lateinamerika.
      </p>
      <p>
        <strong>Charlotte Fischer</strong> ist Kulturwissenschaftlerin und
        interessiert sich besonders für entwicklungspolitische, feministische
        und popkulturelle Themen. Ihr Länderfokus liegt auf Kolumbien und
        Mexiko.
      </p>
      <p>
        <strong>Rika Johanna Graber</strong> ist seit 2023 bei der ila aktiv.
        Sie hat Rechtswissenschaften, Philosophie und Romanistik studiert und
        interessiert sich besonders für die Themenbereiche Natur(-schutz) und
        Klima, Migration, Strategische Prozessführung und lateinamerikanische
        Literatur sowie die beiden südamerikanischen Länder Kolumbien und Peru.
      </p>
      <p>
        <strong>Ralf Heinen</strong>, Jahrgang 1954, studierte Französisch und
        Spanisch in Münster und Bonn, arbeitete als Grafikredakteur und setzt
        bis heute das gesamte Layout der ila um.
      </p>
      <p>
        <strong>Laura Held</strong> ist Bibliothekarin und seit 1997 bei der ila
        aktiv. Sie hat Spaß am Schreiben, Lesen und Übersetzen. Bevorzugte
        Regionen: Brasilien und Zentralamerika. Themen: alles, was der
        Mainstream und die Aktualität gerne übersehen.
      </p>
      <p>
        <strong>Mirjana Jandik</strong> ist freie Journalistin und
        Kulturanthropologin. Sie promoviert zum antifaschistischen Exil in
        Mexiko und interessiert sich für feministische Bewegungen, Klima,
        Energie(w)ende und Migration.
      </p>
      <p>
        <strong>Gaby Kleinen-Rätz</strong> hat Ende 1976 das erste ila-Info auf
        einer Schreibmaschine getippt. Heute liest sie vor allem Korrektur und
        macht die Buchhaltung.
      </p>
      <p>
        <strong>Gaby Küppers</strong>, promovierte Hispanistin, ist seit 1985
        Mitglied der ila-Redaktion. Sie schreibt Rezensionen, am liebsten über
        Romane lateinamerikanischer Autorinnen, über Handelsbeziehungen mit
        lateinamerikanischen Ländern oder Blöcken sowie deutsche Auswanderung
        nach Brasilien im 19. Jahrhundert und was daraus wurde. Sie will immer
        wissen, wie weibliche und männliche Rollen jeweils verteilt sind, wer
        sie aushandelt und wie darüber gesprochen wird oder nicht.
      </p>

      <p>
        <strong>Verena Lucía Landes</strong> ist seit 2015 Redaktionsmitglied
        und seit 2022 im Vorstand der ila. Sie schreibt, netzwerkt und
        organisiert Veranstaltungen.
      </p>
      <p>
        <strong>Werner Rätz</strong> ist Gründungsmitglied der ila von 1975. Er
        vertritt die ila in den Gremien von Attac Deutschland seit dessen
        Gründung 2000, arbeitet im weitesten Sinne zu ökonomischen Themen, im
        engeren zur sozialen Frage, also Sozialversicherungen, bedingungslosem
        Grundeinkommen, Umverteilung, und zu Fragen von Kapitalismus- und
        Wachstumskritik. Mehr findet man auf seiner Webseite{" "}
        <a
          href="http://www.werner-raetz.de"
          className="text-red-600 underline"
          target="_blank"
        >
          www.werner-raetz.de
        </a>
        .
      </p>
      <p>
        <strong>Henry Schmahlfeldt</strong> ist in Mexiko aufgewachsen. Seit
        1976 engagiert er sich in der Lateinamerika Solidarität. Er ist
        Mitgründer der Informationsstelle El Salvador in München 1980 und seit
        1985 in der ila in Bonn. 2001 gestaltete er die erste Website der ila
        und betreut sie seither.
      </p>
      <p>
        <strong>Valerie Systermans</strong> studierte Lateinamerikastudien und
        Politikwissenschaften an der Universität Bonn. Seit 2024 übersetzt,
        schreibt und korrigiert sie Texte bei der ila. Besonders interessieren
        sie feministische Themen und die Länder Südamerikas und der Karibik.
      </p>
      <p>
        <strong>Inga Triebel</strong> [-/deren] hat Lateinamerikastudien und
        Philosophie studiert und ist in der ila vor allem Teil des
        Layoutprozesses. Schwerpunktbereiche aus Lateinamerika sind für Inga
        unter anderem Nicaragua und lateinamerikanische Feminismen.
      </p>
      <p>
        <strong>Britt Weyde</strong> ist Regionalwissenschaftlerin
        Lateinamerika, DJ, Songwriterin, diplomierte Übersetzerin und
        Konsekutivdolmetscherin. Regionen: Argentinien, Kolumbien, Uruguay.
        Themen: Musik, Feminismus, Radios Comunitarias.
      </p>
    </>
  );

  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">La Redacción</h1>

      <p>
        <strong>Alix Arnold</strong> vive en Colonia, participa en la ila desde
        2001, escribe sobre todo acerca de luchas de clases y movimientos
        sociales, y está siempre en busca de músicas de las revueltas.
      </p>
      <p>
        <strong>Gert Eisenbürger</strong> es miembro de la redacción de la ila
        desde 1980. De 1985 a 2023 trabajó de forma permanente en la oficina de
        redacción y fue editor responsable. Sus principales áreas de trabajo son
        los países del Cono Sur, Bolivia, el Caribe, la literatura de ficción y
        biográfica, así como los movimientos de huida y migración desde y hacia
        América Latina.
      </p>
      <p>
        <strong>Charlotte Fischer</strong> es especialista en estudios
        culturales y está interesada sobre todo en temas de desarrollo,
        feminismo y cultura pop. Sus focos regionales son Colombia y México.
      </p>
      <p>
        <strong>Rika Johanna Graber</strong> participa en la ila desde 2023.
        Estudió Derecho, Filosofía y Filología Románica y se interesa
        especialmente por los temas: protección del medio ambiente, clima,
        migración, litigio estratégico y literatura latinoamericana, así como
        por los dos países sudamericanos Colombia y Perú.
      </p>
      <p>
        <strong>Ralf Heinen</strong>, nacido en 1954, estudió francés y español
        en Münster y Bonn, trabajó como redactor gráfico y hasta hoy realiza
        todo el diseño de la ila.
      </p>
      <p>
        <strong>Laura Held</strong> es bibliotecaria y participa activamente en
        la ila desde 1997. Le gusta escribir, leer y traducir. Regiones
        preferidas: Brasil y Centroamérica. Temas: todo aquello que el
        mainstream y la actualidad suelen pasar por alto.
      </p>
      <p>
        <strong>Mirjana Jandik</strong> es periodista independiente y
        antropóloga cultural. Está realizando su doctorado sobre el exilio
        antifascista en México y se interesa por los movimientos feministas, el
        clima, la transición energética y la migración.
      </p>
      <p>
        <strong>Gaby Kleinen-Rätz</strong> mecanografió a finales de 1976 el
        primer boletín de la ila. Hoy se dedica principalmente a la corrección
        de textos y a la contabilidad.
      </p>
      <p>
        <strong>Gaby Küppers</strong>, doctora en filología hispánica, es
        miembro de la redacción de la ila desde 1985. Escribe reseñas, sobre
        todo de novelas de autoras latinoamericanas, sobre relaciones
        comerciales con países o bloques latinoamericanos, así como sobre la
        emigración alemana a Brasil en el siglo XIX y lo que de ella resultó.
        Siempre quiere saber cómo se reparten los roles de género, quién los
        negocia y cómo se habla — o no se habla— de ellos.
      </p>
      <p>
        <strong>Verena Lucía Landes</strong> es miembro de la redacción desde
        2015 y, desde 2022, forma parte de la junta directiva de la ila.
        Escribe, teje redes y organiza eventos.
      </p>
      <p>
        <strong>Werner Rätz</strong> es miembro fundador de la ila desde 1975.
        Representa a la ila en los órganos de Attac Alemania desde su fundación
        en 2000, trabaja en sentido amplio sobre temas económicos y, más
        específicamente, sobre la cuestión social: seguros sociales, renta
        básica incondicional, redistribución, así como críticas al capitalismo y
        al crecimiento. Más información en su página web{" "}
        <a
          href="http://www.werner-raetz.de"
          className="text-red-600 underline"
          target="_blank"
        >
          www.werner-raetz.de
        </a>
        .
      </p>
      <p>
        <strong>Henry Schmahlfeldt</strong> creció en México. Desde 1976 está
        comprometido con la solidaridad con América Latina. Cofundó en 1980 la
        Oficina de Información sobre El Salvador en Múnich y, desde 1985,
        participa en la ila en Bonn. En 2001 diseñó la primera página web de la
        ila y desde entonces la mantiene.
      </p>
      <p>
        <strong>Valerie Systermans</strong> estudió Estudios Latinoamericanos y
        Ciencias Políticas en la Universidad de Bonn. Desde 2024 traduce,
        escribe y corrige textos en la ila. Le interesan especialmente los temas
        feministas y los países de América del Sur y el Caribe.
      </p>
      <p>
        <strong>Inga Triebel</strong> [-/deren] estudió Estudios
        Latinoamericanos y Filosofía y, en la ila, participa sobre todo en el
        proceso de maquetación. Sus áreas temáticas en América Latina incluyen,
        entre otras, Nicaragua y los feminismos latinoamericanos.
      </p>
      <p>
        <strong>Britt Weyde</strong> es especialista en estudios regionales
        sobre América Latina, DJ, compositora, traductora diplomada e intérprete
        consecutiva. Sus regiones de interés: Argentina, Colombia, Uruguay. Sus
        temas: música, feminismo y radios comunitarias.
      </p>
    </>
  );

  return (
    <div
      className="prose prose-lg max-w-3xl mx-auto py-10 space-y-4
               text-gray-900 dark:text-gray-100
               dark:prose-headings:text-gray-100
               dark:prose-strong:text-gray-100
               dark:prose-a:text-red-400 dark:prose-a:hover:text-red-500"
    >
      {locale === "es" ? contentEs : contentDe}
    </div>
  );
}
