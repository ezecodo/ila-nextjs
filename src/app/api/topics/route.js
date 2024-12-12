import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * Construye un árbol de regiones a partir de datos planos
 */
function buildTopicTree(topics) {
  const topicMap = {};
  const tree = [];

  topics.forEach((topic) => {
    topicMap[topic.id] = { ...topic, children: [] };
  });

  topics.forEach((topic) => {
    if (topic.parentId && topicMap[topic.parentId]) {
      topicMap[topic.parentId].children.push(topicMap[topic.id]);
    } else if (!topic.parentId) {
      tree.push(topicMap[topic.id]);
    }
  });

  return tree;
}

/**
 * Encuentra todas las regiones relacionadas con las regiones filtradas
 */
function filterTopicsByHierarchy(topics, filteredIds) {
  const result = [];
  const topicMap = {};

  // Crear un mapa de regiones
  topics.forEach((topic) => {
    topicMap[topic.id] = topic;
  });

  // Agregar regiones relacionadas
  filteredIds.forEach((id) => {
    let current = topicMap[id];

    // Agregar nodos padres
    while (current) {
      if (!result.find((r) => r.id === current.id)) {
        result.push(current);
      }
      current = current.parentId ? topicMap[current.parentId] : null;
    }

    // Agregar hijos
    const stack = [topicMap[id]];
    while (stack.length) {
      const node = stack.pop();
      if (!result.find((r) => r.id === node.id)) {
        result.push(node);
      }
      stack.push(...topics.filter((r) => r.parentId === node.id));
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
    const topics = await prisma.topic.findMany();
    console.log("Topicos encontradas:", topics);

    // Identificar las regiones que coinciden con el filtro
    const filteredIds = topics
      .filter((topic) =>
        topic.name.toLowerCase().includes(search.toLowerCase())
      )
      .map((topic) => topic.id);

    console.log("IDs de Topicos filtradas:", filteredIds);

    // Incluir todas las regiones relacionadas con las coincidencias
    const relatedTopics = filterTopicsByHierarchy(topics, filteredIds);
    console.log("Topicos relacionadas:", relatedTopics);

    // Construir el árbol
    const tree = buildTopicTree(relatedTopics);

    return NextResponse.json(tree, { status: 200 });
  } catch (error) {
    console.error("Error al buscar Topicos:", error.message);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
