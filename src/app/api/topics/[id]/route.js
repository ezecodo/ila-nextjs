import { prisma } from "@/lib/prisma";

export async function GET(request, context) {
  try {
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del topic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicId = parseInt(params.id, 10);
    if (isNaN(topicId)) {
      return new Response(JSON.stringify({ error: "ID de topic inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(topic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en la API de topics:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request, context) {
  try {
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del topic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicId = parseInt(params.id, 10);
    if (isNaN(topicId)) {
      return new Response(JSON.stringify({ error: "ID de topic inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { name, nameES, parentId } = body;

    if (!name || name.trim() === "") {
      return new Response(
        JSON.stringify({ error: "El nombre del topic es obligatorio" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name: name.trim(),
        nameES: nameES?.trim() || null,
        parentId: parentId || null,
      },
    });

    return new Response(JSON.stringify(updatedTopic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error actualizando topic:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar topic",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del topic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicId = parseInt(params.id, 10);
    if (isNaN(topicId)) {
      return new Response(JSON.stringify({ error: "ID de topic inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        _count: { select: { children: true } },
      },
    });

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Se permite borrar aunque tenga artículos asociados: la relación
    // ArticleTopics es many-to-many implícita y Prisma desvincula solo.
    // Solo se bloquea si tiene subtopics (FK por parentId).
    if (topic._count.children > 0) {
      return new Response(
        JSON.stringify({
          error: `No se puede eliminar. El topic tiene ${topic._count.children} subtopic(s).`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.topic.delete({
      where: { id: topicId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error eliminando topic:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error al eliminar topic",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
