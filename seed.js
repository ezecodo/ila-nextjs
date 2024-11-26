const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Insertando Beitragstypen...");
  const beitragstypen = [
    { name: "Bericht & Analyse" },
    { name: "Buchbesprechung" },
    { name: "Filmbesprechung" },
    { name: "Musikbesprechung" },
    { name: "Nachruf" },
    { name: "Interview" },
  ];

  // Inserta los Beitragstypen
  for (const typ of beitragstypen) {
    await prisma.beitragstyp.create({
      data: typ,
    });
  }

  console.log("Beitragstypen insertados correctamente.");

  console.log("Buscando 'Buchbesprechung' para agregar subtipos...");
  const buchbesprechung = await prisma.beitragstyp.findUnique({
    where: { name: "Buchbesprechung" },
  });

  if (buchbesprechung) {
    console.log("Insertando subtipos para 'Buchbesprechung'...");
    const subtypen = [
      { name: "Belletristik", beitragstypId: buchbesprechung.id },
      { name: "Sachbuch", beitragstypId: buchbesprechung.id },
    ];

    for (const subtyp of subtypen) {
      await prisma.beitragssubtyp.create({
        data: subtyp,
      });
    }

    console.log("Subtipos insertados correctamente.");
  } else {
    console.error("Error: 'Buchbesprechung' no encontrado.");
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
