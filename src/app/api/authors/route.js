import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authors = await prisma.author.findMany();
    return new Response(JSON.stringify(authors), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al obtener autores" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    const newAuthor = await prisma.author.create({ data: { name } });
    return new Response(JSON.stringify(newAuthor), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al crear autor" }), {
      status: 500,
    });
  }
}
