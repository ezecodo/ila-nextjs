import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

/**
 * Construye un árbol de regiones a partir de datos planos
 */
function buildRegionTree(regions) {
  const regionMap = {};
  const tree = [];

  regions.forEach((region) => {
    regionMap[region.id] = { ...region, children: [] };
  });

  regions.forEach((region) => {
    if (region.parentId && regionMap[region.parentId]) {
      regionMap[region.parentId].children.push(regionMap[region.id]);
    } else if (!region.parentId) {
      tree.push(regionMap[region.id]);
    }
  });

  return tree;
}

/**
 * Encuentra todas las regiones relacionadas con las regiones filtradas
 */
function filterRegionsByHierarchy(regions, filteredIds) {
  const result = [];
  const regionMap = {};

  // Crear un mapa de regiones
  regions.forEach((region) => {
    regionMap[region.id] = region;
  });

  // Agregar regiones relacionadas
  filteredIds.forEach((id) => {
    let current = regionMap[id];

    // Agregar nodos padres
    while (current) {
      if (!result.find((r) => r.id === current.id)) {
        result.push(current);
      }
      current = current.parentId ? regionMap[current.parentId] : null;
    }

    // Agregar hijos
    const stack = [regionMap[id]];
    while (stack.length) {
      const node = stack.pop();
      if (!result.find((r) => r.id === node.id)) {
        result.push(node);
      }
      stack.push(...regions.filter((r) => r.parentId === node.id));
    }
  });

  return result;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    console.log("Parámetro de búsqueda recibido:", search);

    // Consulta todas las regiones
    const regions = await prisma.region.findMany();
    console.log("Regiones encontradas:", regions);

    // Identificar las regiones que coinciden con el filtro
    const filteredIds = regions
      .filter((region) =>
        region.name.toLowerCase().includes(search.toLowerCase())
      )
      .map((region) => region.id);

    console.log("IDs de regiones filtradas:", filteredIds);

    // Incluir todas las regiones relacionadas con las coincidencias
    const relatedRegions = filterRegionsByHierarchy(regions, filteredIds);
    console.log("Regiones relacionadas:", relatedRegions);

    // Construir el árbol
    const tree = buildRegionTree(relatedRegions);

    return NextResponse.json(tree, { status: 200 });
  } catch (error) {
    console.error("Error al buscar regiones:", error.message);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
