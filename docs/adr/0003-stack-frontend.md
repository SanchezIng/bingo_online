# ADR-0003: Stack frontend — React + Vite + TypeScript strict + Tailwind + Zustand

**Fecha:** 2026-05-14
**Estado:** Aceptado

---

## Contexto

Bingo Digital v1 es una **PWA sin backend**. Las decisiones del stack frontend tienen impacto en:

- Velocidad de desarrollo (el autor está aprendiendo)
- Performance percibida en móvil (objetivo Lighthouse Performance ≥ 90)
- Tamaño del bundle (objetivo: < 250 KB gzipped sin Tesseract)
- Curva de aprendizaje (autor aprendiendo React Y necesita acompañamiento de Claude Code)
- Capacidad de evolucionar hacia v2 (modo virtual con Supabase) sin reescritura
- Mantenibilidad a largo plazo (proyecto personal, sin co-mantenedores garantizados)

El stack elegido se decide aquí en bloque porque las opciones son interdependientes (ej: Vite + React combinan bien con Vitest; Tailwind combina con cualquier framework; etc.).

---

## Decisión

Stack frontend de Bingo Digital v1:

| Categoría | Elección | Versión objetivo |
|-----------|----------|------------------|
| Framework | **React** | 18.x |
| Lenguaje | **TypeScript** con `strict: true` | 5.x |
| Build tool / dev server | **Vite** | 5.x |
| Estilos | **Tailwind CSS** (sin CSS-in-JS) | 3.x |
| Estado global | **Zustand** | 4.x |
| Validación de schemas | **Zod** | 3.x |
| Routing | **react-router-dom** | 6.x |
| Tests | **Vitest** + **React Testing Library** | última estable |
| PWA | **vite-plugin-pwa** (Workbox por debajo) | última estable |
| OCR | **Tesseract.js** 5.x | 5.x |

---

## Alternativas consideradas y justificación de cada pieza

### Framework: React vs alternativas

- **React 18 (elegido):**
  - ✅ Ecosistema más grande, infinitas guías y respuestas online (importante para autor que aprende).
  - ✅ Claude Code tiene altísima familiaridad con React (genera mejor código).
  - ✅ Concurrent features (`useTransition`, Suspense) útiles para lazy-load del OCR.
  - ❌ Hidratación y reconciliación tienen overhead vs frameworks compilados (Svelte, Solid).

- **Svelte 5 (descartado):**
  - ✅ Bundle más pequeño, sin runtime overhead.
  - ❌ Ecosistema más chico; menos guías para alguien que aprende.
  - ❌ Tesseract.js y vite-plugin-pwa funcionan en Svelte, pero los ejemplos abundan menos.
  - ❌ Para v2 con Supabase, los hooks y patrones de React están más documentados.

- **Vue 3 (descartado):**
  - ✅ Curva relativamente suave, buena documentación en español.
  - ❌ Claude Code es marginalmente menos preciso con Vue que con React (anecdóticamente).
  - ❌ El autor mencionó explícitamente "aprendiendo React" → respetar esa intención.

- **SolidJS (descartado):**
  - ✅ Performance excelente, modelo reactivo claro.
  - ❌ Ecosistema chico; arriesgado para proyecto que también incluye OCR + PWA.

**Por qué no React 19:** al momento de esta decisión, React 19 está estable pero algunas librerías clave aún se están adaptando. React 18 es la opción más conservadora con cero downside relevante. Se evaluará migrar a React 19 en v1.5 cuando todo el ecosistema esté listo.

### Build tool: Vite vs alternativas

- **Vite 5 (elegido):**
  - ✅ Dev server arranca en < 1 segundo.
  - ✅ HMR rápido (esencial para feedback rápido aprendiendo).
  - ✅ `vite-plugin-pwa` es el plugin más maduro para Workbox.
  - ✅ Vitest está integrado naturalmente (mismo runtime).
  - ✅ Bundle de producción optimizado por defecto (Rollup por debajo).

- **Next.js (descartado):**
  - ✅ Más features (SSR, ISR, file-based routing).
  - ❌ Overkill para una PWA sin backend; SSR no aporta nada cuando no hay servidor.
  - ❌ App Router tiene más conceptos que el autor debería aprender prematuramente.
  - ❌ Bundle más grande para algo que no necesita SSR.
  - ✅ Sería razonable en v2 si los requisitos de SEO o SSR aparecen, pero hoy no.

- **Create React App (descartado):**
  - ❌ Oficialmente deprecado (2023). No se considera.

- **Parcel / esbuild puro (descartado):**
  - ✅ Bundle muy pequeño.
  - ❌ Ecosistema de plugins menor; el plugin de PWA es menos maduro.

### Lenguaje: TypeScript strict

- **TypeScript con `strict: true` (elegido):**
  - ✅ Tipos estrictos detectan errores en compile-time (especialmente útil cuando se aprende).
  - ✅ El motor de juego (algorítmico, con tipos como `Set<string>` y uniones discriminadas) gana mucho con tipos.
  - ✅ Claude Code produce mejor código TypeScript que JavaScript (menos errores).
  - ❌ Curva inicial mayor que JS plano.

- **JavaScript plano (descartado):**
  - ❌ Más rápido para empezar, pero más caro de mantener.
  - ❌ Refactors masivos sin tipos son arriesgados para un autor que aprende.

### Estilos: Tailwind CSS

- **Tailwind 3 (elegido):**
  - ✅ Utility-first reduce el bikeshedding (no hay que inventar nombres de clases).
  - ✅ Mobile-first incorporado en cada utility.
  - ✅ Excelente integración con Vite (PostCSS plugin oficial).
  - ✅ Prettier-plugin-tailwindcss ordena clases automáticamente.
  - ✅ No genera CSS no usado en producción (purga).
  - ✅ Tap-targets y responsive design intuitivos para móvil-first.

- **CSS Modules (descartado):**
  - ✅ Más cercano a CSS estándar.
  - ❌ Hay que mantener archivos `.module.css` por componente; más fricción.

- **Styled-components / Emotion (descartado):**
  - ❌ CSS-in-JS añade peso al bundle y runtime.
  - ❌ Anti-patrón en proyectos donde el bundle importa (PWA móvil).

- **Vanilla CSS (descartado):**
  - ❌ Sin nombrado de clases sistemático, se vuelve caótico rápido.

### Estado global: Zustand

- **Zustand 4 (elegido):**
  - ✅ API minimalista: un solo concepto (store con `create()`).
  - ✅ Bundle muy pequeño (~1 KB gzipped).
  - ✅ Sin Provider boilerplate (a diferencia de Context API o Redux).
  - ✅ Selectores con `shallow` permiten optimización fácil.
  - ✅ Persistencia con middleware (no la usamos por elegir control manual de localStorage, pero buena saber que está).
  - ✅ Súper testeable (los stores son objetos simples).

- **Redux Toolkit (descartado):**
  - ❌ Boilerplate excesivo para un proyecto de este tamaño.
  - ❌ Curva de aprendizaje innecesaria.

- **Context API (descartado):**
  - ❌ Re-renderiza todo el subárbol con cada cambio (problemático para nuestro ranking que se recalcula seguido).

- **Jotai (descartado):**
  - ✅ Modelo atómico interesante.
  - ❌ Menos popular que Zustand; menos respuestas online.

### Validación: Zod

- **Zod 3 (elegido):**
  - ✅ Inferencia de tipos perfecta: defino un schema y TS me da el tipo.
  - ✅ API ergonómica.
  - ✅ Excelente para validar:
    - Inputs de formularios (cartón manual)
    - Resultados de OCR (números detectados deben ser 1-75)
    - Datos importados desde JSON

- **Yup (descartado):** menos inferencia de tipos, API menos elegante.
- **Joi (descartado):** orientado a Node.js, no encaja tan bien en frontend.

### Routing: react-router-dom

- **react-router-dom v6 (elegido):**
  - ✅ Estándar de facto en React SPAs.
  - ✅ `createBrowserRouter` con loaders preparado para crecer.
  - ✅ Mucha documentación.

- **TanStack Router (descartado):**
  - ✅ Type-safe router.
  - ❌ Más nuevo, ecosistema más chico, autor está aprendiendo cosas más fundamentales primero.

### Tests: Vitest + React Testing Library

- **Vitest (elegido):**
  - ✅ Mismo runtime que Vite (rápido, sin configuración duplicada).
  - ✅ API compatible con Jest (mucha documentación reutilizable).
  - ✅ Watch mode rápido.

- **Jest (descartado):**
  - ❌ Requiere configuración propia que duplica a Vite.
  - ❌ Más lento.

- **React Testing Library:** estándar de facto, no hay alternativa razonable.

- **E2E tests:** NO se incluyen en v1. Playwright es excelente y se evaluará en v1.5 si crece la base de tests.

### PWA: vite-plugin-pwa

- **vite-plugin-pwa (elegido):** plugin más maduro y mantenido para Vite. Genera manifest y service worker con Workbox por debajo. No hay alternativa razonable en el ecosistema Vite.

### OCR: Tesseract.js

- **Tesseract.js 5 (elegido):**
  - ✅ OCR client-side (cumple RNF-11: fotos no salen del dispositivo).
  - ✅ Web Worker incorporado (no bloquea UI).
  - ✅ Whitelist de caracteres permite restringir a dígitos solamente (mucho más preciso para nuestro caso).
  - ❌ Pesa ~2 MB (modelos + worker). Mitigación: lazy-load.

- **API externa (Google Vision, AWS Textract) (descartado):**
  - ❌ Viola privacidad: las fotos del usuario saldrían del dispositivo.
  - ❌ Costo recurrente.

- **OCR.space / otros free tiers (descartado):**
  - ❌ Misma violación de privacidad.

---

## Lo que NO está en el stack y por qué

| No incluido | Razón |
|-------------|-------|
| **TanStack Query / SWR** | No hay servidor en v1. Se evaluará en v2. |
| **i18n (react-intl, react-i18next)** | v1 solo en español. v1.5+ si surge demanda. |
| **Framer Motion** | Las animaciones simples se hacen con `transition` de Tailwind. Framer Motion solo si una animación específica lo justifica (no es el caso en v1). |
| **Sentry Performance / Replays** | Se evaluarán en v1.5+. En v1, Sentry solo captura errores (lo más valioso). |
| **PostHog / Mixpanel** | Vercel Analytics cubre el caso básico sin cookies. |
| **Storybook** | Overkill para un proyecto de un autor; los tests visuales son las páginas mismas. |
| **shadcn/ui** | Bonito, pero añade complejidad de copy-paste de componentes que el autor todavía no necesita. Tailwind solo es suficiente para v1. |

---

## Consecuencias

### Positivas

- Curva de aprendizaje contenida: React + Tailwind + Zustand son las 3 piezas a dominar. Las demás son utilidades sin curva (Vite "just works", Zod es declarativo, etc.).
- Bundle inicial esperado < 250 KB gzipped (sin Tesseract, que es lazy).
- Stack 100% compatible entre sí, sin chocheras de versiones.
- Ecosistema enorme: cualquier pregunta tiene respuesta a 1 búsqueda.
- En v2 se añade Supabase Client (~30 KB gz) y TanStack Query si decidimos usar fetching declarativo. Cero re-trabajo del resto del stack.

### Negativas

- Si en el futuro queremos SSR/SEO, hay que migrar a Next.js (re-trabajo significativo). Decisión consciente: Bingo Digital no necesita SEO en v1 ni v2 (es app de uso interno por jugadores).
- React tiene runtime overhead frente a Svelte/Solid. En móviles muy bajos podría notarse. Mitigación: memoización agresiva en `Carton` y `Ranking`.

### Riesgos

- **Riesgo: React 19 introduce breaking changes que afecten el código.** Mitigación: estamos en React 18 LTS; migración cuando v1.5 sea apropiada.
- **Riesgo: Vite 6 sale y rompe plugins.** Mitigación: estamos en Vite 5 estable; actualizaciones de major se evalúan caso por caso con cooldown del lockfile.

---

## Referencias

- React 18 docs: https://react.dev
- Vite docs: https://vitejs.dev
- Tailwind docs: https://tailwindcss.com
- Zustand docs: https://docs.pmnd.rs/zustand
- Zod docs: https://zod.dev
- vite-plugin-pwa: https://vite-pwa-org.netlify.app
- Tesseract.js: https://tesseract.projectnaptha.com
- `docs/especificaciones.md` sección 8.1
- `CLAUDE.md` sección "Stack Tecnológico"
