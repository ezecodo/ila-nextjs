import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const MEDIA_DIR = "/usr/home/ilaweb/ila-uploads";
const BASE_URL = "https://www.ila-web.de/api/media";

/**
 * Convierte un string a slug (minúsculas, sin espacios ni caracteres especiales).
 * @param {string} str
 * @returns {string}
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9]+/g, "-")     // reemplazar no-alfanuméricos por guión
    .replace(/^-+|-+$/g, "")         // quitar guiones al inicio/fin
    .slice(0, 60);                    // limitar longitud
}

/**
 * Sube un archivo al disco y devuelve la URL local.
 * Crea las carpetas necesarias automáticamente.
 *
 * @param {File} file - El archivo recibido del FormData
 * @param {string} subfolder - Ruta relativa al MEDIA_DIR (puede ser anidada, ej: "images/editions/273/portada")
 * @param {string} [prefix] - Prefijo descriptivo para el nombre del archivo (ej: "edition_273_dossier-abril")
 * @returns {{ url: string, filename: string }}
 */
export async function uploadFile(file, subfolder = "images", prefix = null) {
  const ext = path.extname(file.name).toLowerCase() || "";
  const base = prefix
    ? `${prefix}_${Date.now()}`
    : `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const filename = `${base}${ext}`;

  const dirPath = path.join(MEDIA_DIR, subfolder);
  const fullPath = path.join(dirPath, filename);

  // Crear carpetas si no existen
  await mkdir(dirPath, { recursive: true });

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
    // Extrae el path relativo desde la URL
    const relativePath = url.split("/api/media/")[1];
    if (!relativePath) return;

    const fullPath = path.join(MEDIA_DIR, relativePath);

    // Seguridad: verificar que el path está dentro del MEDIA_DIR
    if (!fullPath.startsWith(MEDIA_DIR)) return;

    await unlink(fullPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("❌ Error eliminando archivo local:", error);
    }
  }
}
