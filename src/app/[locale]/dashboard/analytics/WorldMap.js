"use client";

import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Tooltip } from "react-tooltip";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MAP_PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

// Matomo devuelve nombres de país — necesitamos mapear a código ISO numérico
// react-simple-maps usa ISO numérico (de world-atlas)
// Usamos el código de 2 letras que Matomo devuelve en `code`
const iso2ToIso3Num = {
  DE: "276", AT: "040", CH: "756", AR: "032", MX: "484", ES: "724",
  US: "840", GB: "826", FR: "250", IT: "380", BR: "076", CO: "170",
  CL: "152", PE: "604", BO: "068", VE: "862", UY: "858", PY: "600",
  EC: "218", CR: "188", GT: "320", HN: "340", SV: "222", NI: "558",
  PA: "591", CU: "192", DO: "214", PR: "630", NL: "528", BE: "056",
  PT: "620", SE: "752", NO: "578", DK: "208", FI: "246", PL: "616",
  CZ: "203", SK: "703", HU: "348", RO: "642", GR: "300", TR: "792",
  RU: "643", UA: "804", CA: "124", AU: "036", NZ: "554", JP: "392",
  CN: "156", IN: "356", ZA: "710", NG: "566", EG: "818", MA: "504",
  KE: "404", ET: "231", GH: "288", TZ: "834", IL: "376", SA: "682",
  AE: "784", IR: "364", IQ: "368", PK: "586", AF: "004", KR: "410",
  ID: "360", TH: "764", VN: "704", MY: "458", PH: "608", SG: "702",
};

function getColor(visits, max) {
  if (!visits || visits === 0) return "#e5e7eb";
  const intensity = Math.min(visits / max, 1);
  // Rojo ILA con transparencia según intensidad
  const r = 189;
  const g = Math.round(14 + (1 - intensity) * 100);
  const b = Math.round(13 + (1 - intensity) * 80);
  const alpha = 0.2 + intensity * 0.8;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function WorldMap({ countries: initialCountries = [] }) {
  const [mapPeriod, setMapPeriod] = useState("week");
  const [countries, setCountries] = useState(initialCountries);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/stats?mapPeriod=${mapPeriod}`)
      .then((r) => r.json())
      .then((d) => { if (d.countries) setCountries(d.countries); })
      .finally(() => setLoading(false));
  }, [mapPeriod]);
  // Construir mapa código numérico → visitas
  const visitsByCode = {};
  const visitsByName = {};
  let maxVisits = 1;

  countries.forEach((c) => {
    const code = c.code?.toUpperCase();
    const num = iso2ToIso3Num[code];
    const visits = c.nb_visits || 0;
    if (num) visitsByCode[num] = visits;
    visitsByName[c.label] = visits;
    if (visits > maxVisits) maxVisits = visits;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700">Visitas por país</h2>
        <div className="flex gap-1.5">
          {MAP_PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setMapPeriod(p.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                mapPeriod === p.value
                  ? "bg-[#BD0E0D] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {loading ? "Cargando..." : "Pasa el cursor sobre un país para ver detalles"}
      </p>

      <div className="w-full overflow-hidden rounded-lg bg-gray-50" style={{ height: 460 }}>
        <ComposableMap
          projectionConfig={{ scale: 185, center: [10, 10] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numId = geo.id;
                const visits = visitsByCode[numId] || 0;
                const color = getColor(visits, maxVisits);
                const name = geo.properties?.name || "";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={0.4}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={visits > 0 ? `${name}: ${visits} visitas` : name}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#BD0E0D", outline: "none", cursor: "default" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <Tooltip id="map-tooltip" style={{ fontSize: 12, padding: "4px 8px" }} />

      {/* Leyenda */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-gray-400">Menos</span>
        {[0.1, 0.3, 0.5, 0.7, 1].map((v) => (
          <div
            key={v}
            className="w-5 h-3 rounded-sm"
            style={{ background: getColor(v * maxVisits, maxVisits) }}
          />
        ))}
        <span className="text-xs text-gray-400">Más</span>
      </div>
    </div>
  );
}
