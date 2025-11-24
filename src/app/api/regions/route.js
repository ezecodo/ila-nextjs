import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const leafOnly = url.searchParams.get("leafOnly") === "true"; // ✅ NUEVO parámetro opcional

    console.log(
      "Parámetro de búsqueda recibido:",
      search,
      "leafOnly:",
      leafOnly
    );

    // Consulta todas las regiones
    const regions = await prisma.region.findMany();
    console.log("Regiones encontradas:", regions.length);

    // ✅ NUEVO: Si leafOnly=true, devolver solo regiones sin hijos (lista plana)
    if (leafOnly) {
      // Identificar regiones que NO tienen hijos (regiones "hoja")
      const leafRegions = regions.filter((region) => {
        const hasChildren = regions.some((r) => r.parentId === region.id);
        return !hasChildren;
      });

      // Filtrar por búsqueda si existe
      let filteredLeafs = leafRegions;
      if (search) {
        filteredLeafs = leafRegions.filter(
          (region) =>
            region.name.toLowerCase().includes(search.toLowerCase()) ||
            (region.nameES &&
              region.nameES.toLowerCase().includes(search.toLowerCase()))
        );
      }

      console.log("Regiones hoja devueltas:", filteredLeafs.length);

      // Devolver lista plana simple
      return NextResponse.json(filteredLeafs, { status: 200 });
    }

    // ✅ COMPORTAMIENTO ORIGINAL (sin cambios) - Devolver árbol jerárquico
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

// ✅ POST sin cambios
export async function POST(req) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la región es obligatorio" },
        { status: 400 }
      );
    }

    const newRegion = await prisma.region.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(newRegion, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear región:", error.message);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
