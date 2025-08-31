export default function NetworkPage() {
  const partners = [
    {
      name: "ACS Copy Service",
      desc: "Solidarischer Copy Shop in Bonn",
      url: "https://acs-bonn.de",
    },
    {
      name: "Allerweltshaus Köln",
      desc: "Interkulturelles Zentrum",
      url: "https://www.allerweltshaus.de",
    },
    {
      name: "Amerika 21",
      desc: "Nachrichten und Analysen aus Lateinamerika",
      url: "https://amerika21.de",
    },
    {
      name: "Buchladen Le Sabot",
      desc: "Buchladen für Internationale Literatur, Politik & Geschichte",
      url: "https://www.lesabot.de",
    },
    {
      name: "BUKO",
      desc: "Bundeskoordination Internationalismus",
      url: "https://www.buko.info",
    },
    {
      name: "CiR",
      desc: "Christliche Initiative Romero – Stimme für Gerechtigkeit",
      url: "https://www.ci-romero.de",
    },
    {
      name: "COLPAZ",
      desc: "Frieden für Kolumbien",
      url: "https://www.wissenskulturen.de/wp_wissenskulturen/index.php/colpaz/",
    },
    {
      name: "DJG",
      desc: "Deutsch Jamaikanische Gesellschaft",
      url: "https://www.deutsch-jamaikanische-gesellschaft.de",
    },
    {
      name: "FDCL",
      desc: "Forschungs- und Dokumentationszentrum Chile-Lateinamerika",
      url: "http://www.fdcl.org",
    },
    {
      name: "FIAN",
      desc: "Food First Information and Action Network – Mit Menschenrechten gegen den Hunger",
      url: "https://www.fian.de",
    },
    {
      name: "Honduras Delegation",
      url: "https://hondurasdelegation.blogspot.com",
    },
    { name: "Infobüro Nicaragua", url: "https://infobuero-nicaragua.org" },
    { name: "Infostelle Peru", url: "https://www.infostelle-peru.de" },
    { name: "Initiative Recht auf Asyl", url: "https://derechoalasilo.de" },
    {
      name: "ITP",
      desc: "Institut für Theologie und Politik",
      url: "https://www.itpol.de",
    },
    {
      name: "iz3W",
      desc: "Informationszentrum 3. Welt",
      url: "https://www.iz3w.org",
    },
    {
      name: "KoBra",
      desc: "Kooperation Brasilien",
      url: "https://www.kooperation-brasilien.org/de",
    },
    {
      name: "Kolko",
      desc: "Kolumbienkoordination",
      url: "https://www.kolko.net",
    },
    {
      name: "La Librería Bonn",
      desc: "Iberoamerikanische Buchhandlung",
      url: "https://www.lalibreria.de",
    },
    {
      name: "LabourNet Germany",
      desc: "Treffpunkt für Ungehorsame, mit und ohne Job, gesellschaftskritisch",
      url: "https://www.labournet.de",
    },
    {
      name: "Lateinamerika anders",
      desc: "Österreichs Zeitschrift für Lateinamerika und die Karibik",
      url: "https://lateinamerika-anders.org",
    },
    {
      name: "Lateinamerika-Archiv",
      desc: "Archiv für übersetzte Literatur aus Lateinamerika und der Karibik",
      url: "https://www.lateinamerikaarchiv.de",
    },
    {
      name: "Lateinamerika Nachrichten",
      desc: "Solidarische, kritische und unabhängige Berichterstattung über Lateinamerika",
      url: "https://lateinamerika-nachrichten.de",
    },
    {
      name: "MAIZ",
      desc: "Gesunde Nahrung geht uns alle an",
      url: "https://www.treemedia.org/maiz",
    },
    {
      name: "MediNetz Bonn e.V.",
      desc: "Medizinische Versorgung für Menschen ohne Papiere",
      url: "https://medinetzbonn.de",
    },
    {
      name: "Menschenrechtskoordination Mexiko",
      url: "https://www.mexiko-koordination.de",
    },
    {
      name: "NPLA",
      desc: "Nachrichtenpool Lateinamerika",
      url: "https://www.npla.de",
    },
    { name: "Radio Matraca", url: "https://www.npla.de/matraca" },
    { name: "Radio Onda", url: "https://www.npla.de/onda" },
    { name: "Ojalá", desc: "Revista en la diáspora", url: "https://ojal.de" },
    {
      name: "Ökubüro",
      desc: "Ökumenisches Büro für Frieden und Gerechtigkeit",
      url: "https://www.oeku-buero.de",
    },
    {
      name: "Quetzal",
      desc: "Politik und Kultur in Lateinamerika",
      url: "https://quetzal-leipzig.de",
    },
    { name: "Runder Tisch Zentralamerika", url: "https://www.rt-za.de" },
    {
      name: "Socare",
      desc: "Gesellschaft für Karibikforschung",
      url: "http://caribbeanresearch.net/de/ueber-socare-3/",
    },
    {
      name: "Venezuela im Film – Qué chévere",
      desc: "Filmfestival in Frankfurt a.M.",
      url: "https://venezuela-im-film.de",
    },
    {
      name: "Ya Basta Netz",
      desc: "Netzwerk für Solidarität und Rebellion",
      url: "https://www.ya-basta-netz.org",
    },
  ];

  return (
    <div className="prose prose-lg max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-8">Netzwerk</h1>

      <ul className="space-y-4">
        {partners.map((p) => (
          <li key={p.name}>
            <p className="font-semibold">{p.name}</p>
            {p.desc && <p className="text-gray-700">{p.desc}</p>}
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              {p.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
