# CLAUDE.md — ila Next.js Project

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: JavaScript (no TypeScript en src/, salvo algunos archivos de config)
- **Database**: MySQL via Prisma ORM
- **Auth**: NextAuth v5 (`src/auth.config.js`)
- **i18n**: next-intl — locales: `de` (default), `es`
- **Styles**: Tailwind CSS + CSS Modules (`src/styles/global.module.css`)
- **Storage**: Servidor Hetzner (imágenes y PDFs) — ver sección "Storage local"
- **Translations**: DeepL (`src/lib/translateDeepl.js`)
- **Email**: Resend (`src/lib/email.js`)

## Estructura de carpetas

```
src/
  app/
    [locale]/          # Todas las páginas públicas y dashboard
      dashboard/       # Panel de administración (protegido, solo admin)
      dashboard-users/ # Panel de usuarios normales (protegido)
      auth/            # Login / registro
    api/               # API routes (Next.js Route Handlers)
    components/        # Componentes globales reutilizables
    globals.css        # Estilos globales
    styles/            # Estilos adicionales
  auth.config.js       # Configuración de NextAuth
  middleware.js        # Middleware de auth + i18n — NO TOCAR
  i18n/
    routing.ts         # Configuración de locales — NO TOCAR
    request.ts
    navigation.ts
  lib/
    prisma.js          # Cliente Prisma singleton
    email.js           # Envío de emails con Resend
    translateDeepl.js  # Integración con DeepL
    localUpload.js     # Helper para subir/borrar archivos en disco (reemplaza Cloudinary)
    slugify.js
    zod.js
    password.js
  styles/
    global.module.css  # CSS Modules globales
messages/
  de.json              # Traducciones alemán (idioma principal)
  es.json              # Traducciones español
prisma/
  schema.prisma        # Schema de la BD — NO TOCAR
  migrations/          # Migraciones — NO TOCAR
scripts/               # Scripts de utilidad y migración de datos (no tocar)
```

## API Routes disponibles

```
src/app/api/
  activity-log/    articles/      beitragstypen/  dashboard/
  admin/           auth/          carousels/      editions/
  aktuelles/       authors/       categories/     entities/
  annual-index/    banners/       count/          events/
  gifts/           orders/        topics/         translate/
  interviewees/    regions/       subscriptions/  upload/
  links/           network/       toc-match/      users/
```

## Páginas del dashboard

```
src/app/[locale]/dashboard/
  account/         articles/      editions/       k2/
  activity/        authors/       events/         links/
  admin/           banners/       faq/            network/
  aktuelles/       carousels/     gifts/          regions/
  annual-index/    components/    instagram-generator/
  orders/          reviewer/      subscriptions/  topics/
  translators/
```

## Roles y autenticación

- **admin**: acceso total al dashboard
- **translator**: solo `/dashboard/translators/*` y `/dashboard/account`
- **user**: solo `/dashboard-users`
- Protección gestionada en `src/middleware.js` — **NUNCA modificar**

## Internacionalización (next-intl)

- Siempre usar `useTranslations("namespace")` en componentes cliente (`"use client"`)
- Siempre usar `getTranslations("namespace")` en server components
- **Nunca hardcodear strings** en alemán o español directamente en componentes
- Al añadir keys nuevas, añadirlas **siempre en ambos archivos**: `messages/de.json` y `messages/es.json`
- **Nunca eliminar** keys existentes de los JSON sin confirmación explícita
- El locale por defecto es `de` (alemán)

## Prisma

- Importar siempre el cliente desde: `import { prisma } from "@/lib/prisma"`
- **NUNCA modificar `prisma/schema.prisma`** sin confirmación explícita
- **NUNCA ejecutar `prisma migrate`** sin confirmación explícita
- Seguir el patrón existente en las API routes para queries

## Patrón estándar de API Route

```javascript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
```

## Patrón estándar de componente dashboard

```javascript
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function MiPaginaDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("miNamespace");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ...
}
```

## ⚠️ Archivos que NUNCA se deben modificar

- `src/middleware.js`
- `src/middleware_bp.js`
- `next.config.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `src/lib/prisma.js`
- `src/i18n/routing.ts`
- `src/auth.config.js`
- `src/app/auth.js`
- `.env` / `.env.local`
- `package.json`
- `scripts/` (scripts de migración de datos)

## ✅ Zonas de trabajo habituales

- `src/app/[locale]/dashboard/` — páginas del panel admin
- `src/app/api/` — endpoints de la API
- `src/app/components/` — componentes reutilizables
- `messages/de.json` y `messages/es.json` — traducciones

## Storage local (Hetzner)

- Las imágenes y PDFs se almacenan en el servidor Hetzner, **no en Cloudinary**
- Helper compartido: `src/lib/localUpload.js` — siempre usar este para subir/borrar archivos
- **Nunca usar Cloudinary** para nuevos uploads

### Estructura de directorios en el servidor
```
/usr/home/ilaweb/ila-uploads/
  images/        ← imágenes (artículos, autores, etc.)
  pdfs-public/   ← PDFs públicos
  pdfs-private/  ← PDFs privados ABO (pendiente de implementar auth)
```

### URLs
- Las imágenes se sirven vía API route: `https://www.ila-web.de/api/media/images/nombre.jpg`
- Los PDFs públicos: `https://www.ila-web.de/api/media/pdfs-public/nombre.pdf`
- El endpoint `/api/media/[...path]` lee los archivos del disco y los sirve con cache de 1 año

### Helper `localUpload.js`
```javascript
import { uploadFile, deleteFile } from "@/lib/localUpload";

// Subir archivo
const { url, filename } = await uploadFile(file, "images"); // subfolder: images | pdfs-public | pdfs-private

// Borrar archivo (ignora URLs de Cloudinary automáticamente)
await deleteFile(url);
```

### Módulos ya migrados a storage local
- `src/app/api/upload/route.js` ✅
- `src/app/api/articles/route.js` ✅
- `src/app/api/articles/[id]/route.js` ✅

### Módulos pendientes de migrar (aún usan Cloudinary)
- `src/app/api/aktuelles/route.js`
- `src/app/api/aktuelles/[id]/route.js`
- `src/app/api/annual-index/upload/route.js`
- `src/app/api/editions/route.js`
- `src/app/api/editions/[id]/route.js`
- `src/app/api/gifts/route.js`
- `src/app/api/events/route.js`
- `src/app/api/events/[id]/route.js`

### Imágenes existentes en Cloudinary
- Las URLs antiguas de Cloudinary siguen funcionando mientras la cuenta esté activa
- `deleteFile()` ignora automáticamente URLs de Cloudinary — no hay riesgo de errores
- No hay urgencia de migrar las imágenes existentes

## Imágenes

- Usar siempre el componente `<Image>` de Next.js para imágenes
- `/public` solo contiene assets estáticos (logos, fuentes, SVGs)
- Los nuevos uploads van al servidor Hetzner via `localUpload.js`

## PDFs adjuntos en artículos

- Los PDFs se gestionan mediante el modelo `ArticlePdf` (`id`, `articleId`, `url`, `title`, `createdAt`) — relación 1:N con `Article`
- Un artículo puede tener **múltiples PDFs**, cada uno con su propio título
- Los PDFs se suben al servidor con `uploadFile(file, "pdfs-public")`
- Al eliminar un PDF, usar `deleteFile(pdf.url)` — funciona tanto con URLs locales como de Cloudinary
- En el formulario se envían como `pdfs[0][file]`, `pdfs[0][title]`, `pdfs[1][file]`, etc.
- Para eliminar PDFs existentes en el edit, se envía `removePdfIds` como JSON array de IDs
- En la página pública (`[locale]/ausgaben/[...legacyPath]/page.js`) se muestra una sección con todos los PDFs cuando `article.pdfs?.length > 0`
- El GET de `/api/articles/[id]` y `/api/articles/by-legacy-path` incluyen `pdfs` en la respuesta
- Keys de traducción en `newArticle.form`: `pdfSectionTitle`, `pdfAddButton`, `pdfTitlePlaceholder`, `pdfRemove`, `pdfFileMissing`
- Keys de traducción en `article`: `pdfSectionTitle`, `pdfDownload`

## Monitoring y observabilidad

### Health Check
- Endpoint: `GET /api/health` — verifica conectividad con la BD y retorna 200 (ok) o 503 (degraded)
- Monitorizado por **UptimeRobot** cada 5 minutos — alerta por email si cae

### Sentry (error tracking)
- Instalado con `@sentry/nextjs`
- Archivos de config: `sentry.server.config.ts`, `instrumentation-client.ts`, `instrumentation.js`
- Captura errores automáticamente en cliente y servidor
- `Sentry.captureException(error)` añadido manualmente en los `catch` críticos de:
  - `src/app/api/articles/route.js` — creación de artículos, subida de imágenes y PDFs
  - `src/app/api/articles/[id]/route.js` — GET, PUT, DELETE de artículos
  - `src/lib/email.js` — envío de emails con Resend
- Envía errores tanto en local (`development`) como en producción — útil para detectar bugs antes del deploy
- Dashboard: sentry.io

## Deploy en Hetzner (zero-downtime)

```bash
git pull origin main
npm install
npm run build
pm2 restart ilaweb
pm2 restart ila-scheduler
pm2 save
```

- El servidor sigue corriendo durante el build — sin downtime para los lectores
- Solo hay ~1 segundo de interrupción en el `pm2 restart`

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npx prisma studio    # GUI para explorar la base de datos
```
