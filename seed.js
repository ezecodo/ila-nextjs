const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Crear un artículo con un nuevo tipo y un nuevo autor
  const article = await prisma.article.create({
    data: {
      title: "Primer artículo de prueba",
      subtitle: "Este es el subtítulo",
      previewText: "Texto de vista previa del artículo.",
      content: "Aquí está el contenido completo del artículo.",
      additionalInfo: "Información adicional del artículo.",
      publicationDate: new Date(),
      createdAt: new Date(),
      type: {
        create: {
          name: "Tipo de prueba",
        },
      },
      author: {
        create: {
          name: "Autor de prueba",
          bio: "Biografía breve del autor.",
        },
      },
    },
  });

  console.log("Artículo creado:", article);
}

main()
  .catch((e) => {
    console.error("Error al poblar la base de datos:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
