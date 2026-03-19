import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

const MATOMO_BASE = "https://matomo.ila-web.de";
const SITE_ID = "1";
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

async function matomoPost(method, params = {}) {
  const body = new URLSearchParams({
    module: "API",
    method,
    idSite: SITE_ID,
    format: "JSON",
    token_auth: process.env.MATOMO_TOKEN,
    ...params,
  });
  const res = await fetch(`${MATOMO_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Matomo ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mapPeriod = searchParams.get("mapPeriod") || "week";

    const cacheKey = `analytics-${mapPeriod}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Datos en paralelo
    const [
      today,
      yesterday,
      last7days,
      todayByHour,
      yesterdayByHour,
      topPages,
      allPagesFlat,
      devices,
      countries,
    ] = await Promise.all([
      matomoPost("VisitsSummary.get", { period: "day", date: "today" }),
      matomoPost("VisitsSummary.get", { period: "day", date: "yesterday" }),
      matomoPost("VisitsSummary.get", { period: "day", date: "last7" }),
      matomoPost("VisitTime.getVisitInformationPerLocalTime", { period: "day", date: "today" }),
      matomoPost("VisitTime.getVisitInformationPerLocalTime", { period: "day", date: "yesterday" }),
      matomoPost("Actions.getPageUrls", { period: "week", date: "today", filter_limit: "10" }),
      matomoPost("Actions.getPageUrls", { period: "week", date: "today", filter_limit: "100", flat: "1" }),
      matomoPost("DevicesDetection.getType", { period: "week", date: "today" }),

      matomoPost("UserCountry.getCountry", { period: mapPeriod, date: "today", filter_limit: "100" }),
    ]);

    // Construir serie horaria (0-23h) — raw es array con label "00"-"23"
    const buildHourly = (raw) => {
      const byHour = {};
      if (Array.isArray(raw)) {
        raw.forEach((d) => { byHour[d.label] = d; });
      }
      return Array.from({ length: 24 }, (_, h) => {
        const key = String(h).padStart(2, "0");
        return {
          hour: `${key}:00`,
          visits: byHour[key]?.nb_visits ?? 0,
          visitors: byHour[key]?.nb_uniq_visitors ?? 0,
        };
      });
    };

    // Construir serie últimos 7 días
    const buildWeekly = (raw) => {
      if (!raw || typeof raw !== "object") return [];
      return Object.entries(raw).map(([date, d]) => ({
        date,
        visits: d?.nb_visits ?? 0,
        visitors: d?.nb_uniq_visitors ?? 0,
      }));
    };

    // Filtrar artículos de la lista plana de páginas
    const articleKeywords = ["/ausgaben/", "/online/", "/es/ausgaben/", "/es/online/"];
    const topArticles = Array.isArray(allPagesFlat)
      ? allPagesFlat
          .filter((p) => articleKeywords.some((kw) => (p.label || "").includes(kw)))
          .sort((a, b) => (b.nb_visits || 0) - (a.nb_visits || 0))
          .slice(0, 15)
      : [];

    const data = {
      today,
      yesterday,
      todayHourly: buildHourly(todayByHour),
      yesterdayHourly: buildHourly(yesterdayByHour),
      weekly: buildWeekly(last7days),
      topPages: Array.isArray(topPages) ? topPages : [],
      topArticles,
      devices: Array.isArray(devices) ? devices : [],
      countries: Array.isArray(countries) ? countries : [],
    };

    cache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Matomo API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
