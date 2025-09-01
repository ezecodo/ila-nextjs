"use client";

import { useLocale } from "next-intl";

export default function SubscriptionPage() {
  const locale = useLocale();

  const contentDe = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Abonnement</h1>

      <p>
        Wir finden: Solidarischer Journalismus ist für alle da. Unser
        Solidarmodell funktioniert so:
      </p>

      <p>
        Alle Artikel sind nach einer Sperrzeit von wenigen Wochen frei für alle
        auf unserer Homepage zugänglich. Wir berichten häufig über
        Menschenrechtsverletzungen und Kämpfe von indigenen Bewegungen oder
        Gewerkschaften. Es ist wichtig, dass diese Informationen frei zugänglich
        sind.
      </p>

      <p>
        Doch frei heißt nicht umsonst. Wir versuchen, unsere Ausgaben so gering
        wie möglich zu halten. Aber auch wir müssen Miete zahlen, Computer
        instandhalten und Bürokräften ein würdiges Leben ermöglichen.
      </p>

      <p>
        Die beste Unterstützung, damit du und alle anderen auch in Zukunft den
        kritischen ila-Journalismus genießen könnt, ist ein ila-Abo – in fünf
        Varianten ganz auf deine Bedürfnisse zugeschnitten.
      </p>
    </div>
  );

  const contentEs = (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Suscripción</h1>

      <p>
        Creemos que el periodismo solidario debe estar al alcance de todas y
        todos. Nuestro modelo solidario funciona así:
      </p>

      <p>
        Todos los artículos están disponibles de manera gratuita en nuestra
        página web después de un breve período de embargo de algunas semanas.
        Con frecuencia informamos sobre violaciones de derechos humanos y las
        luchas de movimientos indígenas o sindicales. Es fundamental que esa
        información sea de acceso libre.
      </p>

      <p>
        Pero gratuito no significa sin costo. Tratamos de mantener nuestros
        gastos lo más bajos posible. Sin embargo, también tenemos que pagar
        alquiler, mantener los equipos y asegurar que el personal de oficina
        pueda llevar una vida digna.
      </p>

      <p>
        La mejor manera de apoyar para que tú y todas las demás personas puedan
        seguir disfrutando del periodismo crítico de la ila en el futuro es con
        una suscripción —disponible en cinco modalidades adaptadas a tus
        necesidades.
      </p>
    </div>
  );

  return <>{locale === "es" ? contentEs : contentDe}</>;
}
