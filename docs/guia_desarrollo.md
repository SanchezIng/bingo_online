# Guía de Desarrollo Incremental — Bingo Digital

## Cómo usar esta guía

Esta guía está diseñada para desarrollar **v1 de Bingo Digital** de forma incremental, una subfase a la vez, usando Claude Code como asistente.

### Reglas de oro

- **Una subfase = una sesión de Claude Code.** No intentes hacer dos subfases en la misma sesión, aunque parezcan cortas. El contexto se llena más rápido de lo que crees.
- **No saltar fases ni subfases.** El orden importa. Cada subfase asume que la anterior está completa.
- **Commit + handoff doc al final de cada subfase.** Esto NO es opcional. Es lo que permite que la siguiente sesión arranque sin perder contexto.
- **Validar la Definition of Done antes de avanzar.** Cada subfase tiene su checklist.

### Al arrancar cada sesión de Claude Code, dile literalmente:

```
Lee CLAUDE.md, progreso/estado-actual.md, y el handoff doc más reciente
en progreso/. Después lee la sección correspondiente a la subfase que
toca en docs/guia_desarrollo.md. Confirma que entendiste antes de empezar.
```

### Al cerrar cada sesión, dile a Claude Code:

```
Vamos a cerrar la sesión. Antes:
1. Asegúrate de que pnpm test:run, pnpm lint y pnpm typecheck pasan.
2. Haz commit con mensaje en Conventional Commits.
3. Actualiza progreso/estado-actual.md con el snapshot final.
4. Crea progreso/fase-X.Y.md (handoff doc) siguiendo la plantilla
   indicada en CLAUDE.md.
```

---

## Mapa General de Fases y Subfases

| Fase | Componente | Subfases | Sesiones estimadas | Acumulado |
|------|------------|----------|---------------------|-----------|
| F1 | Setup del proyecto | F1.1, F1.2 | 2 | 2 |
| F2 | Núcleo de cartones | F2.1, F2.2 | 2 | 4 |
| F3 | Motor de juego | F3.1, F3.2, F3.3 | 3 | 7 |
| F4 | Modo presencial — marcador y ranking | F4.1, F4.2, F4.3 | 3 | 10 |
| F5 | OCR | F5.1, F5.2, F5.3 | 3 | 13 |
| F6 | PWA y observabilidad | F6.1, F6.2 | 2 | 15 |
| F7 | Pulido final | sin subfases | 1 | 16 |
| F8 | Documentación de usuario y release v1.0 | sin subfases | 1 | 17 |

**Total: 17 sesiones de Claude Code ≈ 3-4 semanas a ritmo moderado.**

---

# FASE 1: Setup del proyecto

**Duración estimada:** 2-3 días
**Subfases:** 2
**Sesiones Claude Code estimadas:** 2
**Dependencia previa:** Ninguna. Es la fase inicial.

## 🎯 Objetivo de la fase

Tener el proyecto base creado, configurado y deployado a Vercel con un "Hello, Bingo Digital" funcionando. Toda la tubería de calidad (linter, tests, hooks, CI) operativa desde el día uno. Estructura de carpetas mínima y arquitectura preparada para crecer.

## 📂 Estructura que introduce esta fase

**Carpetas nuevas:**
- `src/` — código fuente
- `src/lib/` — configuración de librerías (Sentry, Zustand stores futuros)
- `src/shared/` — componentes UI reutilizables
- `public/` — assets estáticos
- `tests/` — tests globales (los tests por módulo van junto al código)
- `.github/workflows/` — GitHub Actions
- `.husky/` — hooks de Husky

**Archivos nuevos al terminar la fase:**
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`
- `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`
- `tailwind.config.js`, `postcss.config.js`
- `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `vitest.config.ts`
- `.pre-commit-config.yaml` (referencia), `.husky/pre-commit`, `.husky/commit-msg`
- `.github/workflows/ci.yml`
- `vercel.json`
- `index.html`
- `src/main.tsx`, `src/App.tsx`, `src/index.css`
- `src/lib/router.tsx`
- `src/shared/components/Layout.tsx`
- Primeros tests de placeholder

---

## SUBFASE 1.1: Bootstrap del proyecto y tubería de calidad

**Sesión Claude Code:** 1
**Capa/módulo:** Configuración y herramientas

### 🎯 Objetivo

Crear el esqueleto del proyecto con Vite + React + TypeScript + Tailwind + pnpm endurecido. Configurar ESLint, Prettier, Vitest, Husky, lint-staged, gitleaks. Configurar GitHub Actions CI. Hacer el primer deploy a Vercel con un "Hello, Bingo Digital".

### 📂 Contexto que cargar al arrancar la sesión

- `CLAUDE.md`
- `docs/especificaciones.md` (sección 8.1 Stack, sección 5.2 Secrets, sección 5.3 Dependency Security)
- `docs/adr/0002-pnpm-sobre-npm.md` (entender por qué pnpm con esa config)
- `docs/adr/0003-stack-frontend.md`
- Esta sección de la guía

### 📄 Archivos esperados al terminar

- `package.json` con todos los scripts definidos
- `pnpm-workspace.yaml` con la configuración de seguridad de pnpm
- `.npmrc` con `auto-install-peers=true` y `strict-peer-dependencies=true`
- `tsconfig.json` con `strict: true`
- `vite.config.ts` con plugin de React y alias `@/`
- `tailwind.config.js`, `postcss.config.js`, `src/index.css` con directivas Tailwind
- `eslint.config.js` (flat config), `.prettierrc`, `.prettierignore`
- `vitest.config.ts` con jsdom environment para tests de componentes
- `.husky/pre-commit` y `.husky/commit-msg` instalados y funcionales
- `lint-staged` configurado en `package.json`
- `.github/workflows/ci.yml` que corre lint + typecheck + test + build + audit
- `vercel.json` con headers de seguridad básicos
- `index.html` con metadata mínima
- `src/main.tsx`, `src/App.tsx` con "Hello, Bingo Digital" estilizado con Tailwind
- `src/App.test.tsx` con un test trivial que el CI corra y pase
- `.gitignore` (ya existe en el repo, validar que cubre `node_modules`, `dist`, `.env`, `coverage`)

### 💬 Prompt sugerido para Claude Code

```
Vamos a hacer la subfase F1.1 según docs/guia_desarrollo.md.

Objetivo: bootstrap del proyecto Bingo Digital con el stack ya definido
en docs/especificaciones.md sección 8.1, con toda la tubería de calidad
operativa desde el primer commit.

Requisitos críticos:

1. Usa **pnpm 11+** (verifica con `pnpm --version` antes; si no está, dime
   cómo instalarlo). NO uses npm ni yarn bajo ningún concepto.

2. Crea `pnpm-workspace.yaml` con esta configuración endurecida exacta:

   minimumReleaseAge: 1440
   blockExoticSubdeps: true
   strictDepBuilds: true
   allowBuilds:
     - esbuild
     - "@swc/core"

   (esto bloquea ataques de zero-day en npm como Shai-Hulud; ver
   docs/adr/0002-pnpm-sobre-npm.md)

3. Inicializa el proyecto con `pnpm create vite@latest . --template react-ts`
   (en el directorio actual, no en uno nuevo).

4. Instala y configura:
   - Tailwind CSS 3.x (con `pnpm dlx tailwindcss init -p`)
   - Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
   - ESLint 9 flat config para React + TypeScript
   - Prettier 3 con su plugin de Tailwind
   - Husky 9 + lint-staged 15
   - El paquete `commitlint` con `@commitlint/config-conventional` para validar
     mensajes de commit
   - gitleaks: NO se instala como dep de npm, sino via pre-commit hook que use
     la imagen Docker oficial o el binario; alternativamente vía el archivo
     .pre-commit-config.yaml de la herramienta `pre-commit` (Python). Pregúntame
     cuál prefiero antes de proceder.

5. Configura los scripts en `package.json` exactamente como están listados
   en CLAUDE.md sección "Comandos Útiles del Proyecto".

6. Crea `vite.config.ts` con:
   - Plugin de React
   - Alias `@` → `./src`
   - `build.sourcemap: 'hidden'` (no exponer source maps en prod)

7. Crea `tsconfig.json` con `strict: true`, `noUnusedLocals`,
   `noUnusedParameters`, `noFallthroughCasesInSwitch`, paths para el alias `@/*`.

8. Configura `.husky/pre-commit` que corra `pnpm lint-staged`.
9. Configura `.husky/commit-msg` que corra `pnpm dlx commitlint --edit $1`.
10. `lint-staged` debe correr ESLint+Prettier en *.{ts,tsx}, Prettier en
    el resto, y gitleaks en todos los archivos staged.

11. Crea `.github/workflows/ci.yml` con un job que:
    - Use `pnpm/action-setup` con versión 11 explícita
    - Use Node 22
    - Corra `pnpm install --frozen-lockfile`
    - Corra `pnpm lint`
    - Corra `pnpm typecheck`
    - Corra `pnpm test:run`
    - Corra `pnpm build`
    - Corra `pnpm audit --audit-level=high` (allow-fail con `continue-on-error: true`
      para no bloquear builds por vulns nuevas; lo veremos manualmente)

12. Crea `vercel.json` con los headers de seguridad listados en
    docs/especificaciones.md sección 5.1, regla RNF-SEC-A05-1.

13. En `src/App.tsx`, pon un "Hello, Bingo Digital 🎯" centrado en pantalla,
    estilizado con Tailwind (texto grande, color de marca a definir; usa
    `text-blue-600` por ahora como placeholder).

14. En `src/App.test.tsx`, escribe un test que verifique que el texto
    "Bingo Digital" aparece en pantalla. Usa React Testing Library.

15. Al final, haz UN solo commit con:
    `chore: bootstrap del proyecto con stack vite+react+ts y tubería de calidad`

PROCESO:
- Antes de cada `pnpm install`, dime QUÉ vas a instalar y por qué.
- Si algún comando falla, NO uses `--no-verify` ni `--force`. Diagnostícalo.
- Si dudas entre dos opciones de configuración, pregúntame antes de elegir.

Cuando termines, vamos a probar `pnpm dev`, `pnpm test:run`, `pnpm lint`,
`pnpm typecheck` y `pnpm build` juntos para validar que todo funciona.
NO conectes Vercel todavía, eso es parte de F1.2.
```

### 🧪 Cómo probar al terminar

```bash
pnpm install --frozen-lockfile    # debe instalar sin errores
pnpm dev                           # debe abrir http://localhost:5173 con "Hello, Bingo Digital"
pnpm test:run                      # debe pasar 1+ tests
pnpm lint                          # cero errores
pnpm typecheck                     # cero errores
pnpm build                         # debe generar dist/ sin errores
pnpm audit --audit-level=high     # idealmente sin vulnerabilidades altas
```

Probar un commit de prueba:

```bash
echo "// test" >> src/App.tsx
git add src/App.tsx
git commit -m "test: mensaje incorrecto"   # debe FALLAR (commitlint)
git commit -m "chore: mensaje correcto"    # debe PASAR
git checkout -- src/App.tsx                # revertir cambio
```

### ✅ Definition of Done

- [ ] `pnpm dev` levanta la app con "Hello, Bingo Digital" visible
- [ ] `pnpm test:run` pasa al menos 1 test verde
- [ ] `pnpm lint` y `pnpm typecheck` salen limpios
- [ ] `pnpm build` genera `dist/` sin errores
- [ ] `pnpm audit --audit-level=high` no reporta críticos
- [ ] Pre-commit hooks instalados (`ls .husky/` muestra `pre-commit` y `commit-msg`)
- [ ] commitlint rechaza mensajes sin convención
- [ ] gitleaks corre en pre-commit
- [ ] `.github/workflows/ci.yml` existe y tiene el job descrito
- [ ] `vercel.json` con headers de seguridad
- [ ] `pnpm-workspace.yaml` con `minimumReleaseAge`, `blockExoticSubdeps`, `strictDepBuilds`
- [ ] Commit hecho con mensaje en Conventional Commits
- [ ] `progreso/estado-actual.md` actualizado
- [ ] `progreso/fase-1.1.md` (handoff doc) creado

### ⛔ Lo que NO debes hacer en esta subfase

- No instalar Zustand todavía (es F1.2)
- No instalar Tesseract.js todavía (es F5.1)
- No instalar React Router todavía (es F1.2)
- No instalar vite-plugin-pwa todavía (es F6.1)
- No instalar Sentry todavía (es F6.2)
- No conectar a Vercel todavía (es F1.2)
- No crear las carpetas `src/core/`, `src/modo-presencial/` (las crea F2.1)
- No definir tipos de Carton, Patron, etc. (es F2.1)

### 🔜 Handoff a F1.2

Al cerrar esta sesión, crea `progreso/fase-1.1.md` con:
- Versiones exactas instaladas de cada paquete (lockfile habla, pero anota las majors)
- Decisiones tomadas (ej: cómo se instaló gitleaks)
- Sorpresas encontradas (versiones que no cuadraron, configs que requirieron ajuste)
- Qué necesita F1.2 para arrancar (mínimo: el proyecto buildea y testea)

### 💡 Tip

Si gitleaks da problemas en Windows o WSL, puedes usar la versión Docker
o instalar el binario desde el release de GitHub manualmente. Lo importante
es que **el hook se ejecute** y bloquee commits con secretos.

---

## SUBFASE 1.2: Estructura de carpetas inicial, routing y deploy a Vercel

**Sesión Claude Code:** 1
**Capa/módulo:** Estructura del proyecto + integración Vercel

### 🎯 Objetivo

Crear la estructura de carpetas inicial (`src/core/`, `src/modo-presencial/`, `src/shared/`) con archivos placeholder mínimos. Añadir React Router para navegación. Conectar el repo a Vercel y verificar deploy automático. Crear un Layout básico con header simple.

### 📂 Contexto que cargar al arrancar la sesión

- `CLAUDE.md`
- `progreso/estado-actual.md`
- `progreso/fase-1.1.md`
- `docs/especificaciones.md` sección 7.1 y 7.2 (arquitectura modular)
- Esta sección de la guía

### 📄 Archivos esperados al terminar

- `src/core/` (carpeta vacía con `.gitkeep`)
- `src/modo-presencial/`
  - `pages/Home.tsx`
  - `pages/MisCartones.tsx` (placeholder)
  - `pages/Jugar.tsx` (placeholder)
- `src/shared/components/Layout.tsx` (header + outlet)
- `src/lib/router.tsx` con configuración de React Router
- `src/App.tsx` actualizado para usar el router
- Deploy automático funcionando en Vercel

### 💬 Prompt sugerido para Claude Code

```
Vamos con la subfase F1.2. Lee CLAUDE.md, progreso/fase-1.1.md y la
sección F1.2 de docs/guia_desarrollo.md primero, después empieza.

Objetivo: crear la estructura de carpetas inicial, añadir routing y
conectar el deploy a Vercel.

Pasos:

1. Instala `react-router-dom` v6 con `pnpm add react-router-dom`.
   Recuerda que pnpm respetará el cooldown de 24h; si la versión más
   reciente fue publicada hace menos, instalará la anterior estable
   (esto está bien).

2. Crea la estructura de carpetas:
   - src/core/ (con .gitkeep para que git la trackee)
   - src/modo-presencial/pages/
   - src/modo-presencial/components/ (con .gitkeep)
   - src/modo-presencial/hooks/ (con .gitkeep)
   - src/shared/components/

3. Crea `src/lib/router.tsx` que configure las rutas:
   - /          → Home
   - /cartones  → MisCartones (placeholder)
   - /jugar     → Jugar (placeholder)
   Usa `createBrowserRouter` y `RouterProvider`.

4. Crea `src/shared/components/Layout.tsx`:
   - Header con título "🎯 Bingo Digital" a la izquierda
   - Nav con 3 links: Inicio, Mis Cartones, Jugar
   - <Outlet /> debajo
   - Diseño mobile-first con Tailwind; el header sticky-top en móvil
   - El active link se resalta (usa `NavLink` de react-router-dom)

5. Crea las páginas placeholder:
   - Home.tsx: Hero con título grande, subtítulo, dos botones (Crear cartón,
     Empezar a jugar) que llevan a /cartones y /jugar respectivamente.
   - MisCartones.tsx: solo un `<h1>Mis cartones</h1>` con un texto explicativo
     "Aquí verás tus cartones. Aún no has creado ninguno."
   - Jugar.tsx: solo un `<h1>Modo juego</h1>` con texto "Próximamente".

6. Actualiza `src/App.tsx` para que use el RouterProvider del Layout.

7. Escribe tests para:
   - Layout: verifica que renderiza los 3 links de navegación.
   - Home: verifica que renderiza los dos botones.

8. Conexión a Vercel:
   - Pregúntame por mi cuenta de Vercel (o si quiero crearla ahora).
   - Pídeme conectar el repo de GitHub a Vercel.
   - Configura el preset como Vite, build command `pnpm build`, output `dist`.
   - NO añadas variables de entorno todavía (las añadiremos en F6.2 con Sentry).
   - Verifica que el deploy automático funciona haciendo un commit y push.

9. Commit con:
   `feat: estructura inicial de carpetas, router y layout`

10. Al final: prueba `pnpm dev` y navega por las 3 rutas. Todas deben funcionar.

NOTA IMPORTANTE: NO crees archivos en src/core/cartones/, src/core/motor-juego/,
etc. todavía. Esos los crea F2.1 y F3.1. Solo necesitamos la carpeta src/core/
vacía con .gitkeep.
```

### 🧪 Cómo probar

```bash
pnpm dev
# Navega a / → ve Home con botones
# Click "Crear cartón" → /cartones
# Click el logo o "Inicio" → /
# Click "Empezar a jugar" → /jugar
# El active link debe resaltarse

pnpm test:run    # los nuevos tests deben pasar
pnpm build       # build exitoso
```

Validación Vercel:

```bash
git push origin main
# En el dashboard de Vercel: el deploy debe ejecutarse automáticamente
# El preview URL debe mostrar la app funcionando
```

### ✅ Definition of Done

- [ ] Las 3 rutas (/, /cartones, /jugar) funcionan en local
- [ ] Layout renderiza con header y links activos correctamente
- [ ] Tests nuevos pasan
- [ ] `pnpm lint && pnpm typecheck && pnpm build` salen limpios
- [ ] Repo conectado a Vercel, deploy automático funcionando
- [ ] URL pública de Vercel anotada en `progreso/estado-actual.md`
- [ ] Commit en Conventional Commits
- [ ] `progreso/fase-1.2.md` creado

### ⛔ Lo que NO debes hacer

- No definir tipos de Carton o Patron (es F2.1)
- No implementar lógica de localStorage (es F2.2)
- No añadir Zustand stores (los añade F2.1 cuando los necesite)
- No diseñar la UI definitiva; el placeholder está bien
- No comprar dominio propio (eso es decisión post-v1)

### 🔜 Handoff a F2.1

Anotar en `progreso/fase-1.2.md`:
- URL de Vercel del proyecto
- Cualquier ajuste de la configuración de Vercel
- Versión de `react-router-dom` instalada

### 💡 Tip

Al conectar Vercel, asegúrate de que el "production branch" es `main`.
Los pushes a `main` deployan a producción; los PRs generan previews.

---

# FASE 2: Núcleo de cartones

**Duración estimada:** 2-3 días
**Subfases:** 2
**Sesiones Claude Code estimadas:** 2
**Dependencia previa:** F1 completa.

## 🎯 Objetivo de la fase

Implementar el modelo de cartones con tipos TypeScript estrictos, validación con Zod, creación manual desde UI, y persistencia en localStorage. Al cerrar F2, el usuario debería poder crear un cartón manualmente, ver su lista de cartones, y que persista al recargar.

## 📂 Estructura que introduce esta fase

**Carpetas nuevas:**
- `src/core/cartones/`
- `src/core/almacenamiento/`

**Archivos nuevos:**
- `src/core/cartones/types.ts`
- `src/core/cartones/validacion.ts`
- `src/core/cartones/generador.ts`
- `src/core/cartones/index.ts`
- `src/core/cartones/*.test.ts`
- `src/core/almacenamiento/localStorage.ts`
- `src/core/almacenamiento/schema.ts`
- `src/core/almacenamiento/index.ts`
- `src/core/almacenamiento/*.test.ts`
- `src/lib/stores/cartones.ts` (Zustand store)
- `src/modo-presencial/pages/CrearCartonManual.tsx`
- `src/modo-presencial/components/CartonGrid.tsx`
- `src/modo-presencial/components/FormularioCartonManual.tsx`

---

## SUBFASE 2.1: Modelo, validación y generador de cartones

**Sesión Claude Code:** 1
**Capa/módulo:** `src/core/cartones/`

### 🎯 Objetivo

Definir tipos, validación con Zod y funciones puras para crear/validar cartones de bingo estándar. Todo testeable sin DOM. Sin UI, sin localStorage, sin Zustand.

### 📂 Contexto que cargar

- `CLAUDE.md`
- `progreso/estado-actual.md` y handoff F1.2
- `docs/especificaciones.md` secciones 3.1 (RF-01 a RF-08) y 7.3 (tipos)
- Esta sección

### 📄 Archivos esperados

- `src/core/cartones/types.ts` — tipos `SerieBingo`, `NumerosCarton`, `Carton`
- `src/core/cartones/validacion.ts` — schema Zod, función `validarNumerosCarton`
- `src/core/cartones/generador.ts` — `crearCartonVacio`, `crearCartonAleatorio`, `crearCartonDesdeNumeros`
- `src/core/cartones/index.ts` — API pública
- Tests: `validacion.test.ts`, `generador.test.ts`

### 💬 Prompt sugerido

```
Subfase F2.1. Lee CLAUDE.md, el handoff F1.2, y la sección F2.1 de
docs/guia_desarrollo.md.

Objetivo: módulo src/core/cartones/ con tipos, validación y generador.
Funciones puras, sin React, sin localStorage. Cobertura de tests ≥ 80%.

Pasos:

1. Instala Zod: `pnpm add zod` y `uuid` + `@types/uuid`.

2. Crea `src/core/cartones/types.ts` exactamente como aparece en
   docs/especificaciones.md sección 7.3. Confirma las reglas del bingo:
   - B: 1-15
   - I: 16-30
   - N: 31-45 (casilla central es 'FREE')
   - G: 46-60
   - O: 61-75
   - Sin duplicados dentro del cartón
   - El centro es 'FREE' siempre

3. Crea `src/core/cartones/validacion.ts`:
   - Schema Zod `numerosCartonSchema` que valide cada columna.
   - Función `validarNumerosCarton(numeros: unknown): Result<NumerosCarton, string[]>`.
     Usa el patrón Result (puedes definir un tipo simple
     `type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }`).
     No lances excepciones; retorna el Result.
   - Función `validarCartonCompleto(carton: unknown): Result<Carton, string[]>`.

4. Crea `src/core/cartones/generador.ts`:
   - `crearCartonAleatorio(): Carton` — genera 5 números aleatorios sin repetir
     en cada columna, dentro del rango correspondiente. La columna N tiene
     'FREE' en la posición 2 (centro).
   - `crearCartonDesdeNumeros(numeros: NumerosCarton, opciones?: { serie?: string; fuente?: ... }): Result<Carton, string[]>`
     — valida y construye un Carton con UUID nuevo.
   - `cartonVacioPlantilla()` — retorna una estructura con `null` en cada casilla,
     útil para inicializar formularios.

5. Crea `src/core/cartones/index.ts` que reexporte la API pública:
   - tipos: `Carton`, `NumerosCarton`, `SerieBingo`
   - funciones: `crearCartonAleatorio`, `crearCartonDesdeNumeros`,
     `validarNumerosCarton`, `validarCartonCompleto`, `cartonVacioPlantilla`

6. Tests exhaustivos en `validacion.test.ts` y `generador.test.ts`:
   - Cartones válidos (varios casos)
   - Cartones inválidos (número fuera de rango, duplicado, centro != FREE,
     columna con menos de 5 números, tipos incorrectos)
   - Cartón aleatorio: 100 generaciones, todas válidas, todas distintas
   - Cartón aleatorio: cada casilla en su rango correspondiente

7. NO uses `any`. Si Zod lo requiere internamente, está bien (es su tipo de
   entrada), pero la API pública debe estar tipada estrictamente.

8. Commit:
   `feat(cartones): tipos, validación zod y generador de cartones`

NOTA: estos archivos NO importan nada de React ni del DOM. Si encuentras
tentación de hacerlo, párate y consulta. La regla es: src/core/* es puro.
```

### 🧪 Cómo probar

```bash
pnpm test:run                          # todos verdes
pnpm test:coverage                     # cobertura ≥ 80% en core/cartones/
pnpm typecheck                         # cero errores
```

### ✅ Definition of Done

- [ ] Tipos definidos según especificación
- [ ] Validación con Zod, retornando Result en vez de excepciones
- [ ] Generador aleatorio produce cartones siempre válidos (100 corridas en tests)
- [ ] Cobertura `core/cartones/` ≥ 80%
- [ ] `pnpm lint && pnpm typecheck && pnpm test:run` limpios
- [ ] Commit + handoff doc + estado-actual

### ⛔ Lo que NO debes hacer

- No tocar localStorage (es F2.2)
- No crear UI (es F2.2)
- No importar React en `core/cartones/`
- No definir tipos de Patron o Motor todavía (son F3.1)

### 🔜 Handoff a F2.2

Anotar en `progreso/fase-2.1.md`:
- API pública final de `core/cartones/index.ts`
- Cualquier decisión sobre el Result pattern (si lo cambiaste por otra cosa)

---

## SUBFASE 2.2: Almacenamiento, store y UI de creación manual

**Sesión Claude Code:** 1
**Capa/módulo:** `src/core/almacenamiento/` + Zustand store + UI

### 🎯 Objetivo

Implementar la capa de persistencia en localStorage con schema versionado. Crear un Zustand store que medie entre UI y almacenamiento. Implementar la página de "Crear cartón manualmente" funcional end-to-end: el usuario llena 25 casillas, valida, guarda, y aparece en `/cartones`.

### 📂 Contexto que cargar

- `CLAUDE.md`
- `progreso/fase-2.1.md`
- `docs/especificaciones.md` secciones 3.1, 3.5, 7.4
- Esta sección

### 💬 Prompt sugerido

```
Subfase F2.2. Lee el handoff de F2.1 y esta sección.

Objetivo: persistencia en localStorage + Zustand store + UI para crear
cartón manual y listarlo. Al final el usuario crea un cartón, recarga,
y sigue ahí.

Pasos:

1. Instala Zustand: `pnpm add zustand`.

2. Crea `src/core/almacenamiento/schema.ts`:
   - Constante `SCHEMA_VERSION = '1.0'`
   - Tipos del payload que se guarda en localStorage
   - Función `migrarSiHaceFalta()` que lee `bingo:schema_version` y
     aplica migraciones (en v1 no hay migraciones; solo lee/escribe la versión)

3. Crea `src/core/almacenamiento/localStorage.ts`:
   - Funciones puras: `leerCartones()`, `guardarCartones(cartones)`,
     `leerPatrones()`, `guardarPatrones()`, `leerSesion()`, `guardarSesion()`,
     `exportarTodo()`, `importarTodo(json)`.
   - Manejo de errores: si localStorage no está disponible o lleno,
     retornan Result con error claro. NO lanzan excepciones.
   - Validación al leer: si el JSON guardado no pasa la validación de
     core/cartones, se trata como "no hay datos" y se notifica via console.warn
     (en v1; en v2 con Sentry se reportará).

4. Crea `src/core/almacenamiento/index.ts` con la API pública.

5. Tests en `localStorage.test.ts`:
   - Usa el `vi.stubGlobal('localStorage', ...)` de Vitest para mockear.
   - Casos: leer cuando vacío, guardar y leer, leer cuando datos corruptos,
     export/import roundtrip, manejo de QuotaExceededError.

6. Crea `src/lib/stores/cartones.ts` (Zustand store):
   - State: `cartones: Carton[]`, `cargando: boolean`, `error: string | null`
   - Actions: `cargarCartones()`, `agregarCarton(carton)`, `eliminarCarton(id)`,
     `editarCarton(id, cambios)`.
   - Al inicializar, llama a `cargarCartones` que lee de localStorage.
   - Cada action que modifica el estado también escribe a localStorage.

7. Crea `src/modo-presencial/components/FormularioCartonManual.tsx`:
   - 5 columnas con encabezado B-I-N-G-O
   - 5 inputs por columna; la casilla central de N está deshabilitada y dice "FREE"
   - Cada input es numérico, con `inputMode="numeric"`, validación local de rango.
   - Botón "Guardar cartón" deshabilitado hasta que todos los campos estén
     llenos y válidos.
   - Botón "Llenar aleatoriamente" que llama a `crearCartonAleatorio()` y
     llena el form.
   - Mostrar errores de validación inline (rango incorrecto, duplicado, etc.)

8. Crea `src/modo-presencial/pages/CrearCartonManual.tsx`:
   - Renderiza el formulario.
   - Al guardar exitoso, redirige a `/cartones` con mensaje de éxito.

9. Actualiza `src/modo-presencial/pages/MisCartones.tsx`:
   - Lista los cartones del store con grid de 1 columna en móvil, 2 en tablet.
   - Cada cartón se muestra como tarjeta con su número de serie (o "Cartón #N"
     si no tiene serie) y los 25 números en una mini-grilla.
   - Botón "Crear nuevo cartón" que va a `/cartones/nuevo`.
   - Si no hay cartones: mensaje "Aún no has creado ningún cartón" con CTA.
   - Cada tarjeta tiene botón "Borrar" con confirmación (modal o alert).

10. Actualiza el router en `src/lib/router.tsx` para incluir
    `/cartones/nuevo` → CrearCartonManual.

11. Crea componente reutilizable `src/modo-presencial/components/CartonGrid.tsx`
    que renderiza una grilla 5x5 dado un objeto NumerosCarton. Acepta prop
    `casillasMarcadas?: Set<number>` para futuro (en F4); por ahora solo
    muestra los números.

12. Tests:
    - FormularioCartonManual: simula llenar el form, click guardar, verifica
      que se llama agregarCarton del store.
    - MisCartones: con store inicial vacío, muestra el mensaje vacío. Con 2 cartones,
      muestra 2 tarjetas.

13. Commit:
    `feat(cartones): persistencia, store y ui de creación manual`

NOTA UX: el formulario debe ser usable en móvil. Tap-targets ≥ 44px. Los
inputs grandes y legibles.
```

### 🧪 Cómo probar

```bash
pnpm dev
# Ir a /cartones → "No has creado ningún cartón"
# Click "Crear nuevo cartón" → /cartones/nuevo
# Llenar el formulario (o click "Llenar aleatoriamente")
# Click "Guardar"
# Volver a /cartones → ver el cartón
# Recargar la página → el cartón sigue ahí
# DevTools → Application → localStorage → ver claves bingo:*

pnpm test:run     # todos verdes
pnpm test:coverage    # cobertura aceptable
```

### ✅ Definition of Done

- [ ] Crear cartón manual funciona end-to-end
- [ ] Cartones persisten al recargar
- [ ] Borrar cartón con confirmación funciona
- [ ] Tests del store y de los componentes pasan
- [ ] Cobertura `core/almacenamiento/` ≥ 70%
- [ ] `pnpm lint && pnpm typecheck && pnpm test:run` limpios
- [ ] Commit + handoff doc + estado-actual

### ⛔ Lo que NO debes hacer

- No implementar export/import como UI todavía (mueve a F7 si urge; las funciones
  internas sí existen porque las usaremos)
- No implementar OCR (es F5)
- No implementar editor de patrones (es F3.2)

---

# FASE 3: Motor de juego

**Duración estimada:** 3-4 días
**Subfases:** 3
**Sesiones Claude Code estimadas:** 3
**Dependencia previa:** F2 completa.

## 🎯 Objetivo de la fase

Implementar el motor de juego: marcado de números, condición de victoria, editor de patrones libres, cálculo de ranking por proximidad. Todo en `src/core/motor-juego/` con tests exhaustivos. UI del editor de patrones funcional.

## 📂 Estructura que introduce

- `src/core/motor-juego/`
- `src/modo-presencial/pages/EditorPatrones.tsx`
- `src/modo-presencial/components/PatronCanvas.tsx`

---

## SUBFASE 3.1: Motor de juego — marcado y condición de victoria

**Sesión Claude Code:** 1

### 🎯 Objetivo

Funciones puras para: dado un cartón y una lista de números sorteados, calcular qué casillas están marcadas, cuántas faltan para cada condición de victoria, y si hay BINGO.

### 💬 Prompt sugerido

```
Subfase F3.1. Lee CLAUDE.md, handoff F2.2, y esta sección.

Objetivo: crear src/core/motor-juego/ con la lógica pura de marcado y
condición de victoria. Sin UI. Cobertura ≥ 85%.

Pasos:

1. Crea `src/core/motor-juego/types.ts`:
   - `Patron` (ver docs/especificaciones.md sección 7.3)
   - `CondicionVictoria` (los 3 tipos: n_marcados, patron, cartonLleno)
   - `EstadoMarcado` = { casillasMarcadas: Set<string> }
     donde cada string es coordenada `"fila,columna"` (más fácil para
     serializar en Set que objetos)

2. Crea `src/core/motor-juego/marcado.ts`:
   - `casillasMarcadasDeCartonConNumeros(carton: Carton, numerosSorteados: number[]): Set<string>`
     Retorna el conjunto de coordenadas marcadas del cartón dada la lista
     de números sorteados. El centro (2,2) siempre está marcado (free space).

3. Crea `src/core/motor-juego/victoria.ts`:
   - `evaluarCondicion(casillasMarcadas: Set<string>, condicion: CondicionVictoria, patrones?: Patron[]): { ganado: boolean; faltan: number }`
     - Si tipo n_marcados: cuenta cuántas marcadas hay, faltan = condicion.valor - marcadas
     - Si tipo patron: busca el patrón por id, cuenta cuántas casillas del patrón
       están marcadas, faltan = total del patrón - marcadas
     - Si tipo cartonLleno: faltan = 24 - (marcadas - 1) (el -1 es porque el FREE
       siempre cuenta)

4. Crea `src/core/motor-juego/ranking.ts`:
   - `calcularRanking(cartones: Carton[], numerosSorteados: number[], condicion: CondicionVictoria, patrones: Patron[]): RankingEntry[]`
     donde RankingEntry = { cartonId: string; faltan: number; ganado: boolean }
     Ordenado: primero los ganados, luego por `faltan` ascendente.

5. Crea `src/core/motor-juego/index.ts` con la API pública.

6. Tests exhaustivos:
   - marcado.test.ts: cartones con varios números sorteados, verificar
     casillas marcadas exactas. Casos borde: lista vacía, número repetido,
     número que no está en ningún cartón.
   - victoria.test.ts: cada tipo de condición con cartones en distintos
     estados (no marcado, casi listo, justo en el patrón, completo).
   - ranking.test.ts: 5 cartones distintos, verificar orden correcto.
     Test con un cartón "ganador" debe ir primero. Test con todos a la misma
     distancia, orden estable.

7. Commit:
   `feat(motor): marcado, condición de victoria y ranking`

NOTAS:
- Todas las funciones son puras. Cero side-effects.
- Usa Set<string> para casillasMarcadas porque es serializable a JSON via Array.from.
- Coordenadas como "fila,columna" con 0-indexed: "0,0" es esquina superior izquierda.
```

### ✅ Definition of Done

- [ ] Las 3 condiciones de victoria funcionan
- [ ] Ranking ordena correctamente (incluso con empates)
- [ ] Cobertura `core/motor-juego/` ≥ 85%
- [ ] Lint, typecheck, tests verdes
- [ ] Commit + handoff

### ⛔ NO hacer aquí

- No tocar UI (es F3.2 y F4)
- No implementar editor de patrones (es F3.2)

---

## SUBFASE 3.2: Editor de patrones libres

**Sesión Claude Code:** 1

### 🎯 Objetivo

UI para que el usuario dibuje patrones ganadores en una grilla 5x5 táctil. Guardar/listar/eliminar patrones. Persistencia en localStorage.

### 💬 Prompt sugerido

```
Subfase F3.2. Lee handoff F3.1 y esta sección.

Objetivo: editor visual de patrones. El usuario toca/arrastra dedo sobre
una grilla 5x5 y dibuja el patrón ganador. Guarda con nombre.

Pasos:

1. En src/core/almacenamiento/, añade funciones:
   - leerPatrones(): Patron[]
   - guardarPatrones(patrones: Patron[])
   - Actualiza schema.ts para incluir patrones.

2. Crea `src/lib/stores/patrones.ts` (Zustand):
   State: patrones: Patron[]
   Actions: cargar, agregar, eliminar, renombrar.

3. Crea `src/modo-presencial/components/PatronCanvas.tsx`:
   - Grilla 5x5 con divs (NO canvas HTML real; con divs es más simple y testeable).
   - Cada celda es un botón con onPointerDown/onPointerEnter para soportar
     tap y arrastre.
   - Estado interno: matriz boolean[5][5] de celdas activas.
   - La celda central [2][2] siempre está activa (free space) y no se puede desactivar.
   - Modos: "dibujar" (activar al tocar) / "borrar" (desactivar al tocar).
     Toggle entre modos con un botón.
   - Botón "Limpiar" que resetea (excepto el centro).
   - Estilo: celda activa = bg-blue-500, inactiva = bg-gray-200, centro = bg-yellow-400.

4. Crea `src/modo-presencial/pages/EditorPatrones.tsx`:
   - Lista los patrones guardados a la izquierda (o arriba en móvil).
   - Botón "Crear nuevo patrón".
   - Al crear: muestra el PatronCanvas con un input para el nombre.
   - Botones "Guardar" y "Cancelar".
   - Validación: nombre obligatorio (max 30 chars), al menos 2 casillas
     activas además del centro.

5. Actualiza el router: añade /patrones → EditorPatrones.
   Añade link en Layout.

6. Tests:
   - PatronCanvas: simula click en celda, verifica que se activa.
     Verifica que el centro no se puede desactivar.
   - EditorPatrones: simula crear, guardar, listar, eliminar.

7. Commit:
   `feat(patrones): editor visual de patrones ganadores`

NOTA UX: el arrastre debe sentirse natural en móvil. Si encuentras problemas
con pointerEvents en iOS, alternativa: usar touchEvents nativos.
```

### ✅ Definition of Done

- [ ] Usuario puede dibujar, guardar, listar y borrar patrones
- [ ] Persisten al recargar
- [ ] Tests pasan
- [ ] Lint, typecheck verdes
- [ ] Commit + handoff

---

## SUBFASE 3.3: Integración del motor con stores y configuración de victoria

**Sesión Claude Code:** 1

### 🎯 Objetivo

Crear un store de "sesión de juego" que combine cartones + patrones + condición + números sorteados, y exponga el ranking calculado. Configuración de la condición de victoria desde la UI.

### 💬 Prompt sugerido

```
Subfase F3.3. Lee handoff F3.2 y esta sección.

Objetivo: store de sesión + página de configuración de condición de victoria.
Aún no implementamos el marcador de juego (es F4.1); solo dejamos todo listo.

Pasos:

1. Crea `src/lib/stores/sesion.ts`:
   State:
     - condicionVictoria: CondicionVictoria (default: { tipo: 'cartonLleno' })
     - numerosSorteados: number[]
     - iniciadaEn: string | null
   Actions:
     - establecerCondicion(c)
     - agregarNumeroSorteado(n)
     - deshacerUltimoNumero()
     - reiniciarSesion()
   Selectors (con shallow):
     - rankingComputed: calcula ranking on-demand desde los stores de
       cartones, patrones y sesión.

2. Crea `src/modo-presencial/pages/ConfiguracionJuego.tsx`:
   - Radio buttons para los 3 tipos de condición.
   - Si "n_marcados": input numérico con valor inicial 5.
   - Si "patron": dropdown de patrones guardados (lista desde store de patrones).
   - Si "cartonLleno": no necesita más config.
   - Botón "Iniciar sesión de juego" → llama reiniciarSesion() y va a /jugar.

3. Actualiza Jugar.tsx: por ahora solo muestra:
   - La condición activa (texto descriptivo).
   - Cuántos cartones tiene el usuario.
   - Cuántos números se han sorteado.
   - "Configura tu juego en /configurar" si no hay sesión iniciada.

4. Tests:
   - sesion.ts: cada action funciona, deshacer último número.
   - ConfiguracionJuego: cambiar entre tipos, iniciar sesión.
   - Integración: con 2 cartones y 3 números sorteados, el ranking calculado
     refleja correctamente las casillas marcadas.

5. Commit:
   `feat(sesion): store de sesión y configuración de condición de victoria`
```

### ✅ Definition of Done

- [ ] Store de sesión funcional
- [ ] Configuración de condición desde UI
- [ ] Ranking calculado correctamente integrando los 3 stores
- [ ] Tests de integración pasan
- [ ] Lint, typecheck verdes
- [ ] Commit + handoff

---

# FASE 4: Modo presencial — marcador y ranking en vivo

**Duración estimada:** 3-4 días
**Subfases:** 3

## 🎯 Objetivo de la fase

UI completa de juego: teclado para ingresar números sorteados, vista en vivo de cartones con casillas resaltadas, ranking dinámico, detección de bingo y "casi" / "muy cerca".

---

## SUBFASE 4.1: Teclado numérico y registro de números sorteados

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F4.1. Lee CLAUDE.md, handoff F3.3, y esta sección.

Objetivo: en /jugar, el usuario puede ingresar números sorteados desde un
teclado grande y verlos resaltados en sus cartones.

Pasos:

1. Crea `src/modo-presencial/components/TecladoNumerico.tsx`:
   - Grilla 5 columnas x 15 filas con números 1-75 organizados como teclado
     de bingo (B: 1-15 columna 1, I: 16-30 columna 2, etc.).
   - Cada botón ≥ 60px de alto en móvil para tap fácil.
   - Botón deshabilitado si el número ya fue sorteado (verde con check).
   - Onclick: llama agregarNumeroSorteado(n) del store sesión.
   - Botón "Deshacer último" arriba.
   - Indicador grande del último número sorteado ("Último: B-7" en grande).

2. Actualiza `src/modo-presencial/pages/Jugar.tsx`:
   - Header: condición activa + cuántos números sorteados + botón reiniciar.
   - Layout: teclado a la izquierda en desktop, abajo en móvil.
   - Lista de cartones a la derecha (o arriba en móvil) con casillas marcadas
     resaltadas. Por ahora, sin ranking aún.

3. Actualiza `CartonGrid.tsx`: acepta prop `casillasMarcadas?: Set<string>`.
   Si una casilla está marcada, fondo verde claro y texto en negrita.

4. Tests:
   - TecladoNumerico: click en un botón llama al action correcto.
     Después de hacer click, el botón se deshabilita.
   - Jugar: con cartones con números 5, 17, 33, marcar 5 → ese número aparece
     resaltado en el cartón correspondiente.

5. Commit:
   `feat(juego): teclado numérico y marcado en vivo de cartones`

UX: el teclado debe ser USABLE en una situación real de bingo (rápido, sin
errores). Considera animaciones suaves al marcar pero NO animaciones que
ralenticen el flujo.
```

### ✅ DoD

- [ ] Ingresar número marca casillas en todos los cartones donde aparezca
- [ ] Deshacer funciona
- [ ] El número aparece como sorteado en el teclado
- [ ] Tests pasan, lint/typecheck verdes
- [ ] Commit + handoff

---

## SUBFASE 4.2: Ranking dinámico de cartones

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F4.2. Lee handoff F4.1.

Objetivo: la lista de cartones en /jugar se reordena en vivo según
proximidad al patrón. El más cercano primero.

Pasos:

1. En Jugar.tsx, usa el selector `rankingComputed` del store de sesión
   para obtener el ranking ordenado.

2. Muestra cada cartón con:
   - Posición (#1, #2, etc.)
   - "Faltan N casillas" debajo
   - Si faltan == 0: badge "🏆 ¡BINGO!" en grande
   - Si faltan <= 2 y > 0: badge "🔥 MUY CERCA"
   - Si faltan <= 5 y > 2: badge "🎯 CASI"

3. Memoiza el componente `<Carton>` con React.memo. La key debe ser carton.id.

4. Cuando se marca un número nuevo, los cartones se reordenan con animación
   suave (Framer Motion NO; usa transiciones CSS simples: `transition-all
   duration-300`).

5. Tests:
   - Con cartones {A: faltan 5}, {B: faltan 2}, {C: faltan 8}: orden esperado B, A, C.
   - Al marcar un número que cambia el ranking, el orden se actualiza.

6. Commit:
   `feat(juego): ranking dinámico de cartones por proximidad al patrón`
```

### ✅ DoD

- [ ] Ranking visible y se actualiza con cada número sorteado
- [ ] Badges de "CASI" / "MUY CERCA" / "¡BINGO!" aparecen correctamente
- [ ] Tests pasan
- [ ] Lint/typecheck verdes
- [ ] Commit + handoff

---

## SUBFASE 4.3: Historial de números sorteados y reinicio de sesión

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F4.3. Lee handoff F4.2.

Objetivo: agregar componente de historial visible y permitir reiniciar
sesión con confirmación.

Pasos:

1. Crea `src/modo-presencial/components/HistorialSorteados.tsx`:
   - Lista los números sorteados agrupados por serie B/I/N/G/O.
   - Cada serie en su propia fila con título.
   - Los números en orden de aparición.
   - Botón "Ver historial" en /jugar abre un Modal con este componente
     (para no ocupar pantalla durante el juego).

2. En Jugar.tsx, añade botón "Reiniciar sesión":
   - Modal de confirmación: "¿Borrar el historial de números sorteados?
     Tus cartones y patrones se mantienen."
   - Si confirma: llama reiniciarSesion() del store.

3. Mejora: persiste el `sesion.numerosSorteados` en localStorage para que
   no se pierda al recargar accidentalmente durante un juego.
   Añade leerSesion/guardarSesion al store con un `subscribe` de Zustand.

4. Tests:
   - HistorialSorteados con [5, 18, 33, 47]: muestra "B: 5", "I: 18", etc.
   - Reiniciar sesión vacía los números sorteados.
   - Al recargar, los números sorteados siguen ahí.

5. Commit:
   `feat(juego): historial de sorteados y reinicio de sesión`
```

### ✅ DoD

- [ ] Historial visible en modal
- [ ] Reinicio con confirmación funciona
- [ ] Sesión persiste a recargas
- [ ] Tests pasan, lint/typecheck verdes
- [ ] Commit + handoff

**Al cerrar F4, tienes un juego de bingo presencial funcional end-to-end
sin OCR. Es un buen momento para tag intermedio: `v0.4.0` y probar la app
en una situación real (con un cartón inventado y números aleatorios).**

---

# FASE 5: OCR con Tesseract.js

**Duración estimada:** 4-5 días (la fase más imprevisible por la naturaleza del OCR)
**Subfases:** 3

## 🎯 Objetivo de la fase

Permitir crear cartones tomando una foto del cartón físico. Tesseract.js procesa local, el usuario corrige antes de confirmar.

---

## SUBFASE 5.1: Integración de Tesseract.js y captura de imagen

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F5.1. Lee CLAUDE.md y handoff F4.3.

Objetivo: integrar Tesseract.js, permitir subir/capturar imagen, procesar
y obtener texto bruto. Aún no estructuramos en grilla (eso es F5.2).

Pasos:

1. Instala Tesseract.js: `pnpm add tesseract.js`.
   Verifica que `tesseract.js` esté en la allowlist de pnpm
   (pnpm-workspace.yaml → allowBuilds) si requiere scripts de build.

2. Crea `src/core/ocr/types.ts`:
   - ResultadoOCRBruto = { texto: string; bloques: Array<{ texto: string;
     confianza: number; bbox: { x0, y0, x1, y1 } }> }

3. Crea `src/core/ocr/tesseract.ts`:
   - Función `procesarImagenOCR(file: File): Promise<ResultadoOCRBruto>`.
   - Crea un Worker de Tesseract con idioma 'eng' (números son los mismos en
     todos los idiomas, eng es el modelo más liviano).
   - Configura el worker para reconocer SOLO dígitos: parámetro
     `tessedit_char_whitelist: '0123456789'`.
   - Retorna texto + array de bloques con sus bboxes y confianzas.
   - Asegura `terminate()` del worker al final (libera memoria).

4. Crea `src/modo-presencial/pages/CrearCartonOCR.tsx`:
   - Input file con `accept="image/*" capture="environment"` (abre cámara
     en móvil) + alternativa de "subir archivo".
   - Preview de la imagen subida.
   - Botón "Procesar OCR" que llama al servicio.
   - Indicador de progreso (Tesseract emite eventos de progreso; usa el callback).
   - Al terminar, muestra el texto bruto detectado (todavía sin estructurar).
   - Manejo de errores: si Tesseract falla, mensaje claro al usuario.

5. Lazy-load la página para no inflar el bundle inicial:
   En el router, importa con `const CrearCartonOCR = lazy(() => import(...))`.
   Envuelve con Suspense.

6. Añade link en MisCartones: "Crear con foto (OCR)" → /cartones/foto.

7. Tests:
   - core/ocr/tesseract.ts es difícil de testear (depende de imagen real).
     Por ahora: test que verifica que la función existe y maneja un File
     inválido gracefully.
   - CrearCartonOCR: simula upload de un archivo de prueba (puede ser
     un Blob fake), verifica que el botón de procesar aparece.

8. Commit:
   `feat(ocr): integración de tesseract.js y captura de imagen`

NOTAS:
- Tesseract.js pesa ~2MB (modelos + worker). El lazy-load es CRÍTICO para
  no penalizar a usuarios que solo quieren crear cartones manuales.
- Documenta en el handoff cualquier dificultad con el worker o con CSP.
  El CSP de vercel.json puede necesitar añadir `worker-src 'self' blob:`.
```

### ✅ DoD

- [ ] Subir foto → procesar → ver texto bruto detectado
- [ ] Funciona en móvil con la cámara
- [ ] Bundle inicial NO incluye Tesseract (verificado en `pnpm build` y network tab)
- [ ] Tests básicos pasan
- [ ] Commit + handoff

---

## SUBFASE 5.2: Post-procesamiento: estructurar OCR en grilla 5x5

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F5.2. Lee handoff F5.1.

Objetivo: tomar el resultado bruto de Tesseract y producir una grilla 5x5
de candidatos con confianza. Aquí está la heurística del proyecto.

Pasos:

1. Crea `src/core/ocr/post-process.ts`:
   - Función `estructurarEnGrilla(resultado: ResultadoOCRBruto, dimensionesImagen: { w; h }): GrillaDetectada`
     donde GrillaDetectada = { celdas: Array<{ fila: number; columna: number;
       candidatos: Array<{ numero: number; confianza: 'alta'|'media'|'baja' }> }> }

   Heurística simple para v1:
   - Divide la imagen en grilla 5x5 (cada celda es 1/5 del ancho y 1/5 del alto).
   - Para cada bloque detectado, calcula su centro (cx, cy).
   - Asigna ese bloque a la celda cuyo centro contenga el centro del bloque.
   - Mapea confianza de Tesseract (0-100) a {alta: >=80, media: 50-79, baja: <50}.
   - La celda (2,2) es FREE: no se intenta detectar.
   - Para columnas, valida el rango esperado:
     - Columna 0 (B): solo acepta números 1-15
     - Columna 1 (I): 16-30
     - Columna 2 (N): 31-45
     - Columna 3 (G): 46-60
     - Columna 4 (O): 61-75
   - Si el número detectado está fuera del rango de su columna, baja la
     confianza a 'baja' o lo descarta y deja la celda vacía.

2. Función auxiliar `consolidarCandidatos(grilla: GrillaDetectada): NumerosCartonParcial`
   donde NumerosCartonParcial permite que algunas casillas sean null:
   - Toma el candidato de mayor confianza por celda.
   - Si no hay candidato, retorna null en esa casilla.

3. Tests con fixtures:
   - Crea un fixture con un resultado mock de Tesseract (no llamamos a
     Tesseract real en tests). Casos:
     - Cartón ideal: 24 números válidos en sus columnas correctas.
     - Algunas casillas vacías.
     - Números fuera de rango (deben descartarse).
     - Dos bloques en la misma celda (consolidar con el de mayor confianza).

4. Commit:
   `feat(ocr): heurística para estructurar resultado bruto en grilla 5x5`

NOTA: esta heurística es simple a propósito. En v1 priorizamos que el
usuario CORRIJA antes de confirmar (RF-22). Mejoras de heurística (alineamiento
por filas, detección de bordes con OpenCV.js) son para v1.5+.
```

### ✅ DoD

- [ ] Función `estructurarEnGrilla` con tests verdes
- [ ] Función `consolidarCandidatos` con tests verdes
- [ ] Lint, typecheck verdes
- [ ] Commit + handoff

---

## SUBFASE 5.3: UI de confirmación editable y guardado

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F5.3. Lee handoff F5.2.

Objetivo: tras procesar OCR, mostrar grilla editable con confianza visual.
El usuario corrige y confirma.

Pasos:

1. Crea `src/modo-presencial/components/RevisionOCR.tsx`:
   - Recibe prop `grilla: GrillaDetectada` y `numerosBase: NumerosCartonParcial`.
   - Muestra grilla 5x5 idéntica al CartonGrid pero cada celda es un input
     editable.
   - Borde de color por confianza:
     - alta: verde
     - media: amarillo
     - baja: rojo
     - sin candidato: gris punteado (vacío, el usuario debe llenarlo)
   - Tooltip o texto pequeño con el % de confianza.
   - Botón "Guardar cartón" deshabilitado hasta que las 25 casillas sean
     válidas (24 + FREE).
   - Botón "Volver a tomar foto".

2. Actualiza CrearCartonOCR.tsx:
   - Flujo:
     a) Captura/upload imagen → preview
     b) Botón "Procesar OCR" → llama tesseract → estructurar → mostrar
        RevisionOCR
     c) Usuario corrige → click "Guardar cartón"
     d) Validación final con `validarNumerosCarton` de core/cartones
     e) Si válido: `agregarCarton(...)` del store con fuente='ocr',
        redirigir a /cartones con mensaje "Cartón creado por OCR"
   - Si la confianza global promedio < 30%, mostrar warning sugiriendo
     reintentar con mejor luz.

3. Tests:
   - RevisionOCR: cada celda editable, cambiar valor actualiza el estado.
   - Botón guardar deshabilitado con grilla incompleta, habilitado con
     grilla completa válida.
   - Confianzas se mapean a los colores correctos.

4. Suite manual de QA: crea o consigue 5 fotos de prueba de cartones de
   bingo (puedes generar imágenes sintéticas con Canvas o usar fotos reales).
   Documenta la tasa de acierto en el handoff doc.

5. Commit:
   `feat(ocr): ui de revisión editable y guardado de cartón por ocr`
```

### ✅ DoD

- [ ] Flujo OCR end-to-end funciona en móvil
- [ ] Usuario puede corregir antes de guardar
- [ ] Indicadores de confianza visibles
- [ ] Cartón creado por OCR aparece en /cartones con fuente='ocr'
- [ ] Suite de 5 fotos probada manualmente (anotar precisión)
- [ ] Tests pasan, lint/typecheck verdes
- [ ] Commit + handoff

**Al cerrar F5, considera tag `v0.5.0`. Es el último hito antes de PWA.**

---

# FASE 6: PWA y observabilidad

**Duración estimada:** 2-3 días
**Subfases:** 2

---

## SUBFASE 6.1: Convertir a PWA con vite-plugin-pwa

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F6.1. Lee CLAUDE.md y handoff F5.3.

Objetivo: la app es instalable y funciona offline tras primera carga.

Pasos:

1. Instala vite-plugin-pwa: `pnpm add -D vite-plugin-pwa`.

2. Configura el plugin en `vite.config.ts`:
   - `registerType: 'prompt'` (avisa al usuario cuando hay nueva versión)
   - Manifest:
     - name: 'Bingo Digital'
     - short_name: 'Bingo'
     - description: 'Marca tus cartones de bingo presencial desde el celular'
     - theme_color: '#2563eb' (azul Tailwind 600)
     - background_color: '#ffffff'
     - display: 'standalone'
     - start_url: '/'
     - icons: 192x192, 512x512 (los crearemos)
   - Workbox: precaching de todos los assets generados por Vite.
     `runtimeCaching` para Tesseract.js (CDN si aplica) con estrategia
     CacheFirst.

3. Crea íconos en `public/`:
   - icon-192.png (192x192)
   - icon-512.png (512x512)
   - apple-touch-icon.png (180x180)
   - favicon.ico
   Diseño temporal: un emoji 🎯 sobre fondo azul. Puedes usar
   https://realfavicongenerator.net/ o generar con un script.

4. Crea componente `src/shared/components/PWAUpdatePrompt.tsx`:
   - Detecta cuando hay nueva versión (usa el hook de vite-plugin-pwa).
   - Muestra un toast/snackbar: "Nueva versión disponible. Recargar"
   - Botón "Recargar" llama a `updateSW()`.

5. Añade el componente en App.tsx.

6. Actualiza index.html con metadata para PWA y para iOS:
   - <meta name="apple-mobile-web-app-capable" content="yes">
   - <link rel="apple-touch-icon" href="/apple-touch-icon.png">

7. Verifica con Lighthouse:
   - Corre `pnpm build && pnpm preview`
   - Abre Chrome DevTools → Lighthouse → PWA category
   - Debe dar 100/100 PWA.

8. Pruebas manuales:
   - Abrir en Chrome móvil: debe aparecer "Añadir a pantalla de inicio".
   - Tras instalar, abrir desde el ícono: pantalla completa sin barra del navegador.
   - Activar modo avión: la app sigue funcionando, los cartones siguen ahí.

9. Commit:
   `feat(pwa): app instalable y funciona offline con vite-plugin-pwa`

NOTAS:
- En dev (`pnpm dev`) la PWA NO se activa (intencional). Solo en build.
- Si los íconos no se generan correctamente, usa íconos placeholder y
  anota en el handoff que falta mejorar el branding (es para F7 o post-v1).
```

### ✅ DoD

- [ ] App instalable en Android (Chrome)
- [ ] App instalable en iOS (Safari)
- [ ] Funciona offline tras primera carga
- [ ] Lighthouse PWA = 100
- [ ] Prompt de actualización funciona
- [ ] Commit + handoff

---

## SUBFASE 6.2: Sentry + Vercel Analytics

**Sesión Claude Code:** 1

### 💬 Prompt sugerido

```
Subfase F6.2. Lee handoff F6.1.

Objetivo: tracking de errores en producción con Sentry (filtrado de datos
privados) y métricas de uso con Vercel Analytics.

Pasos:

1. Crea cuenta gratuita en sentry.io si no tienes (te indico pasos):
   - Crear un nuevo proyecto de tipo "React".
   - Anota el DSN (es público, va en VITE_SENTRY_DSN).
   - Crea un Auth Token con scope `project:releases` para subir sourcemaps
     desde CI (no es público; va en GitHub Secrets, NO en el repo).

2. Instala Sentry: `pnpm add @sentry/react`.

3. Crea `src/lib/sentry.ts`:
   - Función `initSentry()` que:
     - Solo inicializa si VITE_SENTRY_DSN está definido Y VITE_APP_ENV !== 'development'
     - Configura `sendDefaultPii: false`
     - Configura `tracesSampleRate: 0.1` (10% de transacciones, suficiente
       para empezar dentro del plan free)
     - Configura `beforeSend(event, hint)`:
       - Examina event.extra, event.contexts, event.breadcrumbs
       - Si encuentra claves: 'carton', 'cartones', 'numeros', 'ocrImage',
         'foto', 'fotoOCR' → retorna null (descarta el evento)
       - Si las encuentra anidadas, las redacta a "[REDACTED]"
   - Llama `initSentry()` en src/main.tsx ANTES de renderizar.

4. Instala Vercel Analytics: `pnpm add @vercel/analytics`.
   En App.tsx, importa y renderiza `<Analytics />` (sin cookies por defecto).

5. Configura el ErrorBoundary global con Sentry:
   - Envuelve <App /> con `Sentry.ErrorBoundary` con fallback amigable
     ("Algo salió mal. Por favor recarga la página.") y botón de reload.

6. Actualiza .env.example:
   ```
   VITE_SENTRY_DSN=
   VITE_APP_ENV=development
   ```

7. En Vercel:
   - Añade VITE_SENTRY_DSN con el valor real (Environment: Production y Preview)
   - Añade VITE_APP_ENV con valor 'production' en Production y 'preview' en Preview

8. Configura sourcemaps en CI:
   - Crea `.github/workflows/release.yml` que en push a `main`:
     - Hace build
     - Sube sourcemaps a Sentry usando @sentry/cli o la action oficial
     - Usa SENTRY_AUTH_TOKEN desde secrets
   - (Opcional para v1, pero MUY recomendado: sin sourcemaps los stack traces
     son ilegibles porque Vite minifica).

9. Tests:
   - sentry.ts: con un mock de Sentry, verifica que beforeSend filtra eventos
     con la clave 'carton'.
   - Verifica que en development (VITE_APP_ENV=development), Sentry no se
     inicializa.

10. Prueba en preview:
    - Provoca un error intencional: añade temporalmente un botón "Probar Sentry"
      que tire `throw new Error('Test Sentry')`.
    - Despliega un preview.
    - Click el botón → verifica que el error aparece en el dashboard de Sentry.
    - Elimina el botón antes de mergear a main.

11. Commit:
    `feat(observabilidad): sentry con filtros de privacidad y vercel analytics`

NOTAS:
- El DSN es PÚBLICO por diseño (es del SDK frontend). No es un secreto.
- El Auth Token sí es secreto y NUNCA va al repo. Solo a GitHub Secrets.
- Si te confunden los términos, lee:
  https://docs.sentry.io/concepts/key-terms/dsn-explainer/
```

### ✅ DoD

- [ ] Sentry captura errores en preview/prod
- [ ] beforeSend filtra eventos con datos sensibles (test unitario lo verifica)
- [ ] Vercel Analytics activo (verificable en dashboard)
- [ ] Sourcemaps subidos a Sentry (opcional pero recomendado)
- [ ] Variables de entorno configuradas en Vercel
- [ ] `.env.example` actualizado
- [ ] Commit + handoff

---

# FASE 7: Pulido final

**Duración estimada:** 2-3 días
**Sin subfases.**

## 🎯 Objetivo

Pulir la app para release: estados vacíos cuidados, manejo de errores limpio, accesibilidad básica, performance, branding visual mínimo, export/import como UI accesible.

### 💬 Prompt sugerido

```
Fase F7. Lee CLAUDE.md, handoff F6.2 y esta sección.

Objetivo: pulido de UI/UX para release v1.0. NO añadir features nuevas;
solo refinar lo que ya existe.

Checklist:

1. Estados vacíos cuidados:
   - /cartones sin cartones: ilustración + CTA + mensaje útil.
   - /patrones sin patrones: ilustración + CTA + ejemplos rápidos.
   - /jugar sin sesión iniciada: explica qué configurar.

2. Manejo de errores:
   - Si localStorage falla: mensaje claro, ofrecer export antes de perder datos.
   - Si OCR falla: mensaje específico (luz/foco/encuadre) + retry.
   - Network error en Sentry/Analytics: silencioso, no molestar al usuario.

3. Accesibilidad:
   - Todos los inputs con `<label>` asociado.
   - Roles ARIA donde aplique (modales, alertas).
   - Navegación por teclado: tab order lógico, focus visible.
   - `aria-live` para anuncios de "¡BINGO!" y "Número sorteado: X".
   - Contraste WCAG AA mínimo (verifica con DevTools).

4. Performance:
   - React.memo en componentes pesados (Carton, RevisionOCR).
   - Lazy-load de CrearCartonOCR ya hecho en F5.1; verifica que sigue.
   - Lighthouse Performance ≥ 90 en móvil 4G.

5. Export/import como UI accesible:
   - Página /configuracion con:
     - Botón "Exportar mis datos" → descarga JSON
     - Botón "Importar datos" → seleccionar archivo JSON, validar, importar
   - Mensaje claro: "Esto sobrescribirá tus cartones y patrones actuales".

6. Branding mínimo:
   - Color de marca consistente (azul Tailwind 600 por ahora).
   - Logo simple (texto + emoji 🎯 sirve).
   - Footer con "Bingo Digital · v1.0.0 · GitHub" (link al repo).

7. Microcopy:
   - Revisa todos los textos. Español Perú/Latam neutro, claro, amable.
   - Sin jerga técnica en mensajes al usuario.

8. Tests de regresión:
   - Corre todos los tests (`pnpm test:run`).
   - Verifica manualmente los 4 caminos de la sección 10.2 de
     docs/especificaciones.md.

9. Commit (puede ser varios):
   `feat(ui): pulido de estados vacíos y mensajes`
   `feat(a11y): accesibilidad básica wcag aa`
   `perf: memoización de cartones y ranking`
   `feat(config): página de exportar/importar datos`

10. Tag intermedio: `v0.9.0` antes de F8.
```

### ✅ DoD

- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 90, PWA = 100
- [ ] Estados vacíos pulidos
- [ ] Accesibilidad básica (navegación por teclado funciona)
- [ ] Export/import desde UI accesible
- [ ] Tests pasan
- [ ] Tag `v0.9.0` creado

---

# FASE 8: Documentación de usuario y release v1.0

**Duración estimada:** 1-2 días
**Sin subfases.**

## 🎯 Objetivo

Cerrar v1.0 con README actualizado, una página /ayuda dentro de la app, y tag de release.

### 💬 Prompt sugerido

```
Fase F8. Última fase de v1.

Objetivo: documentación, release notes y tag v1.0.0.

Pasos:

1. Actualiza README.md (humano, no Claude):
   - Captura de pantalla de la app
   - URL del deploy
   - Cómo correr localmente
   - Stack
   - Estructura del proyecto
   - Cómo contribuir
   - Licencia (sugerir MIT)
   - Roadmap resumido (v1 → v1.5 → v2 → v3)

2. Crea `src/modo-presencial/pages/Ayuda.tsx`:
   - Sección "Cómo usar":
     - Crear cartones (manual y por foto)
     - Configurar tu juego
     - Jugar (ingresar números, ver ranking)
   - Sección "FAQ":
     - "¿Pierdo mis cartones si cambio de celular?" → Sí, usa export.
     - "¿Funciona sin internet?" → Sí, tras primera carga.
     - "¿Mis fotos del OCR se suben a un servidor?" → No, todo es local.
     - "¿Qué es PWA / cómo instalo la app?" → Instrucciones por OS.
   - Sección "Privacidad":
     - "No recolectamos datos personales en esta versión."
     - "Sentry recibe errores anónimos para mejorar la app."
     - "Vercel Analytics mide visitas sin cookies."

3. Añade link a /ayuda en el Layout.

4. Crea `CHANGELOG.md`:
   ```
   ## [1.0.0] - 2026-XX-XX

   Lanzamiento inicial del modo presencial.

   ### Funcionalidades
   - Creación manual de cartones
   - Creación por OCR (Tesseract.js, procesamiento local)
   - Editor de patrones libres
   - Marcador de juego con teclado numérico
   - Ranking dinámico por proximidad al patrón
   - Historial de números sorteados
   - PWA instalable y offline
   - Export/import de datos

   ### Tecnologías
   - React 18, Vite 5, TypeScript 5, Tailwind 3
   - Zustand 4, Zod, Tesseract.js 5
   - pnpm 11 (con cooldown 24h, strictDepBuilds)
   - Sentry, Vercel Analytics
   ```

5. Commit:
   `docs: readme, ayuda y changelog para release v1.0.0`

6. Tag y release:
   ```
   git tag -a v1.0.0 -m "Release v1.0.0 — Modo presencial"
   git push origin v1.0.0
   ```
   En GitHub: crea un Release apuntando a v1.0.0 con el contenido del CHANGELOG.

7. Verifica el deploy final en Vercel.

8. Actualiza ROADMAP.md marcando F1-F8 como ✅ Completadas.

9. Actualiza progreso/estado-actual.md con "Proyecto v1.0 completado".

10. 🎉 ¡FELICITACIONES! Has terminado v1.

NOTA: la siguiente versión (v1.5) son mejoras al modo presencial: modo oscuro,
sonidos, vibración háptica, export a PDF. v2 trae el modo virtual con Supabase.
Ambas requieren un nuevo project-kickstart cuando llegues allí.
```

### ✅ DoD

- [ ] README actualizado con captura, instrucciones, roadmap
- [ ] Página /ayuda dentro de la app
- [ ] CHANGELOG.md creado
- [ ] Tag `v1.0.0` creado y pusheado
- [ ] Release en GitHub publicado
- [ ] Vercel deploy verde
- [ ] ROADMAP.md actualizado
- [ ] `progreso/estado-actual.md` actualizado con cierre del proyecto

---

# CIERRE DE LA GUÍA

Al completar las 8 fases (17 subfases) tendrás:

- Una PWA completa de bingo presencial funcionando en producción
- Hospedada en Vercel con HTTPS, headers de seguridad y deploy automático
- Con tests automatizados y CI verde
- Con observabilidad (Sentry) y analytics privacy-first
- Documentación completa para humanos (README) y para Claude Code (CLAUDE.md)
- Una arquitectura modular preparada para añadir el modo virtual en v2 sin re-trabajo

## Después de v1.0

**Próximos pasos sugeridos:**

1. **Validar con usuarios reales** — comparte el link con 5-10 personas que jueguen bingo. Recoge feedback antes de empezar v1.5.
2. **v1.5 — Mejoras de UX:** modo oscuro, sonidos, vibración háptica, export a PDF, branding mejorado. 1-2 semanas.
3. **v2 — Modo virtual:** abrir un nuevo project-kickstart para diseñar el alcance, esta vez con Supabase, auth, eventos en tiempo real, pagos manuales. 4-6 semanas.
4. **v2.5 — Pagos automáticos con Culqi.** 2-3 semanas.
5. **v3 — Escala:** Yape Business, multi-moderador, app nativa con React Native compartiendo `core/`. Según demanda.

## Mantenimiento

- Actualiza dependencias mensualmente con `pnpm update --interactive`. El cooldown de 24h te protege, pero revisa CHANGELOG de cada librería que actualices.
- Revisa Sentry semanalmente. Si aparece un error recurrente, abre un issue y planifica un fix.
- Revisa Vercel Analytics mensualmente. ¿Qué pantallas son las más usadas? ¿Dónde abandonan?
