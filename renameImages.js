import fs from "fs/promises";
import path from "path";

const directoryPath = path.join(process.cwd(), "public/uploads/editions-pics");

(async () => {
  try {
    console.log("Directorio a procesar:", directoryPath);

    const files = await fs.readdir(directoryPath);
    console.log("Archivos encontrados:", files);

    for (const file of files) {
      const oldFilePath = path.join(directoryPath, file);
      const newFilePath = path.join(directoryPath, file.toLowerCase());

      if (oldFilePath !== newFilePath) {
        console.log(`Renombrando: ${oldFilePath} → ${newFilePath}`);
        await fs.rename(oldFilePath, newFilePath);
      }
    }

    console.log("Todos los archivos han sido renombrados a minúsculas.");
  } catch (error) {
    console.error("Error al renombrar los archivos:", error);
  }
})();
