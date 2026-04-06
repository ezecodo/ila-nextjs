import { writeFile, unlink } from "fs/promises";
import path from "path";

const MEDIA_DIR = "/usr/home/ilaweb/ila-uploads";
const BASE_URL = "https://www.ila-web.de/api/media";

/**
 * Sube un archivo al disco y devuelve la URL local.
 * @param {File} file - El archivo recibido del FormData
 * @param {string} subfolder - "images" | "pdfs-public" | "pdfs-private"
 * @returns {{ url: string, filename: string }}
 */
export async function uploadFile(file, subfolder = "images") {
  const ext = path.extname(file.name) || "";
  const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
  const fullPath = path.join(MEDIA_DIR, subfolder, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  const url = `${BASE_URL}/${subfolder}/${filename}`;
  return { url, filename };
}

/**
 * Elimina un archivo del disco a partir de su URL local.
 * Solo actúa si la URL es del servidor propio (ignora URLs de Cloudinary).
 * @param {string} url - URL del archivo a eliminar
 */
export async function deleteFile(url) {
  if (!url || !url.includes("/api/media/")) return;

  try {
    // Extrae el path relativo desde la URL: /api/media/images/foto.jpg → images/foto.jpg
    const relativePath = url.split("/api/media/")[1];
    if (!relativePath) return;

    const fullPath = path.join(MEDIA_DIR, relativePath);

    // Seguridad: verificar que el path está dentro del MEDIA_DIR
    if (!fullPath.startsWith(MEDIA_DIR)) return;

    await unlink(fullPath);
  } catch (error) {
    // Si el archivo no existe, no es un error crítico
    if (error.code !== "ENOENT") {
      console.error("❌ Error eliminando archivo local:", error);
    }
  }
}
