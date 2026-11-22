// InterLetter de EJEMPLO (botón "Beispiel laden" del dashboard): contenido
// completo en DE/ES/PT para ver cómo queda el mail y mostrárselo a la
// redacción. Los temas son inventados — no son la planificación real de ila.

export function sampleDraft() {
  const key = (n) => `sample-${n}-${Date.now()}`;
  return {
    languages: { de: true, es: true, pt: true },
    subject: {
      de: "ila InterLetter: Unsere nächsten Schwerpunkte",
      es: "InterLetter de la ila: nuestros próximos temas",
      pt: "InterLetter da ila: nossos próximos temas",
    },
    preheader: {
      de: "Wasser, Feminismen, Musik und Protest – wir suchen eure Beiträge",
      es: "Agua, feminismos, música y protesta: buscamos sus colaboraciones",
      pt: "Água, feminismos, música e protesto: buscamos suas colaborações",
    },
    intro: {
      de: "Liebe Autor*innen, Illustrator*innen und Fotograf*innen,\n\nmit dem InterLetter erzählen wir euch, an welchen Schwerpunkten wir gerade arbeiten und welche Themen in den nächsten Ausgaben der ila kommen. Wir freuen uns über eure Vorschläge für Artikel, Fotos und Illustrationen!\n\nUnd ein großes Dankeschön an alle, die an der ila 500 mitgearbeitet haben.",
      es: "Queridas autoras y autores, ilustradoras e ilustradores, fotógrafas y fotógrafos:\n\ncon el InterLetter les contamos en qué temas centrales estamos trabajando y qué temas vienen en los próximos números de la ila. ¡Nos alegramos de recibir sus propuestas de artículos, fotos e ilustraciones!\n\nY un enorme agradecimiento a todas las personas que colaboraron en la ila 500.",
      pt: "Queridas autoras e autores, ilustradoras e ilustradores, fotógrafas e fotógrafos,\n\ncom o InterLetter contamos a vocês em quais temas estamos trabalhando e quais temas vêm nas próximas edições da ila. Ficamos felizes em receber suas propostas de artigos, fotos e ilustrações!\n\nE um grande obrigado a todas as pessoas que colaboraram na ila 500.",
    },
    topics: [
      {
        key: key(1),
        number: "502",
        month: "2027-02",
        deadline: "2027-01-08",
        title: {
          de: "Wasser als Gemeingut",
          es: "El agua como bien común",
          pt: "A água como bem comum",
        },
        keywords: {
          de: "Privatisierung, Bergbau, Dürre, Widerstand",
          es: "privatización, minería, sequía, resistencia",
          pt: "privatização, mineração, seca, resistência",
        },
        desc: {
          de: "Von Chile bis Mexiko wird um das Wasser gestritten: Bergbau- und Agrarkonzerne graben Gemeinden das Wasser ab, Städte trocknen aus, und überall entstehen Bewegungen, die Wasser als Gemeingut verteidigen.\n\nWir suchen Reportagen und Analysen zu konkreten Konflikten, Porträts von Basisinitiativen sowie Fotos und Illustrationen zum Thema.",
          es: "De Chile a México se disputa el agua: empresas mineras y agroindustriales dejan sin agua a las comunidades, las ciudades se secan y en todas partes surgen movimientos que defienden el agua como bien común.\n\nBuscamos reportajes y análisis sobre conflictos concretos, retratos de iniciativas de base, y también fotos e ilustraciones sobre el tema.",
          pt: "Do Chile ao México, a água está em disputa: empresas de mineração e do agronegócio deixam comunidades sem água, cidades secam e por toda parte surgem movimentos que defendem a água como bem comum.\n\nBuscamos reportagens e análises sobre conflitos concretos, retratos de iniciativas de base, além de fotos e ilustrações sobre o tema.",
        },
      },
      {
        key: key(2),
        number: "503",
        month: "2027-03",
        deadline: "2027-02-05",
        title: {
          de: "Feminismen in Bewegung",
          es: "Feminismos en movimiento",
          pt: "Feminismos em movimento",
        },
        keywords: {
          de: "8M, Abtreibungsrechte, Care-Arbeit, Backlash",
          es: "8M, derecho al aborto, trabajo de cuidados, reacción conservadora",
          pt: "8M, direito ao aborto, trabalho de cuidado, reação conservadora",
        },
        desc: {
          de: "Wie organisieren sich feministische Bewegungen in Zeiten des rechten Rollbacks? Wir interessieren uns für Strategien, Bündnisse und Erfolge – und für die Stimmen, die sonst selten gehört werden.",
          es: "¿Cómo se organizan los movimientos feministas en tiempos de avance de la derecha? Nos interesan las estrategias, las alianzas y los logros, y también las voces que casi nunca se escuchan.",
          pt: "Como os movimentos feministas se organizam em tempos de avanço da direita? Interessam-nos as estratégias, as alianças e as conquistas, e também as vozes que raramente são ouvidas.",
        },
      },
      {
        key: key(3),
        number: "504",
        month: "2027-04",
        deadline: "2027-03-05",
        title: {
          de: "Klang der Straße – Musik und Protest",
          es: "El sonido de la calle: música y protesta",
          pt: "O som da rua: música e protesto",
        },
        keywords: {
          de: "Cumbia, Hip-Hop, Protestlieder, Szenen",
          es: "cumbia, hip hop, canción de protesta, escenas",
          pt: "cumbia, hip hop, canção de protesto, cenas",
        },
        desc: {
          de: "Von der Nueva Canción bis zum Trap: Welche Rolle spielt Musik in heutigen Protesten? Wir suchen Texte über Szenen, Musiker*innen und Kollektive – gerne auch mit Fotos von Konzerten und Demos.",
          es: "De la Nueva Canción al trap: ¿qué papel juega la música en las protestas de hoy? Buscamos textos sobre escenas, músicas y músicos y colectivos, con fotos de conciertos y marchas si es posible.",
          pt: "Da Nueva Canción ao trap: que papel a música tem nos protestos de hoje? Buscamos textos sobre cenas, artistas e coletivos, de preferência com fotos de shows e manifestações.",
        },
      },
    ],
    participate: {
      de: "So macht ihr mit: Antwortet einfach auf diese E-Mail. Schreibt uns gerne, wenn ihr Ideen habt – zu den Schwerpunkten, aber auch für Hintergrundartikel – oder wenn ihr Fragen habt.\n\nIhr kennt Menschen, die für die ila schreiben, zeichnen oder fotografieren könnten? Leitet den InterLetter gerne weiter und bittet sie, sich bei uns zu melden. (Wer ihn weitergeleitet bekommt, steht damit nicht automatisch auf unserem Verteiler.)",
      es: "Cómo participar: basta con responder a este correo. Escríbannos si tienen ideas – sobre los temas centrales, pero también para artículos de contexto – o si tienen preguntas.\n\n¿Conocen a personas que podrían escribir, ilustrar o fotografiar para la ila? Reenvíenles el InterLetter y pídanles que se pongan en contacto con nosotros. (Quien lo recibe reenviado no queda automáticamente en nuestra lista.)",
      pt: "Como participar: basta responder a este e-mail. Escrevam para nós se tiverem ideias – sobre os temas centrais, mas também para artigos de contexto – ou se tiverem perguntas.\n\nConhecem pessoas que poderiam escrever, ilustrar ou fotografar para a ila? Encaminhem o InterLetter e peçam que entrem em contato conosco. (Quem o recebe encaminhado não entra automaticamente na nossa lista.)",
    },
    notes: {
      de: "Schaut bei Gelegenheit mal auf unsere Homepage ila-web.de – dort gibt es jetzt viele Artikel auch auf Spanisch.",
      es: "Cuando puedan, visiten nuestra web ila-web.de: ahora hay muchos artículos también en español.",
      pt: "Quando puderem, visitem nosso site ila-web.de: agora há muitos artigos também em espanhol.",
    },
    closing: {
      de: "Herzliche Grüße\neuer Redaktionsteam der ila",
      es: "Un saludo cordial\nel equipo de redacción de la ila",
      pt: "Um abraço\na equipe de redação da ila",
    },
  };
}
