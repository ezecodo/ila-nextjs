// app/[locale]/about/agb/page.tsx
"use client";

import { useLocale } from "next-intl";

export default function AgbPage() {
  const locale = useLocale();
  // 🎯 Versión en Español
  const contentEs = (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Condiciones Generales de Contratación y Entrega
      </h1>
      <h2>de la Oficina de Información sobre América Latina (ILA) e.V.</h2>

      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <strong>Inicio de la entrega.</strong> Salvo acuerdo en contrario, el
          inicio de la entrega será siempre el número actual publicado en el
          momento de la recepción del pedido.
        </li>
        <li>
          <strong>Facturación.</strong> El primer número se entregará con la
          factura adjunta. La factura incluirá las ediciones que deban
          facturarse en el año en curso. Al comienzo del año siguiente se
          reanuda la facturación anual. Los abonos de prueba se facturan
          independientemente del año natural.
        </li>
        <li>
          <strong>Contrato de suscripción.</strong> Con la confirmación de la
          suscripción o su entrega, el contrato de suscripción se convierte en
          vinculante para ambas partes.
        </li>
        <li>
          <strong>Derecho de desistimiento.</strong> Los pedidos pueden
          cancelarse por escrito (carta, fax o correo electrónico) en un plazo
          de dos semanas sin necesidad de indicar motivos.
        </li>
        <li>
          <strong>Prórroga y cancelación.</strong> La suscripción es válida al
          menos hasta fin de año natural. Después se renueva automáticamente por
          un año más, salvo cancelación escrita a fin de año.
        </li>
        <li>
          <strong>Cuotas de suscripción.</strong> Las cuotas son siempre
          pagaderas por adelantado. Si durante la vigencia del contrato se
          produce un aumento del precio de suscripción, deberá abonarse el
          precio vigente desde el momento del aumento. El precio ya pagado por
          adelantado está garantizado para el periodo de prepago y no puede
          aumentarse. Los aumentos de precio se anunciarán en la revista antes
          de su entrada en vigor.
        </li>
        <li>
          <strong>Suscripción de prueba.</strong> La suscripción de prueba
          incluye los tres siguientes números tras el pedido. Se convierte en
          suscripción regular si en un plazo de tres semanas tras recibir el
          último número no se recibe una cancelación escrita.
        </li>
        <li>
          <strong>Pagos.</strong> Los pagos pueden realizarse por transferencia
          bancaria, en efectivo o mediante domiciliación.
        </li>
        <li>
          <strong>Cambios.</strong> Los cambios en la suscripción, método de
          pago, banco o dirección de entrega solo podrán garantizarse si se
          comunican al menos 10 días antes. En caso de mudanza es obligatorio
          comunicar la nueva dirección.
        </li>
        <li>
          <strong>Entrega.</strong> La entrega de la revista “ila” se realiza
          por correo. Los defectos en la entrega deben notificarse de inmediato.
          La ILA solo se hace responsable por dolo o negligencia grave. No se
          hace responsable de entregas tardías al extranjero.
        </li>
        <li>
          <strong>Interrupciones de entrega.</strong> Son posibles. Los reenvíos
          dentro de Alemania no tienen coste adicional; al extranjero se
          aplicarán los costes de envío correspondientes.
        </li>
        <li>
          <strong>Protección de datos.</strong> Los datos de los abonados se
          tratan conforme a la normativa de protección de datos vigente.
        </li>
        <li>
          <strong>Sede.</strong> La sede de la ILA es Bonn. En caso de litigio
          con comerciantes, personas jurídicas de derecho público o patrimonios
          de derecho público, el fuero competente es Bonn. Para el resto de
          casos, el fuero será el domicilio del suscriptor.
        </li>
      </ol>

      <p className="mt-6 font-semibold">Bonn, septiembre de 2012</p>

      <h1 className="text-3xl font-bold text-red-700 mt-12 mb-6">
        Condiciones de uso del servicio online
      </h1>

      <h2>1. Contenido de la oferta online</h2>
      <p>
        La ILA no asume ninguna garantía sobre la actualidad, corrección,
        integridad o calidad de la información proporcionada. Se excluye toda
        responsabilidad por daños materiales o morales derivados del uso o no
        uso de la información ofrecida, salvo en casos de dolo o negligencia
        grave.
      </p>

      <h2>2. Referencias y enlaces</h2>
      <p>
        En caso de enlaces directos o indirectos a páginas externas, la ILA solo
        será responsable si tiene conocimiento de contenidos ilegales y le fuera
        técnicamente posible impedir su uso. En el momento de crear los enlaces
        no había indicios de contenido ilegal. La ILA no tiene influencia en el
        diseño actual o futuro de las páginas enlazadas y, por ello, se
        distancia expresamente de todos sus contenidos modificados después de la
        creación del enlace.
      </p>

      <h2>3. Derechos de autor y marcas</h2>
      <p>
        La ILA procura respetar siempre los derechos de autor de gráficos,
        audios, vídeos y textos, utilizar material propio o recurrir a material
        libre de licencia. Todas las marcas mencionadas en la web están
        protegidas por los derechos de sus respectivos propietarios. El
        copyright de los contenidos creados por la ILA pertenece a la propia
        ILA. No está permitida su reproducción sin autorización expresa.
      </p>

      <h2>4. Protección de datos</h2>
      <p>
        La introducción de datos personales (emails, nombres, direcciones) es
        voluntaria. El uso de los servicios es posible, en la medida de lo
        técnicamente viable, también sin estos datos o con datos
        anónimos/pseudónimos. El uso de los datos de contacto publicados en el
        marco del aviso legal por terceros para enviar información no solicitada
        está prohibido.
      </p>

      <h2>5. Validez jurídica</h2>
      <p>
        Este descargo de responsabilidad forma parte de la oferta online. Si
        partes del texto no cumplen la normativa vigente, las demás cláusulas
        seguirán siendo válidas.
      </p>

      <p className="mt-6 font-semibold">
        Bonn, septiembre de 2012 <br />
        Informationsstelle Lateinamerika e.V., Heerstr. 205, 53111 Bonn <br />
        Tel.: 0228/65 86 13 <br />
        E-Mail:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
        </a>
      </p>
    </>
  );

  // 🎯 Versión en Alemán
  const contentDe = (
    <>
      {/* 🎯 German Text */}
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Allgemeine Geschäfts- und Lieferbedingungen
      </h1>
      <h2>der Informationsstelle Lateinamerika e.V.</h2>

      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <strong>Lieferbeginn.</strong> Wenn nicht anders vereinbart, ist
          Lieferbeginn immer die aktuelle Ausgabe, die bei Eingang der
          Bestellung erschienen ist.
        </li>
        <li>
          <strong>Rechnungsstellung.</strong> Die erste Ausgabe wird mit
          beiliegender Rechnung zugestellt. Die Rechnung beinhaltet die im
          laufenden Kalenderjahr noch zu berechnenden Ausgaben. Zu Beginn des
          folgenden Kalenderjahres setzt die jährliche Rechnungsstellung ein.
          Probeabonnements werden unabhängig vom Kalenderjahr in Rechnung
          gestellt.
        </li>
        <li>
          <strong>Abonnementvertrag.</strong> Mit Bestätigung des Abonnements
          oder dessen Lieferung kommt der Abonnementvertrag zustande und werden
          Lieferung, Abnahme und Bezahlung für beide Vertragspartner
          rechtsverbindlich.
        </li>
        <li>
          <strong>Widerruf.</strong> Bestellungen können innerhalb einer Frist
          von zwei Wochen ohne Angabe von Gründen schriftlich per Brief, Fax
          oder E-Mail widerrufen werden. Zur Wahrnehmung der Widerrufsfrist
          genügt die rechtzeitige Absendung des Widerrufs.
        </li>
        <li>
          <strong>Verlängerung und Kündigung.</strong> Die Bestellung eines
          Abonnements gilt mindestens bis zum Ende des Kalenderjahres. Danach
          verlängert sich das Abonnement automatisch für jeweils ein
          Kalenderjahr. Das Abonnement kann jeweils zum Jahresende gekündigt
          werden. Die Kündigung ist schriftlich per Brief, Fax oder E-Mail an
          die Informationsstelle Lateinamerika e.V. zu richten.
        </li>
        <li>
          <strong>Abonnementgebühren.</strong> Die Abonnementgebühren sind
          generell im Voraus fällig. Sollte während der Vertragszeit eine
          Erhöhung des Bezugspreises eintreten, so ist der vom Zeitpunkt der
          Erhöhung an gültige Bezugspreis zu entrichten. Der vorausbezahlte
          Abopreis ist für den Zeitraum der Vorauszahlung (Kalenderjahr)
          garantiert und kann nicht erhöht werden. Bezugspreiserhöhungen werden
          vor ihrer Wirksamkeit in der Zeitschrift angekündigt.
          Einzelbenachrichtigungen sind nicht möglich.
        </li>
        <li>
          <strong>Probeabo.</strong> Das Probeabo enthält die nächsten drei
          Ausgaben nach Bestellung. Das Probeabo wandelt sich in ein reguläres
          Abo um, wenn bis drei Wochen nach Erhalt des letzten Heftes keine
          schriftliche Kündigung eingegangen ist. Die Kündigung ist schriftlich
          per Brief, Fax oder E-Mail an die Informationsstelle Lateinamerika
          e.V. zu richten.
        </li>
        <li>
          <strong>Zahlungen.</strong> Zahlungen sind möglich per Überweisung,
          bar oder per Lastschriftverfahren.
        </li>
        <li>
          <strong>Änderungen.</strong> Die termingerechte Bearbeitung von
          Abonnement-, Zahlart-, Banken-, Lieferänderungen usw. ist nur dann
          gewährleistet, wenn die Mitteilung mindestens 10 Tage vorher bei der
          Informationsstelle Lateinamerika e.V. eingegangen ist. Bei Umzügen ist
          der Informationsstelle Lateinamerika e.V. unbedingt die neue Anschrift
          mitzuteilen.
        </li>
        <li>
          <strong>Zustellung.</strong> Die Zustellung der &quot;ila&quot;
          erfolgt mit der Post. Zustellmängel sind unverzüglich anzuzeigen. Für
          Nichtlieferungen, verspätete Lieferungen oder Sachschäden im Zuge der
          Auslieferung haftet die Informationsstelle Lateinamerika e.V. nur für
          Vorsatz oder grobe Fahrlässigkeit ihrerseits. Für im Ausland verspätet
          eintreffende Lieferungen ist die Informationsstelle Lateinamerika e.V.
          nicht verantwortlich.
        </li>
        <li>
          <strong>Lieferunterbrechungen.</strong> Lieferunterbrechungen des
          Abonnements sind möglich. Nachsendungen im Inland erfolgen ohne
          zusätzliche Kosten, ins Ausland gegen Erstattung einer Nachsendegebühr
          (Portokosten nach Anfrage).
        </li>
        <li>
          <strong>Datenschutz.</strong> Die für die Abonnementführung
          gespeicherten Daten werden nach den geltenden datenschutzrechtlichen
          Bestimmungen behandelt.
        </li>
        <li>
          <strong>Sitz.</strong> Sitz der Informationsstelle Lateinamerika e.V.
          ist Bonn. Im Geschäftsverkehr mit Kaufleuten, juristischen Personen
          des öffentlichen Rechts oder bei öffentlich-rechtlichen Sondervermögen
          ist bei Klagen Gerichtsstand der Sitz der Informationsstelle
          Lateinamerika e.V. Soweit Ansprüche der Informationsstelle
          Lateinamerika e.V. nicht im Mahnverfahren geltend gemacht werden,
          bestimmt sich der Gerichtsstand bei Nichtkaufleuten nach deren
          Wohnsitz.
        </li>
      </ol>

      <p className="mt-6 font-semibold">Bonn, September 2012</p>

      <h1 className="text-3xl font-bold text-red-700 mt-12 mb-6">
        Geschäftsbedingungen für die Nutzung des Online-Angebots
      </h1>

      <h2>1. Inhalt des Online-Angebots</h2>
      <p>
        Die Informationsstelle Lateinamerika e.V. übernimmt keinerlei Gewähr für
        die Aktualität, Korrektheit, Vollständigkeit oder Qualität der
        bereitgestellten Informationen. Haftungsansprüche gegen die
        Informationsstelle Lateinamerika e.V., die sich auf Schäden materieller
        oder ideeller Art beziehen, die durch die Nutzung oder Nichtnutzung der
        dargebotenen Informationen verursacht wurden, sind grundsätzlich
        ausgeschlossen, sofern seitens der Informationsstelle Lateinamerika e.V.
        kein nachweislich vorsätzliches oder grob fahrlässiges Verschulden
        vorliegt. Alle im Rahmen des Online-Auftritts offerierten Angebote sind
        freibleibend und unverbindlich. Die Informationsstelle Lateinamerika
        e.V. behält es sich ausdrücklich vor, Teile der Seiten oder das gesamte
        Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu
        löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.
      </p>

      <h2>2. Verweise und Links</h2>
      <p>
        Bei direkten oder indirekten Verweisen auf fremde Webseiten
        (&quot;Hyperlinks&quot;), die außerhalb des Verantwortungsbereiches der
        Informationsstelle Lateinamerika e.V. liegen, würde eine
        Haftungsverpflichtung ausschließlich in dem Fall in Kraft treten, in dem
        die Informationsstelle Lateinamerika e.V. von den Inhalten Kenntnis hat
        und es ihr technisch möglich und zumutbar wäre, die Nutzung im Falle
        rechtswidriger Inhalte zu verhindern. Die Informationsstelle
        Lateinamerika e.V. erklärt hiermit ausdrücklich, dass zum Zeitpunkt der
        Linksetzung keine illegalen Inhalte auf den zu verlinkenden Seiten
        erkennbar waren. Auf die aktuelle und zukünftige Gestaltung, die Inhalte
        oder die Urheberschaft der verlinkten/verknüpften Seiten hat die
        Informationsstelle Lateinamerika e.V. keinerlei Einfluss. Deshalb
        distanziert sie sich hiermit ausdrücklich von allen Inhalten aller
        verlinkten/verknüpften Seiten, die nach der Linksetzung verändert
        wurden. Diese Feststellung gilt für alle innerhalb des eigenen
        Internetangebotes gesetzten Links und Verweise sowie für Fremdeinträge
        in von der Informationsstelle Lateinamerika e.V. eingerichteten
        Gästebüchern, Diskussionsforen, Linkverzeichnissen, Mailinglisten und in
        allen anderen Formen von Datenbanken, auf deren Inhalt externe
        Schreibzugriffe möglich sind. Für illegale, fehlerhafte oder
        unvollständige Inhalte und insbesondere für Schäden, die aus der Nutzung
        oder Nichtnutzung solcherart dargebotener Informationen entstehen,
        haftet allein der Anbieter der Seite, auf die verwiesen wurde, nicht
        derjenige, der über Links auf die jeweilige Veröffentlichung lediglich
        verweist.
      </p>

      <h2>3. Urheber- und Kennzeichenrecht</h2>
      <p>
        Die Informationsstelle Lateinamerika e.V. ist bestrebt, in allen
        Publikationen die Urheberrechte der verwendeten Grafiken, Tondokumente,
        Videosequenzen und Texte zu beachten, von ihr selbst erstellte Grafiken,
        Tondokumente, Videosequenzen und Texte zu nutzen oder auf lizenzfreie
        Grafiken, Tondokumente, Videosequenzen und Texte zurückzugreifen. Alle
        innerhalb des Internetangebotes genannten und ggf. durch Dritte
        geschützten Marken- und Warenzeichen unterliegen uneingeschränkt den
        Bestimmungen des jeweils gültigen Kennzeichenrechts und den
        Besitzrechten der jeweiligen eingetragenen Eigentümer. Allein aufgrund
        der bloßen Nennung ist nicht der Schluss zu ziehen, dass Markenzeichen
        nicht durch Rechte Dritter geschützt sind! Das Copyright für
        veröffentlichte, von der Informationsstelle Lateinamerika e.V. selbst
        erstellte Objekte bleibt allein bei der Informationsstelle Lateinamerika
        e.V. Eine Vervielfältigung oder Verwendung solcher Grafiken,
        Tondokumente, Videosequenzen und Texte in anderen elektronischen oder
        gedruckten Publikationen ist ohne ausdrückliche Zustimmung der
        Informationsstelle Lateinamerika e.V. nicht gestattet.
      </p>

      <h2>4. Datenschutz</h2>
      <p>
        Sofern innerhalb des Internetangebotes die Möglichkeit zur Eingabe
        persönlicher oder geschäftlicher Daten (E-Mail-Adressen, Namen,
        Anschriften) besteht, so erfolgt die Preisgabe dieser Daten seitens des
        Nutzers auf ausdrücklich freiwilliger Basis. Die Inanspruchnahme und
        Bezahlung aller angebotenen Dienste ist – soweit technisch möglich und
        zumutbar – auch ohne Angabe solcher Daten bzw. Angabe anonymisierter
        Daten oder eines Pseudonyms gestattet. Die Nutzung der im Rahmen des
        Impressums oder vergleichbarer Angaben veröffentlichten Kontaktdaten wie
        Postanschriften, Telefon- und Faxnummern sowie E-Mailadressen durch
        Dritte zur Übersendung von nicht ausdrücklich angeforderten
        Informationen ist nicht gestattet. Rechtliche Schritte gegen die
        Versender von sogenannten Spam-Mails bei Verstößen gegen dieses Verbot
        sind ausdrücklich vorbehalten. Siehe auch: Hinweise zum Datenschutz nach
        Art. 13 DSGVO
      </p>

      <h2>5. Rechtswirksamkeit</h2>
      <p>
        Dieser Haftungsausschluss ist als Teil des Internetangebotes zu
        betrachten, von dem aus auf diese Seite verwiesen wurde. Sofern Teile
        oder einzelne Formulierungen dieses Textes der geltenden Rechtslage
        nicht, nicht mehr oder nicht vollständig entsprechen sollten, bleiben
        die übrigen Teile des Dokumentes in ihrem Inhalt und ihrer Gültigkeit
        davon unberührt.
      </p>

      <p className="mt-6 font-semibold">
        Bonn, September 2012 <br />
        Informationsstelle Lateinamerika e.V., Heerstr. 205, 53111 Bonn <br />
        Telefon: 0228/65 86 13 <br />
        E-Mail:{" "}
        <a href="mailto:ila-bonn@t-online.de" className="text-red-600">
          ila-bonn@t-online.de
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
