# ila Design Context

> Documento para Claude Design / cualquier herramienta de diseño. Concentra todo lo necesario para generar mockups y propuestas visuales coherentes con la marca **ila** (revista alemana sobre Latinoamérica, 50 años).

---

## 1. Sobre el proyecto

- **Producto**: sitio + dashboard de la revista **ila** (Informationsstelle Lateinamerika), publicación alemana sobre Latinoamérica con 50 años de historia.
- **Tono**: editorial, independiente, crítico, solidario. No es un e-commerce — es una revista con suscripciones, dossiers en PDF, artículos online y un dashboard interno de redacción.
- **Idiomas**: Alemán (default) y Español. Cualquier mockup debe contemplar textos en DE y ES, los strings DE suelen ser más largos.
- **Wordmark**: se escribe `ıla` (i sin punto), nunca `ILA` en mayúsculas ni `Ila`.

---

## 2. Stack visual

- **Framework**: Next.js 15 (App Router) + React.
- **Styling**: Tailwind CSS (defaults + algunas extensiones en `tailwind.config.ts`) + CSS Modules para casos puntuales.
- **Dark mode**: soportado con la clase `dark:` de Tailwind. Toda propuesta debe verse bien en ambos modos.
- **Responsive**: patrón habitual = **móvil cards / desktop tabla** (ver `OrdersPage` como referencia).
- **Iconos**: `react-icons` (mayormente `Fa*` de Font Awesome).

---

## 3. Colores

### Primario
- `#BD0E0D` — **rojo ila** (color marca principal, ~212 usos). Fondos rojo, botones primarios, accents.
- `#c21f2e` — variante para emails y popup de donación.
- `#d13120` — variante en CSS legacy.

### Acento
- `#89B881` — verde, animaciones 50 años, success states.

### Neutrales (escala Tailwind)
- `#ffffff` white — fondos de cards, texto sobre rojo.
- `#f3f4f6` gray-100 — fondos sutiles.
- `#9ca3af` gray-400 — texto secundario.
- `#6b7280` gray-500 — texto medio.
- `#1f2937` gray-800 — texto principal artículos.
- `#0a0a0a` — dark mode background.

### Tailwind red-\* utilizados
- `#dc2626` red-600 — botones, popup gradient start.
- `#b91c1c` red-700 — botones hover, popup gradient end.
- `#a50c0b` ≈ red-800 — sombras profundas.

### Resumen rápido
```
PRIMARIO     #BD0E0D  rojo ila
SECUNDARIO   #89B881  verde 50 años
TEXT BODY    #1f2937  gray-800
WHITE        #ffffff
DARK BG      #0a0a0a
```

---

## 4. Tipografías

Las tres se cargan con `next/font/local` y se exponen como variables CSS + clases Tailwind.

### Futura Cyrillic — `--font-futura` / clase `font-futura`
- **Uso**: logo "ila", branding (caja "ila", número "50"), títulos especiales.
- **Pesos disponibles**: 300 / 400 / 500 / 600 / 700 / 800 (Light / Book / Medium / Demi / Bold / ExtraBold).
- **Fallback en SVG inline**: `'Futura PT', Futura, 'Jost', sans-serif`.

### Geist Sans — `--font-geist-sans` / clase `font-geist`
- **Uso**: tipografía body, UI general, dashboard.
- Variable, pesos 100–900.

### Geist Mono — `--font-geist-mono` / clase `font-mono`
- **Uso**: código, datos técnicos.
- Variable, pesos 100–900.

### Jerarquía tipográfica del artículo
| Elemento | Tamaño | Peso | Color |
|---|---|---|---|
| `h2` en artículo | 1.5rem (24px) | 700 | `#1f2937` |
| `h3` en artículo | 1.25rem (20px) | 700 | `#1f2937` |
| `h4` en artículo | 1rem (16px) | 700 | `#1f2937` (claro) / `#f3f4f6` (oscuro) |
| `a` en artículo | — | — | `#2563eb` blue-600 / hover `#1d4ed8` |

```
FONT MARCA   Futura Cyrillic  (logo, "ila", "50")
FONT BODY    Geist Sans       (texto, UI)
FONT MONO   Geist Mono        (código)
```

---

## 5. Logo

Componente `<IlaLogo50 />` que renderiza el wordmark `ıla` en SVG + mapa de Latinoamérica + número `50` en blanco.

- **Tamaños disponibles**: `mini` (80px), `mobile`, `compact` (96px), `default` (168px), `large` (240px).
- **PNGs alternativos** (`/public/logo/`):
  - `ila-Schriftzug_weiss.png` — wordmark "ila" blanco.
  - `50_Schriftzug_weiss.png` — número "50".
  - `Lateinamerika_ohne_Grenzen_weiss.png` — mapa Latinoamérica blanco.

---

## 6. Convenciones de estilo

- **Border radius**: la marca usa **rectángulos puros** para identidad editorial (logo "ila" en caja blanca sin redondeo); en UI general se usa `rounded-md` / `rounded-xl`.
- **Shadows**: `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl` (Tailwind defaults).
- **Animaciones custom** (en `tailwind.config.ts`):
  - `ping-once` — variante del ping de Tailwind sin loop.
  - `float-left` / `float-right` — flotación sutil.
  - `fadeIn` / `scaleIn` — entradas.
- **Gradients comunes**:
  - Botones primarios: `bg-gradient-to-r from-red-600 to-red-700` con hover `from-red-700 to-red-800`.
  - Botones export/success: `bg-gradient-to-r from-green-600 to-green-700`.

---

## 7. Patrones de UI existentes

### Modales del dashboard
Patrón estándar: overlay `bg-black/60` + card central `bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto`. Botón ✕ flotante arriba a la derecha.

### Listados con buscador
Header con título + buscador a la derecha (con icono `FaSearch`). Mobile = cards apiladas. Desktop = tabla con `bg-gray-100` en `<thead>` y filas con `hover:bg-gray-50 dark:hover:bg-gray-800`.

### Badges
Píldoras pequeñas con `px-2 py-0.5 rounded-full text-xs font-semibold` y colores temáticos:
- Rojo: contadores de items.
- Azul: direcciones / destinatarios.
- Verde: ofertas / promociones.
- Amarillo: regalos / Geschenkabo / pendiente de revisión.

### Indicador "nuevo"
Punto verde pulsante (`animate-ping` sobre `bg-green-400` + dot sólido encima `bg-green-500`). Cuando ya está procesado: punto rojo estático.

### Callouts/banners en artículos
Ejemplo: `<DonationInlineBanner />` (`src/app/[locale]/components/DonationInlineBanner/DonationInlineBanner.js`) — banner rojo dentro del flujo del artículo con CTA de donación. Es la referencia para cualquier "inline ad" o callout editorial.

⚠️ **Gotcha**: el CSS `.article-content h3 { color: #1f2937 !important }` puede teñir titulares de banners insertados dentro del artículo. Workaround: usar `<p role="heading">` en lugar de `<h3>` cuando se renderice dentro de `.article-content`.

---

## 8. Componentes reutilizables clave (referencia)

| Componente | Propósito |
|---|---|
| `<IlaLogo50 />` | Logo principal |
| `<DonationInlineBanner />` | Callout de donación en artículos |
| `<PdfReader />` | Visor flip-book de PDFs (react-pageflip) |
| `<InterviewEditor />` | Publisher rich text para artículos |
| `OrdersPage` / `SubscriptionsPage` | Patrón estándar de listado + modal del dashboard |

---

## 9. Internacionalización (al diseñar)

- DE es el idioma principal — los strings alemanes son **más largos** que los españoles. Reservar espacio para palabras compuestas tipo `Geschenkabonnement`, `Geschenkempfänger`, `Bestelldatum`.
- Cualquier mockup que incluya texto debería tener ambas versiones DE/ES o al menos contemplar la versión más larga.
- Algunos términos clave de la revista:
  - **Bestellung** = pedido de Dossier.
  - **Abo / Abonnement** = suscripción.
  - **Geschenkabo** = suscripción de regalo.
  - **Prämie** = regalo físico que recibe el abonado.
  - **Aktuelles** = sección de noticias breves.
  - **Dossier** = edición temática mensual.

---

## 10. Qué evitar

- Anglicismos en textos visibles (preferir equivalentes alemanes/españoles: "Bundle" → "Paket"/"Paquete").
- Emojis decorativos excesivos en la UI editorial (sí están permitidos en botones del dashboard, no en la parte pública editorial).
- Border radius muy redondeados en elementos de identidad de marca (el logo y la caja "ila" son rectangulares puros por decisión editorial).
- Colores que rompan la coherencia con el rojo `#BD0E0D` — cualquier acento nuevo debería coexistir con él.
