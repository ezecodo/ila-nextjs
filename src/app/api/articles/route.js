import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const articles = await prisma.article.findMany();
    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const article = await prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
