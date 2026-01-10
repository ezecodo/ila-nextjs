import { prisma } from "@/lib/prisma";

export async function GET(request, context) {
  try {
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID de la región" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) {
      return new Response(JSON.stringify({ error: "ID de región inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!region) {
      return new Response(JSON.stringify({ error: "Región no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(region), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en la API de regions:", error.message);
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
        JSON.stringify({ error: "Se requiere el ID de la región" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) {
      return new Response(JSON.stringify({ error: "ID de región inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { name, nameES, parentId } = body;

    if (!name || name.trim() === "") {
      return new Response(
        JSON.stringify({ error: "El nombre de la región es obligatorio" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedRegion = await prisma.region.update({
      where: { id: regionId },
      data: {
        name: name.trim(),
        nameES: nameES?.trim() || null,
        parentId: parentId || null,
      },
    });

    return new Response(JSON.stringify(updatedRegion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error actualizando región:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar región",
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
        JSON.stringify({ error: "Se requiere el ID de la región" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) {
      return new Response(JSON.stringify({ error: "ID de región inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        _count: { select: { articles: true, children: true } },
      },
    });

    if (!region) {
      return new Response(JSON.stringify({ error: "Región no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (region._count.articles > 0) {
      return new Response(
        JSON.stringify({
          error: `No se puede eliminar. La región tiene ${region._count.articles} artículo(s) asociado(s).`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (region._count.children > 0) {
      return new Response(
        JSON.stringify({
          error: `No se puede eliminar. La región tiene ${region._count.children} subregión(es).`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.region.delete({
      where: { id: regionId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error eliminando región:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error al eliminar región",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
