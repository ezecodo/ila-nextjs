"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import IlaLoader from "../../components/IlaLoader/IlaLoader";

const MATOMO_BASE = "https://matomo.ila-web.de";
const SITE_ID = "1";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/analytics/token")
      .then((r) => r.json())
      .then((data) => {
        if (data.token) setToken(data.token);
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (loading || !token) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <IlaLoader />
      </div>
    );
  }

  const iframeSrc = `${MATOMO_BASE}/index.php?module=CoreHome&action=index&idSite=${SITE_ID}&period=${period}&date=today&token_auth=${token}`;

  return (
    <div className="flex flex-col h-full">
      {/* Barra de controles */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">Período:</span>
        {[
          { value: "day", label: "Hoy" },
          { value: "week", label: "Semana" },
          { value: "month", label: "Mes" },
          { value: "year", label: "Año" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              period === p.value
                ? "bg-[#BD0E0D] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        <a
          href={MATOMO_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-gray-400 hover:text-[#BD0E0D] transition-colors"
        >
          Abrir Matomo ↗
        </a>
      </div>

      {/* Iframe */}
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className="flex-1 w-full border-0"
        title="Matomo Analytics"
        allow="fullscreen"
      />
    </div>
  );
}
