"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AgbModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AgbModal({ open, onClose }: AgbModalProps) {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[1000] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition text-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          ✕
        </button>

        <div
          className="prose prose-lg max-w-3xl mx-auto py-10 px-6
                     text-gray-900 dark:text-gray-100
                     dark:prose-headings:text-gray-100
                     dark:prose-a:text-red-400 dark:prose-a:hover:text-red-500
                     dark:prose-li:marker:text-gray-400"
        >
          {locale === "es" ? <ContentES /> : <ContentDE />}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ContentDE() {
  return (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Allgemeine Geschäfts- und Lieferbedingungen
      </h1>
      <h2>der Informationsstelle Lateinamerika e.V.</h2>

      <ol className="list-decimal pl-6 space-y-2 mt-4">
        <li>
          <strong>Lieferbeginn.</strong> Wenn nicht anders vereinbart, ist
          Lieferbeginn immer die aktuelle Ausgabe, die bei Eingang der
          Bestellung erschienen ist.
        </li>
        <li>
          <strong>Rechnungsstellung.</strong> Die erste Ausgabe wird mit
          beiliegender Rechnung zugestellt. Die Rechnung beinhaltet die im
          laufenden Kalenderjahr noch zu berechnenden Ausgaben.
        </li>
        <li>
          <strong>Abonnementvertrag.</strong> Mit Bestätigung des Abonnements
          oder dessen Lieferung kommt der Abonnementvertrag zustande.
        </li>
        <li>
          <strong>Widerruf.</strong> Bestellungen können innerhalb einer Frist
          von zwei Wochen ohne Angabe von Gründen schriftlich widerrufen werden.
        </li>
        <li>
          <strong>Verlängerung und Kündigung.</strong> Das Abonnement gilt
          mindestens bis zum Ende des Kalenderjahres und verlängert sich
          automatisch, sofern es nicht schriftlich gekündigt wird.
        </li>
        <li>
          <strong>Abonnementgebühren.</strong> Die Gebühren sind im Voraus
          fällig. Erhöhungen gelten ab dem Zeitpunkt der Erhöhung.
        </li>
        <li>
          <strong>Probeabo.</strong> Enthält die nächsten drei Ausgaben nach
          Bestellung und wird regulär, falls nicht innerhalb von drei Wochen
          gekündigt.
        </li>
        <li>
          <strong>Zahlungen.</strong> Möglich per Überweisung, bar oder
          Lastschrift.
        </li>
        <li>
          <strong>Änderungen.</strong> Änderungen an Adresse, Bank oder
          Lieferung müssen mindestens 10 Tage vorher gemeldet werden.
        </li>
        <li>
          <strong>Zustellung.</strong> Die &quot;ila&quot; wird per Post
          geliefert. Zustellmängel sind unverzüglich zu melden.
        </li>
        <li>
          <strong>Lieferunterbrechungen.</strong> Nachsendungen im Inland sind
          kostenlos, im Ausland gegen Portoaufschlag.
        </li>
        <li>
          <strong>Datenschutz.</strong> Daten werden nach den geltenden
          Datenschutzbestimmungen behandelt.
        </li>
        <li>
          <strong>Sitz.</strong> Sitz der Informationsstelle Lateinamerika e.V.
          ist Bonn. Gerichtsstand für Kaufleute ist Bonn.
        </li>
      </ol>

      <p className="mt-6 font-semibold">Bonn, September 2012</p>
    </>
  );
}

function ContentES() {
  return (
    <>
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        Condiciones Generales de Contratación y Entrega
      </h1>
      <h2>de la Oficina de Información sobre América Latina (ILA) e.V.</h2>

      <ol className="list-decimal pl-6 space-y-2 mt-4">
        <li>
          <strong>Inicio de la entrega.</strong> Salvo acuerdo en contrario, el
          inicio de la entrega será siempre el número actual publicado en el
          momento de la recepción del pedido.
        </li>
        <li>
          <strong>Facturación.</strong> El primer número se entregará con la
          factura adjunta. La factura incluirá las ediciones que deban
          facturarse en el año en curso.
        </li>
        <li>
          <strong>Contrato de suscripción.</strong> Con la confirmación de la
          suscripción o su entrega, el contrato se convierte en vinculante.
        </li>
        <li>
          <strong>Derecho de desistimiento.</strong> Los pedidos pueden
          cancelarse por escrito en un plazo de dos semanas sin necesidad de
          indicar motivos.
        </li>
        <li>
          <strong>Prórroga y cancelación.</strong> La suscripción es válida al
          menos hasta fin de año natural y se renueva automáticamente salvo
          cancelación escrita.
        </li>
        <li>
          <strong>Cuotas de suscripción.</strong> Las cuotas son siempre
          pagaderas por adelantado.
        </li>
        <li>
          <strong>Suscripción de prueba.</strong> Incluye los tres siguientes
          números tras el pedido y se convierte en regular si no se cancela por
          escrito.
        </li>
        <li>
          <strong>Pagos.</strong> Pueden realizarse por transferencia, efectivo
          o domiciliación.
        </li>
        <li>
          <strong>Cambios.</strong> Los cambios de dirección, banco o método de
          entrega deben comunicarse con al menos 10 días de antelación.
        </li>
        <li>
          <strong>Entrega.</strong> La revista &quot;ila&quot; se entrega por
          correo. No se responde por entregas tardías al extranjero.
        </li>
        <li>
          <strong>Interrupciones de entrega.</strong> Reenvíos en Alemania son
          gratuitos; al extranjero con costes de envío.
        </li>
        <li>
          <strong>Protección de datos.</strong> Los datos se tratan conforme a
          la normativa vigente.
        </li>
        <li>
          <strong>Sede.</strong> La sede de la ILA es Bonn. El fuero competente
          para litigios comerciales es Bonn.
        </li>
      </ol>

      <p className="mt-6 font-semibold">Bonn, septiembre de 2012</p>
    </>
  );
}
