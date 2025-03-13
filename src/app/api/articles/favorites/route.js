import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth"; // Asegurar importación correcta

const prisma = new PrismaClient();

export async function GET(req) {
  console.log("➡️ Iniciando GET /api/articles/favorites");
  try {
    const { searchParams } = new URL(req.url);
    const articleId = parseInt(searchParams.get("articleId"));
    const checkUser = searchParams.get("checkUser") === "true";

    if (!articleId) {
      console.error("❌ ERROR: Falta `articleId` en la solicitud GET.");
      return new Response(JSON.stringify({ error: "articleId requerido" }), {
        status: 400,
      });
    }

    let isFavorited = false;
    let userId = null;
    if (checkUser) {
      const session = await auth();
      console.log("🟢 Sesión obtenida en GET:", session);

      if (session?.user?.id) {
        userId = session.user.id;
        const favorite = await prisma.favorite.findFirst({
          where: { articleId, userId },
        });
        isFavorited = !!favorite;
      }
    }

    // Obtener cantidad total de favoritos
    const count = await prisma.favorite.count({ where: { articleId } });

    console.log(
      `🔍 Artículo ${articleId} tiene ${count} likes. Favorito del usuario: ${isFavorited}`
    );

    return new Response(JSON.stringify({ count, isFavorited }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ ERROR en GET /api/articles/favorites:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    console.log("➡️ Iniciando POST /api/articles/favorites");

    const session = await auth(); // 🔥 Verifica que la sesión se obtiene
    console.log("🟢 Sesión obtenida en POST:", session);

    if (!session || !session.user || !session.user.id) {
      console.error("🚫 No autorizado: sesión no válida.");
      return new Response(
        JSON.stringify({ error: "No autorizado: sesión no válida." }),
        { status: 401 }
      );
    }

    const { articleId } = await req.json();
    if (!articleId) {
      console.error("⚠️ articleId es requerido.");
      return new Response(JSON.stringify({ error: "articleId es requerido" }), {
        status: 400,
      });
    }

    console.log(
      `✅ Usuario autenticado: ${session.user.id}, artículo: ${articleId}`
    );

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        articleId,
      },
    });

    console.log("✅ Favorito agregado correctamente:", favorite);

    return new Response(
      JSON.stringify({ message: "Favorito agregado", favorite }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error en POST /api/articles/favorites:", error.message);

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    console.log("➡️ Iniciando DELETE /api/articles/favorites");

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      console.error("🚫 No autorizado: sesión no válida.");
      return new Response(
        JSON.stringify({ error: "No autorizado: sesión no válida." }),
        { status: 401 }
      );
    }

    const { articleId } = await req.json();
    if (!articleId) {
      console.error("⚠️ articleId es requerido.");
      return new Response(JSON.stringify({ error: "articleId es requerido" }), {
        status: 400,
      });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        articleId,
      },
    });

    console.log("✅ Favorito eliminado correctamente");

    return new Response(JSON.stringify({ message: "Favorito eliminado" }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error en DELETE /api/articles/favorites:", error.message);

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
