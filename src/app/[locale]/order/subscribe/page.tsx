"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export default function SubscriptionPage() {
  const locale = useLocale();
  const [selected, setSelected] = useState("");
  const [donation, setDonation] = useState("");
  const [gift, setGift] = useState(false);

  const [form, setForm] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    institution: "",
    street: "",
    extra: "",
    zip: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
  });

  const [giftForm, setGiftForm] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    institution: "",
    street: "",
    extra: "",
    zip: "",
    city: "",
    country: "Deutschland",
  });

  const aboOptionsDe = [
    { id: "normal", label: "Normalabo – 59,- €/Jahr" },
    {
      id: "pdf",
      label:
        "Normalabo PDF – 52,- €/Jahr (wird ab 2026 zum praktischen Digital-Abo)",
    },
    { id: "foerder", label: "Förderabo – 59,- € + 10,- € Spende* / Jahr" },
    { id: "erm", label: "Ermäßigtes Abo – 52,- €/Jahr" },
    { id: "probe", label: "Probeabo (die nächsten 3 Ausgaben) – ab 9,50 €" },
  ];

  const aboOptionsEs = [
    { id: "normal", label: "Suscripción normal – 59 € / año" },
    {
      id: "pdf",
      label:
        "Suscripción PDF – 52 € / año (a partir de 2026 será la práctica suscripción digital)",
    },
    {
      id: "foerder",
      label: "Suscripción de apoyo – 59 € + 10 € de donación* / año",
    },
    { id: "erm", label: "Suscripción reducida – 52 € / año" },
    {
      id: "probe",
      label: "Suscripción de prueba (los próximos 3 números) – desde 9,50 €",
    },
  ];

  const options = locale === "es" ? aboOptionsEs : aboOptionsDe;

  return (
    <div className="prose prose-lg max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-red-700 mb-6">
        {locale === "es" ? "Suscripción" : "Abonnement"}
      </h1>

      {/* Intro */}
      <p>
        {locale === "es"
          ? "Creemos que el periodismo solidario debe estar al alcance de todas y todos. Nuestro modelo solidario funciona así:"
          : "Wir finden: Solidarischer Journalismus ist für alle da. Unser Solidarmodell funktioniert so:"}
      </p>
      <p>
        {locale === "es"
          ? "Todos los artículos están disponibles de manera gratuita en nuestra página web después de un breve período de embargo de algunas semanas. Con frecuencia informamos sobre violaciones de derechos humanos y las luchas de movimientos indígenas o sindicales. Es fundamental que esa información sea de acceso libre."
          : "Alle Artikel sind nach einer Sperrzeit von wenigen Wochen frei für alle auf unserer Homepage zugänglich. Wir berichten häufig über Menschenrechtsverletzungen und Kämpfe von indigenen Bewegungen oder Gewerkschaften. Es ist wichtig, dass diese Informationen frei zugänglich sind."}
      </p>
      <p>
        {locale === "es"
          ? "Pero gratuito no significa sin costo. La mejor manera de apoyar para que tú y todas las demás personas puedan seguir disfrutando del periodismo crítico de la ila en el futuro es con una suscripción —disponible en cinco modalidades adaptadas a tus necesidades. Con una suscripción ila recibes todos los contenidos inmediatamente al publicarse: ya sea en tu buzón o en formato digital."
          : "Doch frei heißt nicht umsonst. Die beste Unterstützung, damit du und alle anderen auch in Zukunft den kritischen ila-Journalismus genießen könnt, ist ein Abo – in fünf Varianten ganz auf deine Bedürfnisse zugeschnitten. Mit einem ila-Abo bekommst du alle Inhalte direkt nach Erscheinen: entweder in deinem Briefkasten oder digital."}
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">
        {locale === "es" ? "Tipos de suscripción" : "Abo-Typen"}
      </h2>

      <form className="space-y-6">
        {/* Opciones de suscripción */}
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-3">
            <input
              type="radio"
              name="abo"
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => setSelected(opt.id)}
              className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-600"
            />
            <span>{opt.label}</span>
          </label>
        ))}

        {/* Campo de donación extra */}
        {selected === "foerder" && (
          <div>
            <label className="block">
              {locale === "es"
                ? "Monto de la donación anual (mínimo 10 €):"
                : "Betrag der jährlichen Spende (mindestens 10 €):"}
            </label>
            <input
              type="number"
              min="10"
              step="1"
              value={donation}
              onChange={(e) => setDonation(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
        )}

        {/* Checkbox regalo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="giftAbo"
            checked={gift}
            onChange={(e) => {
              setGift(e.target.checked);
              console.log("Gift:", e.target.checked);
            }}
            className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-600"
          />
          <label htmlFor="giftAbo">
            {locale === "es" ? "Suscripción como regalo" : "Abo verschenken"}
          </label>
        </div>

        {/* Datos del suscriptor */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">
          {locale === "es" ? "Datos del suscriptor/a" : "Rechnungsnehmer*in"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Anrede */}
          <div className="sm:col-span-2">
            <label>{locale === "es" ? "Tratamiento" : "Anrede"}</label>
            <select
              value={form.salutation}
              onChange={(e) => setForm({ ...form, salutation: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            >
              <option value="">
                {locale === "es"
                  ? "No especificado"
                  : "Nicht festgelegt/ausgewählt"}
              </option>
              <option value="frau">
                {locale === "es" ? "Señora" : "Frau"}
              </option>
              <option value="herr">{locale === "es" ? "Señor" : "Herr"}</option>
              <option value="keine">
                {locale === "es" ? "Ninguno" : "Keine"}
              </option>
            </select>
          </div>
          <div>
            <label>{locale === "es" ? "Nombre *" : "Vorname *"}</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>{locale === "es" ? "Apellido *" : "Nachname *"}</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label>{locale === "es" ? "Institución" : "Institution"}</label>
            <input
              type="text"
              value={form.institution}
              onChange={(e) =>
                setForm({ ...form, institution: e.target.value })
              }
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>
              {locale === "es" ? "Calle y número *" : "Straße und Nr. *"}
            </label>
            <input
              type="text"
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>
              {locale === "es" ? "Complemento de dirección" : "Adresszusatz"}
            </label>
            <input
              type="text"
              value={form.extra}
              onChange={(e) => setForm({ ...form, extra: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>{locale === "es" ? "Código postal *" : "PLZ *"}</label>
            <input
              type="text"
              required
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>{locale === "es" ? "Ciudad *" : "Ort *"}</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>{locale === "es" ? "País *" : "Land *"}</label>
            <input
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>E-Mail *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label>
              {locale === "es" ? "Teléfono" : "Telefonnummer (freiwillig)"}
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
        </div>

        {/* Datos del destinatario del regalo */}
        {gift ? (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === "es"
                ? "Dirección de entrega (para regalo)"
                : "Abweichende Lieferadresse für Geschenkabo"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label>{locale === "es" ? "Tratamiento" : "Anrede"}</label>
                <select
                  value={giftForm.salutation}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, salutation: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">
                    {locale === "es" ? "No especificado" : "Nicht festgelegt"}
                  </option>
                  <option value="frau">Frau</option>
                  <option value="herr">Herr</option>
                </select>
              </div>
              <div>
                <label>{locale === "es" ? "Nombre *" : "Vorname *"}</label>
                <input
                  type="text"
                  required
                  value={giftForm.firstName}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, firstName: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>{locale === "es" ? "Apellido *" : "Nachname *"}</label>
                <input
                  type="text"
                  required
                  value={giftForm.lastName}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, lastName: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label>{locale === "es" ? "Institución" : "Institution"}</label>
                <input
                  type="text"
                  value={giftForm.institution}
                  onChange={(e) =>
                    setGiftForm({
                      ...giftForm,
                      institution: e.target.value,
                    })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>
                  {locale === "es" ? "Calle y número *" : "Straße und Nr. *"}
                </label>
                <input
                  type="text"
                  required
                  value={giftForm.street}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, street: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>
                  {locale === "es"
                    ? "Complemento de dirección"
                    : "Adresszusatz"}
                </label>
                <input
                  type="text"
                  value={giftForm.extra}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, extra: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>{locale === "es" ? "Código postal *" : "PLZ *"}</label>
                <input
                  type="text"
                  required
                  value={giftForm.zip}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, zip: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>{locale === "es" ? "Ciudad *" : "Ort *"}</label>
                <input
                  type="text"
                  required
                  value={giftForm.city}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, city: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label>{locale === "es" ? "País *" : "Land *"}</label>
                <input
                  type="text"
                  required
                  value={giftForm.country}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, country: e.target.value })
                  }
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Botón enviar */}
        <button
          type="submit"
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {locale === "es" ? "Suscribirme" : "Jetzt abonnieren"}
        </button>
      </form>
    </div>
  );
}
