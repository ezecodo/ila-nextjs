import { prisma } from "@/lib/prisma";
import { auth } from "../../auth"; // ✅ usa tu propia función

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let { articleId, action, carouselId } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Acción requerida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const log = await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action,
        articleId: articleId ? parseInt(articleId, 10) : undefined,
        carouselId: carouselId || undefined,
      },
    });

    return new Response(JSON.stringify(log), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error creando log:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        action: true,
        metadata: true, // ✅ NECESARIO para los logs eliminados
        user: { select: { name: true } },
        article: { select: { title: true } },
        carousel: {
          select: {
            id: true,
            titleES: true,
            titleDE: true,
            beitragstyp: {
              select: {
                name: true,
                nameES: true,
              },
            },
            region: {
              select: { name: true },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
