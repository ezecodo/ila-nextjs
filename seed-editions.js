const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Insertando ediciones...");
  await prisma.edition.createMany({
    data: [
      {
        number: 1,
        title: "Primera Edición",
        datePublished: new Date("2022-01-01"),
      },
      {
        number: 2,
        title: "Segunda Edición",
        datePublished: new Date("2023-01-01"),
      },
      {
        number: 3,
        title: "Tercera Edición",
        datePublished: new Date("2024-01-01"),
      },
    ],
  });
  console.log("Ediciones insertadas.");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
