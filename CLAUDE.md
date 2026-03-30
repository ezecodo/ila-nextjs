# CLAUDE.md — ila Next.js Project

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: JavaScript (no TypeScript en src/, salvo algunos archivos de config)
- **Database**: MySQL via Prisma ORM
- **Auth**: NextAuth v5 (`src/auth.config.js`)
- **i18n**: next-intl — locales: `de` (default), `es`
- **Styles**: Tailwind CSS + CSS Modules (`src/styles/global.module.css`)
- **Storage**: Cloudinary (imágenes y PDFs)
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

## Imágenes

- Usar siempre el componente `<Image>` de Next.js para imágenes
- Las imágenes se almacenan en Cloudinary, no en `/public`
- `/public` solo contiene assets estáticos (logos, fuentes, SVGs)

## PDFs adjuntos en artículos

- Los PDFs se gestionan mediante el modelo `ArticlePdf` (`id`, `articleId`, `url`, `title`, `createdAt`) — relación 1:N con `Article`
- Un artículo puede tener **múltiples PDFs**, cada uno con su propio título
- Los PDFs se suben a Cloudinary con `resource_type: "raw"`, carpeta `ila/articles/pdfs/`
- **Importante**: el `public_id` debe incluir la extensión `.pdf` (ej: `article_21_pdf_TIMESTAMP_0.pdf`) para que la URL resultante tenga extensión y el browser pueda abrirlo correctamente
- Al eliminar un PDF, siempre borrar de Cloudinary con `uploader.destroy(public_id, { resource_type: "raw" })`
- El `public_id` para el destroy se extrae de la URL con el patrón: `/\/ila\/articles\/pdfs\/([^?]+)/`
- En el formulario se envían como `pdfs[0][file]`, `pdfs[0][title]`, `pdfs[1][file]`, etc.
- Para eliminar PDFs existentes en el edit, se envía `removePdfIds` como JSON array de IDs
- En la página pública (`[locale]/ausgaben/[...legacyPath]/page.js`) se muestra una sección con todos los PDFs cuando `article.pdfs?.length > 0`
- El GET de `/api/articles/[id]` y `/api/articles/by-legacy-path` incluyen `pdfs` en la respuesta
- Keys de traducción en `newArticle.form`: `pdfSectionTitle`, `pdfAddButton`, `pdfTitlePlaceholder`, `pdfRemove`, `pdfFileMissing`
- Keys de traducción en `article`: `pdfSectionTitle`, `pdfDownload`

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npx prisma studio    # GUI para explorar la base de datos
```
