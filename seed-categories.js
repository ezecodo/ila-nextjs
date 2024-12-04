import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "n.v",
    "Schwerpunkt",
    "Berichte & Hintergründe",
    "Kulturszene",
    "Lebenswege",
    "Solidaritätsbewegung",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Categorías iniciales añadidas.");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
