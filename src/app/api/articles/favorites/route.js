import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth"; // Asegurar importación correcta

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    console.log("➡️ Iniciando GET /api/articles/favorites");

    const { searchParams } = new URL(req.url);
    const articleId = parseInt(searchParams.get("articleId"));

    if (!articleId) {
      console.error("⚠️ articleId es requerido.");
      return new Response(JSON.stringify({ error: "articleId requerido" }), {
        status: 400,
      });
    }

    if (searchParams.get("checkUser")) {
      const session = await auth();
      if (!session || !session.user) {
        console.log("🚫 Usuario no autenticado");
        return new Response(JSON.stringify({ isFavorited: false }), {
          status: 200,
        });
      }

      const isFavorited = await prisma.favorite.findFirst({
        where: {
          userId: session.user.id,
          articleId,
        },
      });

      console.log(`🔍 Verificación de favorito: ${isFavorited ? "Sí" : "No"}`);

      return new Response(JSON.stringify({ isFavorited: !!isFavorited }), {
        status: 200,
      });
    }

    // Contar favoritos del artículo
    const count = await prisma.favorite.count({ where: { articleId } });

    console.log(
      `📊 Cantidad de favoritos para el artículo ${articleId}:`,
      count
    );

    return new Response(JSON.stringify({ count }), { status: 200 });
  } catch (error) {
    console.error("❌ Error en GET /api/articles/favorites:", error.message);
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
