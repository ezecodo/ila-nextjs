"use client";

export default function GiftSelector({ gifts, onSelect }) {
  if (!gifts || gifts.length === 0)
    return (
      <p className="text-gray-500 text-sm mt-2">
        Keine Prämien verfügbar / No hay premios disponibles.
      </p>
    );

  return (
    <div className="mt-4">
      <label className="block font-semibold mb-2">🎁 Prämie auswählen</label>
      <select
        className="border p-2 rounded w-full"
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Kein Geschenk / Ninguno --</option>
        {gifts.map((gift) => (
          <option key={gift.id} value={gift.id}>
            {gift.name}
          </option>
        ))}
      </select>
    </div>
  );
}
