import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const editions = await prisma.edition.findMany({
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        titleES: true,
        coverImage: true,
        datePublished: true,
        summary: true, // 👈 Agregamos summary
        summaryES: true, // 👈 Agregamos summaryES
        articles: {
          select: {
            isTranslatedES: true,
            needsReviewES: true,
          },
        },
      },
    });

    const editionsWithCounts = editions.map((edition) => ({
      id: edition.id,
      number: edition.number,
      title: edition.title,
      titleES: edition.titleES,
      coverImage: edition.coverImage,
      datePublished: edition.datePublished,
      summary: edition.summary, // 👈
      summaryES: edition.summaryES, // 👈
      _count: {
        articles: edition.articles.length,
        translatedArticles: edition.articles.filter(
          (a) => a.isTranslatedES && !a.needsReviewES,
        ).length,
      },
    }));

    return new Response(JSON.stringify(editionsWithCounts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching archive editions:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching archive editions" }),
      { status: 500 },
    );
  }
}
