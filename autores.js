import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedAuthors() {
  const authors = [
    { name: "Juana Molina" },
    { name: "Pepe Mujica" },
    { name: "Racing Club" },
    { name: "eZe" },
    { name: "Barceloa" },
    { name: "Loconia" },
    { name: "Frida Kahlo" },
  ];

  for (const author of authors) {
    await prisma.author.create({ data: author });
  }

  console.log("Autores añadidos a la base de datos.");
  await prisma.$disconnect();
}

seedAuthors().catch((error) => {
  console.error("Error al añadir autores:", error);
  prisma.$disconnect();
  process.exit(1);
});
