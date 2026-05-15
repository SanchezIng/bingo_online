# CLAUDE.md — Bingo Digital

> **Archivo de contexto permanente para Claude Code.**
> Se lee automáticamente al abrir el proyecto.
> Contiene el resumen denso del proyecto y referencias a documentación detallada.

---

## 📌 Identidad del Proyecto

**Nombre:** Bingo Digital

**Descripción breve:** PWA (Progressive Web App) que digitaliza la experiencia del bingo. En v1 cubre el modo presencial: el jugador digitaliza sus cartones físicos (manualmente o con OCR), los marca desde el celular durante el bingo en persona, y la app calcula automáticamente cuántas casillas faltan para completar el patrón ganador.

**Tipo:** Web app (PWA) — sin backend en v1, instalable, funciona offline

**Tamaño:** Mediano (v1 acotada; el roadmap completo es mediano/grande)

**Versión activa:** v1 (modo presencial). El modo virtual con backend llega en v2.

---

## 🎯 Problema y Solución

**Problema:** En un bingo presencial, llevar varios cartones físicos a la vez es difícil. El jugador tiene que revisar cada cartón manualmente con cada número cantado, y se pierde fácilmente el "estoy cerca de ganar" hasta que es demasiado tarde.

**Solución:** El jugador digitaliza sus cartones físicos (foto o ingreso manual) en el celular. Cuando se canta un número, lo ingresa una sola vez y la app lo marca en todos los cartones automáticamente. Además, ordena los cartones por proximidad al patrón ganador en tiempo real, así el jugador sabe en qué cartón concentrarse.

**Funcionalidades principales v1:**
1. Creación manual de cartones (número por número, serie B-I-N-G-O)
2. Creación por OCR (foto del cartón → Tesseract.js detecta números → confirmación)
3. Editor visual de patrones ganadores (canvas táctil)
4. Marcador único: ingresar número sorteado y resaltar en todos los cartones
5. Ranking dinámico de cartones por proximidad al patrón
6. Historial de números sorteados en la sesión
7. PWA instalable, funciona offline, datos en localStorage

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                  Browser (PWA)                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  React + Vite + Tailwind + Zustand            │   │
│  ├──────────────────────────────────────────────┤   │
│  │  src/                                          │   │
│  │  ├── core/                                    │   │
│  │  │   ├── cartones/   (modelo + validación)    │   │
│  │  │   ├── motor-juego/ (patrones + victoria)   │   │
│  │  │   ├── ocr/         (Tesseract.js)          │   │
│  │  │   └── almacenamiento/ (localStorage)       │   │
│  │  ├── modo-presencial/ (UI específica)         │   │
│  │  └── shared/  (componentes UI reutilizables)  │   │
│  └──────────────────────────────────────────────┘   │
│           ↕                          ↕               │
│  ┌──────────────┐          ┌──────────────────┐    │
│  │ localStorage  │          │ Service Worker    │    │
│  │ (cartones,    │          │ (Workbox, offline)│    │
│  │  patrones,    │          └──────────────────┘    │
│  │  historial)   │                                   │
│  └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
        ↑
        │ (Vercel hosting, Sentry, Vercel Analytics)
```

**Reglas inviolables de arquitectura:**

- **Dominios desacoplados.** Los módulos de `core/` (cartones, motor-juego, ocr, almacenamiento) NO se importan entre sí directamente. Si necesitan colaborar, lo hacen a través de tipos y funciones puras expuestas en sus respectivos `index.ts`.
- **El motor de juego es puro.** Funciones sin estado, sin side-effects, sin localStorage adentro. Recibe datos, retorna datos. Esto lo hace 100% testeable.
- **localStorage solo se toca desde `core/almacenamiento/`.** Ningún componente lee/escribe localStorage directamente. Esto facilita migrar a Supabase en v2 cambiando solo este módulo.
- **OCR corre 100% en el navegador.** Las fotos del cartón JAMÁS salen del dispositivo. Tesseract.js procesa local.
- **Los datos del usuario son privados.** Sentry está configurado con `sendDefaultPii: false` y un `beforeSend` que descarta cualquier contenido de cartones o fotos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías | Versiones objetivo |
|------|-------------|---------------------|
| Runtime | Node.js | 22 LTS (requerido por pnpm 11) |
| Package manager | **pnpm** | 11+ |
| Framework | React | 18+ |
| Build tool | Vite | 5+ |
| Estilos | Tailwind CSS | 3+ |
| Estado global | Zustand | 4+ |
| OCR | Tesseract.js | 5+ |
| PWA | Workbox (via `vite-plugin-pwa`) | última estable |
| Tipos | TypeScript | 5+ |
| Tests | Vitest + React Testing Library | últimas estables |
| Linter | ESLint | 9+ con config plana |
| Formatter | Prettier | 3+ |
| Hooks | Husky + lint-staged | últimas estables |
| Secrets scanner | gitleaks (en pre-commit) | 8+ |
| CI | GitHub Actions | — |
| Hosting | Vercel | — |
| Errores | Sentry | última estable JS |
| Analytics | Vercel Analytics | — |

---

## 📂 Estructura del Repositorio (estado actual)

> Esta estructura **crece por fase**. Aquí está lo que existe en el commit actual.
> Cada fase de `docs/guia_desarrollo.md` declara qué carpetas y archivos nuevos introduce.

```
bingo-digital/
├── CLAUDE.md
├── README.md
├── ROADMAP.md
├── .gitignore
├── .env.example
├── .kickstart-state.json
├── docs/
│   ├── especificaciones.md
│   ├── guia_desarrollo.md
│   ├── glosario.md
│   ├── threat-model.md
│   └── adr/
│       ├── 0001-alcance-v1-sin-backend.md
│       ├── 0002-pnpm-sobre-npm.md
│       └── 0003-stack-frontend.md
└── progreso/
    └── estado-actual.md
```

> **Nota:** las carpetas `src/`, `public/`, `tests/`, `.github/`, etc. se crean en la **F1.1** (setup inicial). No existen aún.

---

## 🗂️ DÓNDE ENCONTRAR CADA COSA

### docs/especificaciones.md

| Tema | Sección |
|------|---------|
| Roles y usuarios | 2 |
| Requisitos Funcionales | 3 |
| Requisitos No Funcionales | 4 |
| Seguridad (OWASP + ampliada) | 5 |
| Restricciones y exclusiones | 6 |
| Arquitectura y modelo de datos | 7 |
| Especificaciones técnicas detalladas | 8 |
| Infraestructura y despliegue | 9 |
| Evaluación y validación | 10 |
| Cumplimiento regulatorio (v2) | 11 |

### docs/guia_desarrollo.md

| Fase | Tema |
|------|------|
| F1 | Setup del proyecto (F1.1 + F1.2) |
| F2 | Núcleo de cartones (F2.1 + F2.2) |
| F3 | Motor de juego (F3.1 + F3.2 + F3.3) |
| F4 | Modo presencial — marcador y ranking (F4.1 + F4.2 + F4.3) |
| F5 | OCR (F5.1 + F5.2 + F5.3) |
| F6 | PWA y observabilidad (F6.1 + F6.2) |
| F7 | Pulido final (sin subfases) |
| F8 | Documentación de usuario y release v1.0 |

### ROADMAP.md

Vista resumida del progreso. Consultar antes de empezar una sesión nueva.

### progreso/estado-actual.md

Snapshot del último cierre de sesión. **LEER SIEMPRE al arrancar**.

### progreso/fase-{n}.{m}.md

Handoff doc de la última subfase completada. **LEER SIEMPRE al arrancar**.

### docs/adr/

Decisiones arquitectónicas relevantes. Consultar cuando se cuestione "por qué se hizo así".

---

## 🔒 SEGURIDAD INVIOLABLE

### OWASP (nivel básico aplicable a v1 sin backend)

- **A02 (Crypto):** datos sensibles del usuario (fotos OCR) procesados solo en cliente, nunca enviados a servidor.
- **A03 (Injection):** validación estricta de input con Zod (números de cartón, nombres de patrón). React ya escapa HTML por defecto.
- **A05 (Misconfig):** headers de seguridad básicos vía `vercel.json` (HSTS, X-Content-Type-Options, X-Frame-Options, CSP).
- **A06 (Componentes vulnerables):** `pnpm audit --audit-level=high` en CI; `minimumReleaseAge: 1440` en pnpm; gitleaks en pre-commit.
- **A09 (Logging):** Sentry con `sendDefaultPii: false` y `beforeSend` que filtra contenido de cartones.

> En v2 (cuando entre Supabase + auth + pagos) se ampliará a OWASP nivel completo (A01, A04, A07, A08, A10). Ver `docs/especificaciones.md` sección 5 y `docs/threat-model.md`.

### Secrets

- `.env` NUNCA al repo (está en `.gitignore`)
- Si encuentras un secret hardcodeado: detente, reemplázalo con `import.meta.env.VITE_X`, agrégalo a `.env.example` con valor dummy
- En v1 no hay secrets reales (DSN de Sentry es público por diseño)
- Pre-commit hook con **gitleaks** bloquea commits con patrones de secrets

### Logging

- NUNCA loggear: contenido completo de un cartón (es dato del usuario), fotos del OCR, números sorteados de una sesión real
- En Sentry, el `beforeSend` debe descartar eventos cuyo `extra` o `breadcrumb` contenga `carton`, `cartones`, `ocr_image`, `numeros`
- Niveles: ERROR para crashes, WARN para fallbacks (ej: OCR falló), INFO para eventos de uso (ej: cartón creado), DEBUG solo en dev

### Dependencias

- **pnpm** con `minimumReleaseAge: 1440` (24h cooldown — bloquea ataques de zero-day en npm)
- **pnpm** con `strictDepBuilds: true` (ningún script de install corre sin allowlist)
- **pnpm** con `blockExoticSubdeps: true` (solo registros verificados)
- `pnpm-lock.yaml` comiteado al repo
- En CI: `pnpm install --frozen-lockfile` (nunca `pnpm install` a secas)
- `pnpm audit --audit-level=high` en cada PR
- Antes de añadir una librería nueva: revisar mantenimiento (último commit < 12 meses), peso, alternativas

Ver `docs/adr/0002-pnpm-sobre-npm.md` para el razonamiento completo.

---

## 🎨 Convenciones de Código

### TypeScript / React

- TypeScript estricto: `"strict": true` en `tsconfig.json`
- Sin `any` salvo justificación inline con comentario `// any-justified: <razón>`
- Componentes funcionales con hooks (nada de class components)
- Props tipadas con `interface`, no con `type` (mejor para extensión)
- Tailwind para estilos; nada de CSS-in-JS ni archivos `.module.css`
- Estado local con `useState` / `useReducer`; estado global con Zustand
- Estado del servidor: N/A en v1; en v2 se evaluará TanStack Query

### Archivos cortos

**Regla:** ningún archivo de código supera ~300 líneas. Si se acerca, divide por responsabilidad.

### Naming

- Servicios/lógica: `{dominio}.ts` (`cartones.ts`, `motor.ts`, no `handler_v2.ts`)
- Modelos/tipos: `types.ts` o `{dominio}.types.ts`
- Componentes UI: PascalCase (`Carton.tsx`, `EditorPatrones.tsx`)
- Hooks: `useXxx.ts` (`useCartones.ts`, `useMotorJuego.ts`)
- Tests: `{nombre}.test.ts` o `{nombre}.test.tsx`
- Carpetas: kebab-case (`motor-juego/`, `modo-presencial/`)

### Git

- **Conventional Commits** obligatorio (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:`, `style:`)
- Scope opcional pero recomendado: `feat(cartones):`, `fix(ocr):`
- Branch principal: `main`
- Trabajamos directo en `main` con commits frecuentes (proyecto pequeño + un solo dev)
- Tags semánticos al cerrar cada fase importante: `v0.1.0` tras F1, `v0.2.0` tras F2, etc. `v1.0.0` al cerrar F8

### Idioma

- **Documentación, UI y comentarios:** español
- **Nombres de variables, funciones, clases, archivos:** inglés (estándar de la industria)
- **Excepción permitida:** nombres del dominio del bingo en español si son intraducibles o más claros (ej: `serieBingo`, `cartonNumeros`)

---

## 🌐 Variables de Entorno

Ver `.env.example` para la lista completa. En v1 todas son **prefijo `VITE_`** (Vite solo expone al cliente las que tienen ese prefijo).

```env
# Sentry (DSN es público por diseño)
VITE_SENTRY_DSN=

# Entorno (development | preview | production)
VITE_APP_ENV=development
```

> En v2 se agregan variables de Supabase (URL pública, anon key) y Culqi (public key). Las llaves secretas viven solo en Supabase / Vercel Functions.

---

## 📈 Métricas Objetivo (v1)

| Métrica | Meta |
|---------|------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse PWA | 100 |
| Lighthouse Accessibility | ≥ 90 |
| Tiempo de marcado en N cartones | < 100 ms para 10 cartones |
| Precisión OCR (cartón nítido, buena luz) | ≥ 70% acierto por casilla |
| Cobertura de tests en `core/motor-juego/` | ≥ 80% |
| Funciona offline tras primera carga | Sí |

---

## 🚦 Estado Actual del Proyecto

Ver siempre `ROADMAP.md` y `progreso/estado-actual.md` para el estado más fresco.

**Fase activa actual:** Por iniciar — **F1.1**

---

## 💻 Comandos Útiles del Proyecto

> Estos comandos existirán a partir de F1.1. Antes de F1.1 solo hay documentación.

```bash
# Instalación inicial (una sola vez)
pnpm install --frozen-lockfile

# Desarrollo
pnpm dev                 # arranca Vite en http://localhost:5173
pnpm test                # corre tests con Vitest (modo watch)
pnpm test:run            # corre tests una sola vez (CI)
pnpm test:coverage       # corre tests con reporte de cobertura

# Calidad
pnpm lint                # ESLint
pnpm lint:fix            # ESLint con auto-fix
pnpm format              # Prettier
pnpm format:check        # Prettier (verificación, no escribe)
pnpm typecheck           # tsc --noEmit

# Build y preview
pnpm build               # build de producción a dist/
pnpm preview             # sirve dist/ localmente

# Seguridad
pnpm audit --audit-level=high   # audit de dependencias
pnpm dlx gitleaks detect        # escaneo manual de secretos

# Git hooks (Husky)
pnpm prepare             # instala hooks de Husky (corre solo después de pnpm install)
```

---

## ⛔ ARCHIVOS QUE NO TOCAR SIN AVISAR

Pedir confirmación explícita al usuario antes de modificar:

- `.github/workflows/` — pipelines de CI/CD (un cambio mal puede bloquear todos los deploys)
- `.husky/` — hooks de git (un cambio mal puede bloquear todos los commits)
- `pnpm-workspace.yaml` — configuración de seguridad de pnpm (cooldown, strictDepBuilds)
- `vercel.json` — configuración de hosting y headers de seguridad
- `pnpm-lock.yaml` — solo se modifica vía `pnpm add` / `pnpm update`, NUNCA a mano
- `vite.config.ts` (sección PWA) — tocar plugin-pwa puede romper la generación del service worker
- `docs/adr/*.md` — las decisiones ya tomadas se documentan, no se reescriben (si cambia, crear un nuevo ADR que marque al anterior como "Reemplazado")

---

## ⛔ COSAS QUE CLAUDE CODE NO DEBE HACER NUNCA

1. **No inventar requisitos.** Consultar `docs/especificaciones.md` antes de añadir features.
2. **No saltarse fases/subfases.** Respetar orden de `docs/guia_desarrollo.md`. Si una subfase parece pequeña, mejor sobrar contexto que faltar.
3. **No añadir Supabase, autenticación, ni nada de v2 en v1.** Si surge la tentación, anotar en `progreso/estado-actual.md` como "deuda técnica de v2" y seguir.
4. **No usar bibliotecas fuera del stack listado** sin consultar al usuario. Especialmente: nada de jQuery, lodash entero (solo importes puntuales), moment.js (usar Date nativo o date-fns si urge).
5. **No exponer datos del usuario en logs.** El contenido de los cartones es dato privado del usuario. Sentry lo filtra; los logs en consola también deben evitarlo.
6. **No hardcodear valores que van en `.env`.** Si surge una URL o key, pasa por `import.meta.env`.
7. **No crear estructura de carpetas para fases futuras.** La carpeta `src/modo-virtual/` no debe existir hasta v2. La carpeta `src/core/ocr/` no debe existir hasta F5.1.
8. **No tocar archivos de la lista de "no tocar sin avisar"** sin pedir confirmación.
9. **No usar `npm install` ni `yarn`.** Solo `pnpm`. Si encuentras `package-lock.json` o `yarn.lock` en el repo, es un error: borrarlos.
10. **No correr `pnpm install` sin `--frozen-lockfile` en CI.** El lockfile es contrato.
11. **No commitear sin que pasen los pre-commit hooks.** Si Husky bloquea, atender la causa, no hacer `--no-verify`.
12. **No declarar la subfase como "terminada" sin haber actualizado `progreso/estado-actual.md` y creado el handoff doc.**

---

## 🔌 Cuándo cerrar esta sesión de Claude Code

Cierra esta sesión y abre una nueva si:

- Llevas más de **~60% de tu ventana de contexto** usada
- Has completado la subfase en curso
- Necesitas cambiar de módulo/capa drásticamente
- El usuario te pide hacer algo fuera del scope de la subfase actual

**Antes de cerrar, SIEMPRE:**

1. Asegurar que los tests de la subfase pasan (`pnpm test:run`)
2. Asegurar que linter y typecheck pasan (`pnpm lint && pnpm typecheck`)
3. Hacer commit con mensaje en Conventional Commits
4. Actualizar `progreso/estado-actual.md`
5. Crear/actualizar `progreso/fase-{n}.{m}.md` (handoff doc) con: lo que se hizo, decisiones tomadas, sorpresas, qué necesita la siguiente subfase
6. Si quedan TODOs, anotarlos en el handoff doc

**Al arrancar una sesión nueva, SIEMPRE leer en este orden:**

1. `CLAUDE.md` (este archivo)
2. `progreso/estado-actual.md`
3. `progreso/fase-{n}.{m}.md` (el handoff más reciente)
4. Sección correspondiente de `docs/guia_desarrollo.md`
5. Solo después, los archivos de código que la subfase necesite ver

---

## 🆘 Cuando algo falla

**Pre-commit bloquea el commit:**

- Lee la salida con calma. Casi siempre te dice exactamente qué arreglar.
- `gitleaks` detectó algo: revisa si es un falso positivo (cadena que parece secret pero no lo es) y, si es real, **NO uses `--no-verify`**; quita el secret y rota la credencial si ya estaba en algún lado.
- `eslint`: corre `pnpm lint:fix` para auto-corregir lo que se pueda.
- `prettier`: corre `pnpm format`.

**Tests fallan tras `pnpm install`:**

- Verifica versión de Node (`node --version` debe ser 22+).
- Borra `node_modules/` y `pnpm-lock.yaml`, vuelve a `pnpm install`. (Solo en desarrollo local, nunca en CI.)
- Si persiste, revisa si la dependencia se actualizó respetando `minimumReleaseAge`.

**OCR detecta números pero la grilla queda mal:**

- Es esperado: Tesseract.js no es perfecto. Por eso el flujo OBLIGA confirmación manual con indicador de confianza.
- Revisa `core/ocr/post-process.ts` (existirá tras F5.2): puede haber regla de heurística que descarta detecciones de baja confianza muy agresivamente.

**PWA no se instala / no funciona offline:**

- Verifica que estás en HTTPS (Vercel preview o prod). En `localhost` Chrome lo permite pero Safari no.
- En DevTools → Application → Service Workers: ¿está activo? Si dice "redundant", hay error en el SW; revisar consola.
- El service worker se regenera con cada `pnpm build`. En dev (`pnpm dev`) NO hay PWA — eso es intencional.

**Sentry no captura errores:**

- Verifica que `VITE_SENTRY_DSN` está definida en `.env` local y en Vercel.
- En dev, Sentry está deshabilitado por defecto (intencional, evita ruido). Para probar, fuerza `enabled: true` temporalmente.

---

## 📞 Referencia Rápida de Contexto

**¿Qué es esto?** Una PWA para marcar cartones de bingo presencial desde el celular.

**¿Quién lo usa?** Jugadores de bingo físico, en partidas presenciales (casas de bingo, parroquias, eventos comunitarios). Sin cuentas, sin login.

**¿Cuántos usuarios concurrentes?** N/A en v1 (todo local en el dispositivo). En v2 (modo virtual) se diseñará para 50-500 jugadores por evento.

**¿Entorno de ejecución?** Navegador móvil moderno (Chrome / Safari iOS 16+) e instalado como PWA. Offline después de primera carga. Internet solo necesario para cargar la app y para Sentry/Analytics.

---

_Última actualización: 2026-05-14_
_Versión del documento: 1.0_
_Generado por project-kickstart v2.0_
