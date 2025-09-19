// app/[locale]/aktuelles/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function AktuellesPage(): JSX.Element {
  const locale = useLocale();

  const contentDe: JSX.Element = (
    <article
      className="prose prose-lg max-w-3xl mx-auto py-10
                 text-gray-900 dark:text-gray-100
                 dark:prose-headings:text-gray-100
                 dark:prose-strong:text-gray-100
                 dark:prose-a:text-red-400 dark:prose-a:hover:text-red-500
                 dark:prose-li:marker:text-gray-400"
    >
      <h1 className="text-3xl font-bold text-red-700">Aktuelles</h1>

      <p>
        <strong>
          Tipp: Aufzeichnung unserer Veranstaltung „Rechte Netzwerke in
          Lateinamerika“ LAF/ila
        </strong>
      </p>

      <p>
        Mal wieder ist ein lateinamerikanisches Land zum Labor der autoritären
        Marktradikalen geworden: Was in den 1970er-Jahren Chile unter Pinochet
        war, ist heute Argentinien unter Milei. Auch in Deutschland wollen
        Politiker:innen „mehr Milei und Musk wagen“.
      </p>
      <p>01.07.2025</p>

      <p>
        Wo alle von der „Neuen Rechten“ reden, schauen wir genau hin. Sicher:
        Die Dynamiken sozialer Medien haben den rechten Hass befeuert und die
        Figur des:der „Anti-Politiker:in“, wie sie Milei, Trump oder Bukele
        verkörpern, sind aktuelle Entwicklungen. Aber die Zusammenarbeit
        zwischen lateinamerikanischer und europäischer Rechter hat Geschichte –
        vor allem seit 1945.
      </p>

      <p>
        Diskutiert haben die Expert:innen Ute Löhning (freie Journalistin), Jana
        Flörchinger (medico international) und Daniel Stahl (Centre for Human
        Rights der FAU Erlangen-Nürnberg), welche Verbindungen wirklich neu und
        welche historisch gewachsen sind. Moderation: Luiz Ramalho
      </p>

      <p>
        Analysiert wurde die Rolle rechter Plattformen und ihren Einfluss auf
        Wahlkämpfe. Gesucht wurde nach Strategien, um der globalen Rechten
        unsere solidarischen Netzwerke entgegenzustellen.
      </p>

      <p>
        Die Veranstaltung fand auf Deutsch in Anlehnung an das Schwerpunktthema
        in der ila 486 „Rechte Netzwerke in Lateinamerika“ statt, die im Juni
        2025 erschienen ist.
      </p>

      <p>
        Hier der Link zur der am 11. Juni aufgezeichneten Debatte:{" "}
        <a href="#" target="_blank" rel="noopener noreferrer">
          Rechte Netzwerke in Lateinamerika: Kontinuitäten, Umbrüche und
          transnationale Allianzen
        </a>
      </p>

      <p>Veranstalter LAF Berlin / ila Bonn</p>

      <h2>Neue Homepage</h2>
      <p>
        Hier ist sie: unsere neue Homepage! Jederzeit mobil dabei. Auf Deutsch
        lesen & mit amigxs auf Spanisch einfach teilen. Und zwar nicht wie
        bisher sechs oder sieben Artikel, sondern alle Texte unserer Ausgaben
        plus Online-Only-Specials. Fast jeden Tag erwartet euch ein neuer Text
        aus dem aktuellen Dossier, spannende Hintergründe oder Kurioses aus
        Kunst & Kultur. Das alles frei zugänglich - aber nicht umsonst. Wenn du
        kannst - überleg dir doch, die ila mit 1 bis 10 Euro im Monat zu
        unterstützen!
      </p>

      <p>
        Im Jubiläumsjahr 2026 erweitern wir die neue Homepage peu à peu zu einem
        Archiv mit ila-Artikeln aus 50 Jahren.
      </p>

      <p>
        Dass es die ila jetzt auch auf Spanisch gibt, verdanken wir Carolina
        Garay Doig und der neuen Redaktionsgruppe ila en español. Wir stellen
        sie in den kommenden Wochen hier vor.
      </p>

      <p>
        Unser Webdesigner Ezequiel Angeloni hat mit viel Geduld unsere
        verrückten Wünsche umgesetzt und diese neue Website möglich gemacht. Das
        nennen wir mal Gesellenstück. Wenn ihr Feedback zur neuen Homepage habt
        - schreibt uns! An{" "}
        <a href="mailto:ila-bonn@t-online.de">ila-bonn@t-online.de</a>.
      </p>
    </article>
  );

  const contentEs: JSX.Element = (
    <article
      className="prose prose-lg max-w-3xl mx-auto py-10
                 text-gray-900 dark:text-gray-100
                 dark:prose-headings:text-gray-100
                 dark:prose-strong:text-gray-100
                 dark:prose-a:text-red-400 dark:prose-a:hover:text-red-500
                 dark:prose-li:marker:text-gray-400"
    >
      <h1 className="text-3xl font-bold text-red-700">Actualidad</h1>

      <p>
        <strong>
          Consejo: grabación de nuestro evento «Redes de derecha en América
          Latina» LAF/ila
        </strong>
      </p>

      <p>
        Una vez más, un país latinoamericano se ha convertido en laboratorio de
        los autoritarios radicales de mercado: lo que en los años 70 fue Chile
        bajo Pinochet, hoy lo es Argentina bajo Milei. También en Alemania hay
        políticos que piden «atreverse a más Milei y Musk».
      </p>
      <p>01.07.2025</p>

      <p>
        Mientras todo el mundo habla de la «nueva derecha», nosotras miramos de
        cerca. Cierto: la dinámica de las redes sociales ha alimentado el odio
        de derecha y la figura del «anti-político», como la que encarnan Milei,
        Trump o Bukele, son fenómenos actuales. Pero la colaboración entre la
        derecha latinoamericana y la europea tiene historia, sobre todo desde
        1945.
      </p>

      <p>
        Lo debatieron lxs expertxs Ute Löhning (periodista independiente), Jana
        Flörchinger (medico international) y Daniel Stahl (Centre for Human
        Rights de la FAU Erlangen-Nürnberg), sobre qué vínculos son realmente
        nuevos y cuáles tienen raíces históricas. Moderación: Luiz Ramalho.
      </p>

      <p>
        Se analizó el papel de las plataformas de derecha y su influencia en las
        campañas electorales. Se buscaron estrategias para oponer nuestras redes
        solidarias a la derecha global.
      </p>

      <p>
        El evento se realizó en alemán en relación con el dossier de la ila 486
        «Redes de derecha en América Latina», publicado en junio de 2025.
      </p>

      <p>
        Aquí el enlace al debate grabado el 11 de junio:{" "}
        <a href="#" target="_blank" rel="noopener noreferrer">
          Redes de derecha en América Latina: continuidades, rupturas y alianzas
          transnacionales
        </a>
      </p>

      <p>Organizadores: LAF Berlín / ila Bonn</p>

      <h2>Nueva página web</h2>
      <p>
        ¡Aquí está: nuestra nueva página web! Siempre disponible en el móvil. En
        alemán y fácil de compartir en español con amigxs. Y no solo seis o
        siete artículos como antes, sino todos los textos de nuestras ediciones
        más especiales online. Casi cada día te espera un nuevo texto del
        dossier actual, análisis de fondo o curiosidades de arte y cultura. Todo
        de acceso libre, pero no gratuito: si puedes, considera apoyar a la ila
        con 1 a 10 euros al mes.
      </p>

      <p>
        En el año del aniversario 2026 iremos ampliando la nueva web poco a poco
        hasta convertirla en un archivo con artículos de la ila de los últimos
        50 años.
      </p>

      <p>
        Que la ila esté ahora también en español se lo debemos a Carolina Garay
        Doig y al nuevo equipo de redacción ila en español. En las próximas
        semanas las presentaremos aquí.
      </p>

      <p>
        Nuestro diseñador web, Ezequiel Angeloni, hizo posible este sitio con
        mucha paciencia y logrando todos nuestros caprichos. Eso sí que es una
        obra maestra. Si tienes comentarios sobre la nueva web, ¡escríbenos! A{" "}
        <a href="mailto:ila-bonn@t-online.de">ila-bonn@t-online.de</a>.
      </p>
    </article>
  );

  return <>{locale === "es" ? contentEs : contentDe}</>;
}
