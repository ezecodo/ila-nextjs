# ila — Das Lateinamerika-Magazin

Plataforma web oficial de **ila** (*Informationsstelle Lateinamerika*), una revista alemana especializada en América Latina publicada desde 1975. El sitio sirve como archivo digital de más de 40 años de publicaciones, canal de noticias y eventos, y sistema de gestión editorial interno.

---

## Origen del proyecto

El core de este proyecto fue la **migración completa desde Drupal 7**, el sistema anterior de la revista. Se migraron más de **2.000 artículos** con todo su contenido, imágenes, metadatos, autores y estructura de ediciones hacia la nueva base de datos MySQL/Prisma. La nueva plataforma reemplaza completamente al CMS anterior y añade gestión editorial propia, soporte bilingüe nativo y una infraestructura de storage y deploy modernizada.

---

## Funcionalidades principales

### Sitio público
- **Archivo de dossiers** — todas las ediciones de la revista con sus artículos, accesibles por número de edición o búsqueda
- **Artículos online** — contenido exclusivo digital, independiente de las ediciones impresas
- **Aktuelles** — noticias y novedades de la redacción
- **Eventos** — agenda de eventos relacionados con América Latina
- **Búsqueda** — búsqueda full-text con filtros por región, temática, tipo de artículo y año
- **Mapa** — visualización geográfica de artículos por país/región
- **Registro y suscripción** — gestión de suscripciones ABO y pedidos de ejemplares individuales
- **Bilingüe** — todo el contenido disponible en alemán (DE) y español (ES)

### Dashboard de administración
- Gestión completa de artículos, ediciones, autores e interlocutores
- Editor de texto enriquecido (Quill) con soporte HTML
- Traducción automática DE ↔ ES vía DeepL
- Galería de imágenes por artículo con gestión de metadatos (título, alt)
- Adjuntos PDF por artículo
- Gestión de Aktuelles y Eventos
- Banners, carruseles y componentes editoriales
- Gestión de suscripciones y pedidos
- Registro de actividad del equipo editorial
- Generador de contenido para Instagram
- Panel de usuarios con roles diferenciados

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | JavaScript (src/) |
| Base de datos | MySQL via Prisma ORM |
| Autenticación | NextAuth v5 |
| i18n | next-intl (DE / ES) |
| Estilos | Tailwind CSS + CSS Modules |
| Editor | Quill.js (dynamic import) |
| Traducciones | DeepL API |
| Email | Resend |
| Storage | Servidor Hetzner (`~/ila-uploads/`) |
| Media serving | Next.js API route `/api/media/[...path]` |
| Error tracking | Sentry |
| Monitoreo | UptimeRobot (health check cada 5 min) |
| Proceso | PM2 |

---

## Estructura del proyecto

```
src/
  app/
    [locale]/          # Páginas públicas y dashboard (rutas i18n)
      dashboard/       # Panel de administración (solo admin)
      dashboard-users/ # Panel de usuarios registrados
      auth/            # Login, registro, recuperación de contraseña
    api/               # API Routes (Route Handlers de Next.js)
    components/        # Componentes reutilizables
  lib/
    prisma.js          # Cliente Prisma singleton
    localUpload.js     # Helper para subir/borrar archivos en disco
    translateDeepl.js  # Integración DeepL
    email.js           # Envío de emails con Resend
    slugify.js
  i18n/                # Configuración de next-intl
  auth.config.js       # Configuración de NextAuth
  middleware.js        # Auth + i18n middleware
messages/
  de.json              # Traducciones alemán (idioma principal)
  es.json              # Traducciones español
prisma/
  schema.prisma        # Schema de la BD
  migrations/          # Historial de migraciones
```

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| `admin` | Dashboard completo |
| `translator` | Acceso restringido a herramientas de traducción |
| `user` | Acceso restringido a área de suscriptores |

---

## Storage de archivos

Los archivos se almacenan en el servidor Hetzner fuera del repositorio, organizados en carpetas por tipo de contenido (imágenes de artículos, portadas de ediciones, PDFs públicos y privados).

Se sirven vía API route con cache de 1 año.

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# Explorar la base de datos
npx prisma studio
```

### Variables de entorno necesarias

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DEEPL_API_KEY=
RESEND_API_KEY=
SENTRY_DSN=
```

---

## Deploy en producción (Hetzner)

```bash
git pull origin main
npm install
npm run build
pm2 restart <app> && pm2 save
```

El servidor sigue activo durante el build — solo hay ~1 segundo de interrupción en el `pm2 restart`.

---

## Monitoreo

- **Health check**: `GET /api/health` — verifica conectividad con la BD
- **UptimeRobot**: monitoriza el health check cada 5 minutos con alerta por email
- **Sentry**: captura errores en cliente y servidor automáticamente
