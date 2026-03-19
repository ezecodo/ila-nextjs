import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

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
    const period = searchParams.get("period") || "week";
    const date = searchParams.get("date") || "today";

    const cacheKey = `articles-${period}-${date}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const allPages = await matomoPost("Actions.getPageUrls", {
      period,
      date,
      filter_limit: "100",
      flat: "1",
    });

    const articleKeywords = ["/ausgaben/", "/online/", "/es/ausgaben/", "/es/online/"];
    const articles = Array.isArray(allPages)
      ? allPages
          .filter((p) => !(p.label || "").includes("Others") && articleKeywords.some((kw) => (p.label || "").includes(kw)))
          .sort((a, b) => (b.nb_visits || 0) - (a.nb_visits || 0))
          .slice(0, 15)
      : [];

    // Matomo labels have locale prefix (/de/ausgaben/...) — DB stores without it (/ausgaben/...)
    // Also, Matomo returns decoded unicode chars but DB stores URL-encoded (e.g. ü → %C3%BC)
    const stripLocale = (label) => {
      const stripped = (label || "").replace(/^\/(de|es)/, "");
      // Encode non-ASCII chars per segment, preserving slashes
      return stripped.split("/").map((seg) =>
        seg.replace(/[^\x00-\x7F]/g, (c) => encodeURIComponent(c))
      ).join("/");
    };
    const paths = articles.map((a) => stripLocale(a.label)).filter(Boolean);
    const dbArticles = await prisma.article.findMany({
      where: { legacyPath: { in: paths } },
      select: {
        legacyPath: true,
        title: true,
        isInPrintEdition: true,
        edition: { select: { number: true, title: true } },
        authors: { select: { name: true } },
      },
    });
    const byPath = {};
    dbArticles.forEach((a) => { byPath[a.legacyPath] = a; });

    const enriched = articles.map((a) => {
      const db = byPath[stripLocale(a.label)];
      return {
        ...a,
        title: db?.title || null,
        authors: db?.authors?.map((au) => au.name) || [],
        edition: db?.edition || null,
        isInPrintEdition: db?.isInPrintEdition ?? null,
      };
    });

    const data = { articles: enriched };
    cache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Matomo articles error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
