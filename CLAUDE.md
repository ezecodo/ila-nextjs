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
      dashboard-users/ # Panel de usuarios normales + PDF-Abo (protegido)
      auth/            # Login / registro
      pdf-reader/      # Visor de PDFs (dev/test)
      components/
        PdfReader/     # Componente visor PDF flip-book (react-pageflip + pdfjs)
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
  pdf-abo-subscribers.json   # Lista de suscriptores PDF-Abo
  seed-pdf-abo.js            # Script para cargar suscriptores en BD (sin enviar emails)
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
  user/            health/        media/
```

### API routes PDF-Abo relevantes
- `GET /api/user/pdf-abo` — verifica si el usuario actual tiene PDF-Abo activo
- `GET /api/admin/pdf-abo-invitations` — lista de invitaciones (admin)
- `POST /api/admin/pdf-abo-invitations` — crear invitación (admin)
- `DELETE /api/admin/pdf-abo-invitations/[id]` — eliminar invitación (admin)
- `POST /api/admin/pdf-abo-invitations/[id]/resend` — reenviar email de invitación (admin)
- `POST /api/admin/pdf-abo-invitations/upload-csv` — carga masiva por CSV (admin)
- `GET/POST/DELETE /api/editions/[id]/pdf-abo` — gestión del PDF privado de una edición (admin)

## Export CSV de Bestellungen y Abos (CiviCRM bridge)

Los pedidos de Dossiers y las suscripciones se procesan manualmente en CiviCRM. Para evitar que la persona tenga que copiar a mano desde el panel, hay un botón **"📥 Exportar nuevos (N)"** en `/dashboard/orders` y `/dashboard/subscriptions` que descarga un CSV con los registros `isNew=true`.

### Endpoints
- `GET /api/orders/export-csv` — CSV de pedidos de Dossiers con `isNew=true`
- `GET /api/subscriptions/export-csv` — CSV de suscripciones con `isNew=true`

### Convenciones de formato
- **Encoding**: UTF-8 con BOM (`﻿`) → Excel alemán abre directo con umlauts correctos.
- **Separador**: `;` (estándar europeo, no `,`).
- **Filename**: `ila-bestellungen-YYYY-MM-DD.csv` / `ila-abos-YYYY-MM-DD.csv`.
- **Headers en alemán** (la persona que procesa es nativo alemán).
- **Una fila por transacción** — los destinatarios adicionales van en columnas planas con prefijo (`Empfänger1*`, `Empfänger2*`, `Geschenkempfänger*`). NO usar múltiples filas por contacto: confunde al hacer data entry manual.
- **NO marca `isNew=false` al exportar** — el flujo "marcar como procesado" sigue siendo manual desde el modal, para que la persona pueda re-exportar si lo necesita antes de cerrar en CiviCRM.

### Disambiguación crítica (Abos)
- `Prämie` = el regalo físico que recibe el abonado como agradecimiento (relación `gift` → modelo `Gift`).
- `Geschenkempfänger*` = la persona a la que se le **regala la suscripción** (`giftRecipient*` en schema, solo si `isGift=true`).
- `VersandPrämie` = a quién se envía la Prämie cuando es Geschenkabo (`giftDelivery`: `to_payer` / `to_recipient`).
- `Geschenkdauer` = duración del Geschenkabo (1 año / hasta cancelación).

### Si se reactiva la promo de fin de año
La promo "3 meses gratis para tercera persona" (`promoGiftRecipient*` en schema) **NO está en el CSV** — se quitó porque la promo era de fin de año 2025. El componente `PromoGiftForm` sigue en el formulario por si se reactiva. Si vuelve a usarse activamente, hay que añadir columnas `PromoEmpfänger*` en `src/app/api/subscriptions/export-csv/route.js`.

## Páginas del dashboard

```
src/app/[locale]/dashboard/
  account/         articles/      editions/       k2/
  activity/        authors/       events/         links/
  admin/
    pdf-abo/       # Gestión PDF-Abo: suscriptores + upload de dossiers
  banners/         faq/            network/
  aktuelles/       carousels/     gifts/          regions/
  annual-index/    components/    instagram-generator/
  orders/          reviewer/      subscriptions/  topics/
  translators/
```

## Roles y autenticación

- **admin**: acceso total al dashboard
- **translator**: solo `/dashboard/translators/*` y `/dashboard/account`
- **user**: solo `/dashboard-users` (artículos favoritos + cuenta)
- **user con PDF-Abo**: igual que user + módulo "Mis Dossiers PDF" (controlado por `PdfAboInvitation.isRedeemed`, no por rol separado)
- Protección gestionada en `src/middleware.js` — **NUNCA modificar**

## Sistema PDF-Abo

### Modelo de datos
- `PdfAboInvitation` — whitelist de emails autorizados (`email`, `name`, `isRedeemed`, `redeemedBy`, `startDate`, `endDate`)
- `EditionPdf` — PDF privado de cada edición (`editionId`, `pdfUrl`, `fileSize`, `pageCount`) — relación `Edition.pdf`

### Flujo completo
1. Admin carga emails en `/dashboard/admin/pdf-abo` (individualmente o por CSV)
2. Admin sube PDFs de dossiers desde la sección "Dossiers PDF-Abo" de esa misma página
3. Admin envía invitación por email (botón ✈️ por cada suscriptor) — el link incluye email y nombre pre-rellenados
4. El suscriptor hace click → llega a `/auth/signup?pdfAbo=true&email=...&name=...` con el form pre-rellenado y el email bloqueado
5. Al registrarse, `PdfAboInvitation` se marca `isRedeemed: true` y se vincula al `User`
6. El suscriptor ve el módulo "📰 Mis Dossiers (PDF)" en `/dashboard-users`

### Acceso a PDFs privados
- Los PDFs se sirven desde `/api/media/pdfs-private/...` — actualmente sin auth (pendiente implementar verificación)
- Para verificar acceso: `GET /api/user/pdf-abo` → `{ hasPdfAbo: boolean }`
- El visor usa `PdfReader` component (`react-pageflip` + `pdfjs` desde CDN)

### Archivos clave
- `src/app/[locale]/dashboard/admin/pdf-abo/page.jsx` — página admin (suscriptores + dossiers)
- `src/app/[locale]/dashboard/admin/pdf-abo/DossiersSection.jsx` — sección upload de PDFs por edición
- `src/app/[locale]/dashboard-users/page.js` — dashboard usuario (muestra módulo PDF si tiene ABO)
- `src/app/[locale]/components/PdfReader/PdfReader.jsx` — visor flip-book
- `src/app/[locale]/pdf-reader/page.js` — página de prueba del visor (`/de/pdf-reader?url=...`)

### PDFs privados en Hetzner
```
/usr/home/ilaweb/ila-uploads/pdfs-private/editions/<number>/ila_<number>_<timestamp>.pdf
```
- **No usar `/api/media/`** para PDFs privados hasta implementar auth — pendiente
- Los PDFs públicos de artículos siguen en `pdfs-public/`

## Internacionalización (next-intl)

- Siempre usar `useTranslations("namespace")` en componentes cliente (`"use client"`)
- Siempre usar `getTranslations("namespace")` en server components
- **Nunca hardcodear strings** en alemán o español directamente en componentes
- Al añadir keys nuevas, añadirlas **siempre en ambos archivos**: `messages/de.json` y `messages/es.json`
- **Nunca eliminar** keys existentes de los JSON sin confirmación explícita
- El locale por defecto es `de` (alemán)
- Los placeholders en traducciones usan `{variable}` (llave simple) — next-intl NO acepta `{{variable}}`

## Prisma

- Importar siempre el cliente desde: `import { prisma } from "@/lib/prisma"`
- **NUNCA modificar `prisma/schema.prisma`** sin confirmación explícita
- **NUNCA ejecutar `prisma migrate`** sin confirmación explícita
- Las migraciones se corren localmente con `npx prisma migrate dev` — como la BD remota es la misma para dev y prod, quedan aplicadas en producción también
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

## Editor de artículos (Publisher / ila v2)

### Rutas
- `/dashboard/articles/edit/[id]` — editor clásico (activo para todos los admins)
- `/dashboard/articles/edit-v2/[id]` — **nuevo editor v2** (acceso restringido, ver abajo)
- `/dashboard/articles/new-v2` — nueva ruta v2 equivalente

### Acceso al editor v2
- El botón "Editar" en `ArticlesList.js` muestra un modal de elección **solo para** `e.zeangeloni@gmail.com`
- El modal ofrece "Nuevo editor (v2)" o "Editor clásico"
- Para cualquier otro admin, el botón va directamente al editor clásico
- La página `edit-v2/[id]/page.js` también verifica la sesión y redirige al editor clásico si el email no coincide
- Cuando el v2 esté listo para todos: quitar el check de email en `edit-v2/[id]/page.js` y cambiar el href en `ArticlesList.js`

### Componente InterviewEditor (Publisher)
- Archivo: `src/app/[locale]/components/InterviewEditor/InterviewEditor.jsx`
- Formulario padre: `src/app/[locale]/dashboard/articles/components/ArticleFormV2.jsx`
- El `InterviewEditor` recibe `title` y `subtitle` del formulario y los pasa al `PasteImportPanel` para mostrarlos en la Vorschau
- El Publisher (PasteImportPanel) tiene un modo "Vorschau" que replica exactamente el render de la página de artículos — las transforms están copiadas inline, **no importadas** de ningún archivo externo

### Página de artículos — funciones de transformación
- `src/app/[locale]/ausgaben/[...legacyPath]/page.js` contiene funciones **definidas localmente** dentro del componente:
  - `autoFormatHeadings` — `<p><strong>Título</strong></p>` → `<h3>`
  - `autoDetectHeadings` — párrafos cortos sin punto final → `<h3>` o `<h4>`
  - `normalizeContentForRender` — pass-through (reservado para futuros usos)
  - `wrapInlineImagesWithCaption` — `<img>` → `<figure>` con `<figcaption>`
  - `rewriteEditionLinksWithLocale` — reescribe hrefs `/editions/[id]` con el locale correcto
- **IMPORTANTE**: estas funciones están referenciadas en el render (línea ~560). Si se eliminan o se mueven sin actualizar el uso, la página rompe con `ReferenceError`
- `src/lib/articleContentTransforms.js` existe pero está **huérfano** (no importado en ningún sitio) — no borrarlo sin revisar

### Imágenes editoriales que fluyen con el texto (float)
- Las imágenes inline pueden flotar (texto envolviéndolas, estilo revista impresa). El autor lo elige en el editor publilab por imagen: tamaño S/M/L (`25`/`50`/`75`) + alineación (`⬅` left / `⬛` center / `➡` right).
- **Se guarda en el contenido** como `<p><img style="width:X%" data-align="left|right">…</p>`. El `data-align` solo se escribe si el ancho es S/M/L (los floatables); `center` no escribe atributo.
- El **figure-wrapping** (caption + clase float) ocurre **solo en render**, no se guarda. La función `wrapInlineImagesWithCaption` lee `data-align`, arma `inline-image-left`/`inline-image-right` y mete el width en el `style` del `<figure>`.
- **Esta función está duplicada** en 4 sitios y deben mantenerse idénticas: `ausgaben/[...legacyPath]/page.js`, `online/[...legacyPath]/page.js`, el Vorschau del `InterviewEditor.jsx`, y `dashboard/articles/translate/[id]/page.js`.
- El CSS vive en `globals.css` dentro de un `@media (min-width: 768px)` (float **solo desktop**; en mobile las imágenes quedan apiladas full-width):
  - `.article-content { display: flow-root; }` contiene el float para que el bloque "AUS DIESEM DOSSIER" del final no se meta al lado.
  - `figure.inline-image-left/right img { width: 100% !important; }` — el width real va en el `<figure>`, no en el `<img>` (evita la doble reducción que achicaba la imagen).
  - `figure.inline-image-left:last-child` / `right:last-child` → `float: none` + centrado (una imagen flotante sin texto debajo no tiene sentido, se renderiza como bloque centrado).
  - `.article-content h2, h3, h4 { clear: both; }` — los títulos limpian el float (el texto que sigue al título envuelve, no el título).
- **Opt-in y retrocompatible**: artículos viejos sin `data-align` no flotan. La feature no toca el archivo existente.
- El PDF bundle (`ArticleBundlePdf.jsx`) **no** implementa float (react-pdf no soporta CSS float) — fallback a bloque, intencional.

## Artículos relacionados

### Rail (columna derecha)
- `src/app/[locale]/components/RelatedArticles/RelatedArticles.jsx` — client component, sticky en desktop. Fetch a `/api/articles/related?articleId=X&locale=Y&limit=11`.
- Relevancia (en la API): 1º región compartida, luego se rankea por nº de temas compartidos; si faltan, completa con artículos que comparten solo temas.
- Al final del rail hay un link "Ver todos los relacionados →" (`t("seeAll")`) que lleva a `/[locale]/related/[articleId]`.

### Página "ver todos" (`/[locale]/related/[articleId]`)
- `src/app/[locale]/related/[articleId]/page.js` — client component. Grid de **todos** los relacionados (comparte región **o** tema), orden cronológico, con **filtro de rango de años** (dos `<select>` Desde/Hasta) y paginación (24/página).
- Estética alineada al sistema de marca de la landing (sans, `#BD0E0D`, `rounded-none`, título con subrayado animado, `FavoriteButton variant="mini"`).

### API `/api/articles/related/route.js`
- **Modo rail (default)**: devuelve un **array** (no romper — el rail lo consume así). `limit` capado a 12.
- **Modo `all=true`**: devuelve `{ items, total, years, page, pageSize, source }`. Params: `yearFrom`/`yearTo` (filtran por `edition.datePublished`), `page`, `pageSize` (default 24, cap 48). `years` = años disponibles para poblar los selects; `source` = título + `legacyPath` del artículo origen (para header y back-link).
- El escaneo de años/total usa `take: 1000` como tope de seguridad — si una región muy grande del archivo lo supera, subir el tope o migrar a `count` + `groupBy` por año.
- Helper `attachImage` adjunta la primera imagen (`contentType: "ARTICLE"`, `contentId = beitragsId || id`).

## Sistema de traducción ES

### Modelo de datos (campos en `Article`)
- `translationStatus` — `not_assigned` | `in_progress` | `submitted` | `approved`
- `isTranslatedES` — true cuando `submitted` o `approved`
- `needsReviewES` — true solo cuando está `submitted` esperando revisión
- `reviewedAt` — fecha de la última aprobación
- `editedAfterReview` — true cuando un artículo `approved` se edita después (sin volver a aprobar)
- `translatorId`, `reviewerId`, `assignedAt`

### Flujo de estados
1. Admin asigna traductor → `in_progress`
2. Traductor guarda borrador → sigue `in_progress`
3. Traductor envía traducción → `submitted` + `needsReviewES: true` (badge amarillo "Revisión")
4. Reviewer aprueba → `approved` + `needsReviewES: false` + `reviewedAt` (badge verde "Revisado")
5. Si alguien edita un artículo ya aprobado (campos ES o alt/title de imágenes) → mantiene `approved` pero marca `editedAfterReview: true` (badge azul "✏️ Editado tras revisión")
6. Re-aprobar resetea `editedAfterReview` a `false`

### Indicadores visuales en `ArticlesList.js`
- Modo admin (columna "🌐 Tra"):
  - Check verde → traducido
  - Link amarillo "Revisión" → `needsReviewES`
  - Link azul "✏️ Editado" → `editedAfterReview`
  - Check amarillo → revisado y sin cambios posteriores
- Modo reviewer: badges en columna de estado (verde/azul/amarillo) con acción "Revisar" o "🔁 Revisar"

### Editor de traducción (`/dashboard/articles/translate/[id]`)
- Vista compacta: alemán y español lado a lado
- El campo ES compacto es **solo lectura** — click en él abre el modal de traducción a pantalla completa
- Modal tiene en el header: "⚡ Autotraducir con DeepL", "💾 Guardar borrador" (con feedback inline) y "✕ Cerrar"
- Backspace al inicio de un `<p>` con un heading arriba: convierte el heading a `<p>` antes del merge nativo (evita que el texto herede h3/h4)
- Toolbar (`setBlockTag`, `execModal`) re-guarda la selección post-comando para que clicks consecutivos (h3 → h4) no pierdan la selección
- Botón "🖼️ Guardar alt/title de imágenes" abajo solo aparece si `inlineImages.length > 0`
- En modo `?mode=review` el botón de abajo es "✅ Aprobar traducción"

### API PUT `/api/articles/[id]` — lógica de traducción
- Si llega con `translationStatus`, actualiza estado y deriva `isTranslatedES` / `needsReviewES`
- Si el artículo estaba `approved` y cambian campos ES o `imageTranslations` sin re-aprobar → fuerza `approved` y marca `editedAfterReview: true`
- Caso `imageTranslationsOnly: true` → solo actualiza `Image.titleES`/`altES` (no toca estado), pero también marca `editedAfterReview` si el artículo estaba aprobado

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
  images/
    aktuelles/          ← imágenes de Aktuelles
    editions/
      <number>/
        articulos/      ← imágenes de artículos de una edición
        portada/        ← portada de la edición
    online/             ← imágenes de artículos online
  pdfs-public/
    editions/<number>/  ← PDFs de artículos de edición
    online/             ← PDFs de artículos online
  pdfs-private/
    editions/<number>/  ← PDFs privados completos para PDF-Abo
```

### URLs
- Las imágenes se sirven vía API route: `https://www.ila-web.de/api/media/images/nombre.jpg`
- Los PDFs públicos: `https://www.ila-web.de/api/media/pdfs-public/nombre.pdf`
- Los PDFs privados: `https://www.ila-web.de/api/media/pdfs-private/editions/<number>/nombre.pdf` — pendiente auth
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
- `src/app/api/aktuelles/route.js` ✅
- `src/app/api/aktuelles/[id]/route.js` ✅
- `src/app/api/editions/route.js` ✅
- `src/app/api/editions/[id]/route.js` ✅
- `src/app/api/editions/[id]/pdf-abo/route.js` ✅ (PDFs privados)

### Módulos pendientes de migrar (aún usan Cloudinary)
- `src/app/api/annual-index/upload/route.js`
- `src/app/api/gifts/route.js`
- `src/app/api/events/route.js`
- `src/app/api/events/[id]/route.js`

### Mejoras de infraestructura pendientes
- **Dockerizar la app** — permitiría zero-downtime real con `docker-compose`, rollback instantáneo y entorno reproducible. Los uploads en `~/ila-uploads/` se montarían como volumen Docker.
- **Migrar módulos restantes** de Cloudinary a storage local (ver lista de módulos pendientes arriba)
- **Auth en `/api/media/pdfs-private/`** — implementar verificación de sesión + PDF-Abo antes de lanzar

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
- Las migraciones de Prisma se corren desde local (misma BD) — no hace falta `prisma migrate deploy` en el servidor

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npx prisma studio    # GUI para explorar la base de datos
node scripts/seed-pdf-abo.js  # Cargar suscriptores PDF-Abo en BD (sin enviar emails)
```

## Scripts de migración / mantenimiento

### `scripts/migrate-additionalinfo-to-html.js`

Normaliza los campos `additionalInfo` (DE) y `additionalInfoES` (ES) del modelo `Article` convirtiendo texto plano con URLs sueltas y `\n\n` a HTML estructurado (`<p>`, `<br>`, `<a>`), igual que el editor de traducción. Función **idempotente**: si el campo ya tiene `<p>` y `<a>` no lo toca; si tiene `<p>` pero sin `<a>` solo linkea URLs.

```bash
# Modo dry-run (por defecto) — no toca la BD, solo muestra qué cambiaría
node scripts/migrate-additionalinfo-to-html.js

# Aplicar a TODOS los artículos
node scripts/migrate-additionalinfo-to-html.js --apply

# Probar con un solo artículo (mostrar diff con contenido completo)
node scripts/migrate-additionalinfo-to-html.js --id=22093 --verbose

# Aplicar solo a un artículo
node scripts/migrate-additionalinfo-to-html.js --apply --id=22093

# Modo interactivo — confirma artículo por artículo con link al browser
node scripts/migrate-additionalinfo-to-html.js --review
node scripts/migrate-additionalinfo-to-html.js --review --base-url=http://localhost:3001

# Filtros: solo alemán / solo español / limitar cantidad
node scripts/migrate-additionalinfo-to-html.js --de-only
node scripts/migrate-additionalinfo-to-html.js --es-only
node scripts/migrate-additionalinfo-to-html.js --limit=10
```

La misma función `plainToHtmlAdditionalInfo` vive duplicada en `src/app/[locale]/dashboard/articles/translate/[id]/page.js` (usada por el editor de traducción). Si se cambia una, actualizar la otra para mantener consistencia.

## 🎨 Brand Kit

### Colores principales

**Rojo ila (primario)**
- `#BD0E0D` — color marca principal (212 usos), fondos rojo, botones primarios, accents
- `#c21f2e` — variante para emails (`lib/email.js`) y popup donation
- `#d13120` — variante en CSS legacy

**Verde (acento)**
- `#89B881` — animaciones 50 años, success states

**Neutrales (escala Tailwind)**
- `#ffffff` white — fondos cards, texto sobre rojo
- `#f3f4f6` gray-100 — fondos sutiles
- `#9ca3af` gray-400 — texto secundario
- `#6b7280` gray-500 — texto medio
- `#1f2937` gray-800 — texto principal artículos (`.article-content h2/h3/h4` lo aplican con `!important`)
- `#0a0a0a` — dark mode background

**Tailwind red-\* utilizados**
- `#dc2626` red-600 — botones, popup gradient start
- `#b91c1c` red-700 — botones hover, popup gradient end
- `#a50c0b` ≈ red-800 — sombras profundas

### Tipografías

Las tres se cargan con `next/font/local` en `src/app/[locale]/layout.tsx` y se exponen como variables CSS + clases Tailwind.

**Futura Cyrillic** — `--font-futura` / clase `font-futura`
- Uso: logo "ila", branding (caja "ila", número "50"), títulos especiales
- Archivos: `/public/fonts/FuturaCyrillic{Light,Book,Medium,Demi,Bold,ExtraBold}.ttf`
- Pesos disponibles: 300 / 400 / 500 / 600 / 700 / 800
- En SVG inline el fallback completo es: `'Futura PT', Futura, 'Jost', sans-serif`

**Geist Sans** — `--font-geist-sans` / clase `font-geist`
- Uso: tipografía body, UI general, dashboard
- Archivo: `/public/fonts/GeistVF.woff` (variable, pesos 100–900)

**Geist Mono** — `--font-geist-mono` / clase `font-mono`
- Uso: código, datos técnicos
- Archivo: `/public/fonts/GeistMonoVF.woff` (variable, pesos 100–900)

### Jerarquía tipográfica del artículo

Definida en `src/app/globals.css` (con `!important`):

| Elemento | Tamaño | Peso | Color |
|---|---|---|---|
| `.article-content h2` | 1.5rem (24px) | 700 | `#1f2937` |
| `.article-content h3` | 1.25rem (20px) | 700 | `#1f2937` |
| `.article-content h4` | 1rem (16px) | 700 | `#1f2937` claro / `#f3f4f6` oscuro |
| `.article-content a` | — | — | `#2563eb` blue-600 / hover `#1d4ed8` |

⚠️ El `color: #1f2937 !important` del `h3` puede romper banners/callouts dentro de `.article-content` — usar `<p role="heading">` para evitarlo (el `style` inline no gana al `!important`).

### Logo

Componente `<IlaLogo50 />` en `src/app/[locale]/components/IlaLogo/ilaLogo50.jsx` renderiza el wordmark "ıla" en SVG + el mapa de Latinoamérica + el "50" en blanco. Tamaños: `mini` (80px), `mobile`, `compact` (96px), `default` (168px), `large` (240px). PNGs alternativos en `/public/logo/`:
- `ila-Schriftzug_weiss.png` — wordmark "ila" blanco
- `50_Schriftzug_weiss.png` — número "50" (8-bit gray+alpha, en realidad gris oscuro; mejor usar el componente)
- `Lateinamerika_ohne_Grenzen_weiss.png` — mapa Latinoamérica blanco

### Convenciones de estilo

- **Border radius**: la marca usa rectángulos puros para identidad editorial (logo "ila" en caja blanca sin redondeo); en UI general se usa `rounded-md`/`rounded-xl`.
- **Shadows**: `shadow-sm`/`shadow-md`/`shadow-lg`/`shadow-xl` (Tailwind defaults).
- **Animaciones custom** en `tailwind.config.ts`: `ping-once`, `float-left`/`float-right`, `fadeIn`, `scaleIn`.

### Resumen rápido

```
PRIMARIO     #BD0E0D  rojo ila
SECUNDARIO   #89B881  verde 50 años
TEXT BODY    #1f2937  gray-800
WHITE        #ffffff
DARK BG      #0a0a0a

FONT MARCA   Futura Cyrillic  (logo, "ila", "50")
FONT BODY    Geist Sans       (texto, UI)
FONT MONO   Geist Mono        (código)
```

## Sistema estético de la landing (home)

Los componentes del home comparten un mismo lenguaje visual. **Nada de `font-serif` en la landing** (la serif era un fallback genérico de Tailwind, quedaba feo; el sistema de marca no la usa fuera del cuerpo del artículo). Reglas comunes:

- **Tipografía**: sans (Geist), nunca serif.
- **Rojo**: siempre el de marca `#BD0E0D` (no `text-red-600`/`red-500`). Autores en `text-[#BD0E0D]`.
- **Bordes**: `rounded-none` (rectángulos puros), `border border-gray-200 dark:border-gray-700`, hover `shadow-md` + `border-gray-300 dark:border-gray-600`.
- **Títulos de card**: `text-[17px] font-bold leading-[1.25] text-balance` + subrayado animado:
  ```
  bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500
  ```
- **Subtítulo/teaser**: `text-[13px]` (`leading-snug` / `leading-relaxed`).

Componentes alineados a este sistema: `MiniArticleCardGrid`, `AktuellesPreview`, `Events`, `ArticleCarousel`, `ArticleCarouselVer`.

### Card canónica: `MiniArticleCardGrid.js`

Es la card de referencia. Detecta la orientación de la imagen client-side (`new window.Image()`) y renderiza:
- **Vertical (portrait)** → póster a sangre: `<Image fill>` con `object-cover`, gradiente y texto superpuesto. Toda la card es un único `<ArticleLink>` overlay; el texto va `pointer-events-none` y el autor `pointer-events-auto`.
- **Horizontal / cuadrada / sin imagen** → foto arriba (`aspect-[16/10]`) + texto abajo. Badges (`relative z-10`) y footer (`relative z-10`) quedan por encima del overlay link; el autor usa `min-w-0` (no `truncate`, que recortaba el tooltip de `HoverInfo`).

### Carruseles de artículos

- **`ArticleCarousel`** (horizontal): **reusa `<MiniArticleCardGrid>` dentro de cada slide** (mismo patrón que `LatestEdition1`). Para igualar alturas en la fila usa variantes arbitrarias en la `<section>`: `[&_.slick-track]:!flex [&_.slick-slide]:!h-auto [&_.slick-slide>div]:h-full` (más `h-full` en el wrapper del slide). Slick por defecto NO estira los slides; esto replica el `items-stretch` del grid.
- **`ArticleCarouselVer`** (vertical): es un carrusel de **portadas de libros**, todas verticales con `object-contain` + `aspect-[2/3]` (no se recortan). **NO usa `MiniArticleCardGrid`** — solo se le trasladó la estética (sans, `#BD0E0D`, `rounded-none`, título con subrayado). Las alturas ya quedan parejas por ser todas portadas.
- `CarouselFromDb` enruta a uno u otro según `carousel.carouselType` (`"vertical"` → Ver).
- Ojo: `EntityBadges` ya **no** acepta `disableLinks` (ese prop quedó como no-op en las llamadas viejas de los carruseles); siempre renderiza `<Link>`. Acepta `className` que se reenvía al div raíz.

### Hero de la edición actual (`Editions/LatestEdition1.js`)

La portada del dossier actual y el botón **"Editorial und Inhalt"** (`t("editorialButton")`) forman una sola unidad:
- **Solape con z-index**: el botón es `relative z-30 order-3 -mt-6`, se solapa sobre el borde inferior de la portada (`z-20`), tapando el marco blanco y butteando contra la franja roja impresa de la revista. Al hacer hover, el `group-hover:scale-[1.02]` de la portada mete su base **por debajo** del botón → sin franja blanca antes/durante/después.
- **Ancho = franja roja**: botón `max-w-[230px] lg:max-w-[270px]` = ancho de la portada (`max-w-[240px] lg:max-w-[280px]`) menos el marco `p-[5px]` de cada lado.
- **Badges** (regiones/temas): movidos a `order-4` (debajo del botón, para que el solape no los pise) y renderizados **solo si hay regiones o temas** (si no, el div vacío comía espacio de gap y dejaba un blanco).
- Sombra de la portada suavizada (`0 6px 16px -8px rgba(0,0,0,0.25)`) y bullets indicadores de posición eliminados.
