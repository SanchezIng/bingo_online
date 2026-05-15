# Estado Actual del Proyecto

**Última actualización:** 2026-05-15 (F3.2 completada)
**Última subfase completada:** **F3.2 — Editor de patrones libres**
**Próxima subfase:** **F3.3 — Integración del motor con stores y configuración de victoria**

---

## Progreso global

- Fases completadas: 2 / 8 (F1 ✅, F2 ✅)
- Subfases completadas: 6 / 17 (F1.1 ✅, F1.2 ✅, F2.1 ✅, F2.2 ✅, F3.1 ✅, F3.2 ✅)
- Porcentaje estimado: 35%

---

## Resumen de lo construido hasta ahora

### F1.1 — Bootstrap (completada 2026-05-14)

El proyecto tiene código fuente por primera vez. Se creó el esqueleto con Vite 5 + React 18 + TypeScript 5 + Tailwind 3, con toda la tubería de calidad operativa:

- **Bundler:** Vite 5.4.21 con plugin de React y alias `@/` → `./src`
- **Tests:** Vitest 3.2.4 + React Testing Library + jsdom. 1 test verde.
- **Linter:** ESLint 9 (flat config) con typescript-eslint y plugins de React
- **Formatter:** Prettier 3.8.3 con prettier-plugin-tailwindcss
- **Hooks:** Husky 9 + lint-staged 15 + commitlint @conventional
- **CI:** `.github/workflows/ci.yml` (lint → typecheck → test → build → audit)
- **Seguridad:** `vercel.json` con 6 headers HTTP de seguridad (HSTS, CSP, X-Frame-Options, etc.)
- **pnpm config:** minimumReleaseAge 1440, blockExoticSubdeps, strictDepBuilds con allowBuilds (esbuild, @swc/core)
- **`pnpm-lock.yaml`** comiteado al repo

### F1.2 — Routing y estructura (completada 2026-05-14)

Se creó la estructura de carpetas base, el router con 3 rutas y el Layout con navegación activa:

- **react-router-dom 7.15.0** instalado
- **Estructura:** `src/core/`, `src/modo-presencial/`, `src/shared/`, `src/lib/`
- **Router:** `src/lib/router.tsx` con rutas `/`, `/cartones`, `/jugar`
- **Layout:** `src/shared/components/Layout.tsx` con header sticky, NavLink activo
- **Páginas:** `Home.tsx`, `MisCartones.tsx` (placeholder), `Jugar.tsx` (placeholder)
- **Tests:** 5 tests verdes
- **Vercel:** https://bingo-online-bice.vercel.app/ — deploy automático activo

### F2.1 — Modelo, validación y generador de cartones (completada 2026-05-15)

Módulo `src/core/cartones/` con tipos, validación Zod y funciones puras. Sin React, sin DOM, sin localStorage:

- **zod 4.4.3** instalado. **uuid 14.0.0** instalado.
- **`types.ts`:** `SerieBingo`, `NumerosCarton` (con `'FREE'` en N[2]), `NumerosCartonParcial`, `Carton`, `Result<T,E>`
- **`validacion.ts`:** schemas Zod por columna (rangos B/I/N/G/O), patrón Result, validación de duplicados, `validarNumerosCarton`, `validarCartonCompleto`
- **`generador.ts`:** `crearCartonAleatorio`, `crearCartonDesdeNumeros` (con opciones de serie/fuente), `cartonVacioPlantilla`
- **`index.ts`:** API pública re-exportando todo lo anterior
- **Tests:** 48 tests nuevos. Total: 53 tests verdes.
- **Cobertura:** `core/cartones/` → 81.81% statements, 96.15% branches, 88.88% funciones

### F2.2 — Almacenamiento, store y UI de creación manual (completada 2026-05-15)

Capa de persistencia, Zustand store y UI end-to-end para crear/listar/borrar cartones:

- **zustand 5.0.13** instalado.
- **`src/core/almacenamiento/`:** `schema.ts` (SCHEMA_VERSION, migrarSiHaceFalta), `localStorage.ts` (leer/guardar cartones+patrones+sesión, exportar/importar, Result), `index.ts` (API pública)
- **`src/lib/stores/cartones.ts`:** Zustand store con state `cartones[]` + `error`, actions `cargarCartones`, `agregarCarton`, `eliminarCarton`, `editarCarton`
- **`CartonGrid.tsx`:** grilla 5×5 con encabezados B-I-N-G-O, prop `casillasMarcadas` (para F4)
- **`FormularioCartonManual.tsx`:** 5 columnas × 5 inputs, FREE deshabilitado, validación inline, "Llenar aleatoriamente", "Guardar cartón", mobile-first (min-h 44px)
- **`CrearCartonManual.tsx`:** página que llama al formulario y redirige a `/cartones` con mensaje de éxito
- **`MisCartones.tsx`:** listado real del store, tarjetas con mini-grilla, borrado con confirmación en 2 pasos
- **Router:** nueva ruta `/cartones/nuevo`
- **Tests:** 26 tests nuevos (13 almacenamiento + 6 formulario + 7 MisCartones). Total: 79 tests verdes.
- **Cobertura:** `core/almacenamiento/` → 85.84% statements, 79.31% branches, 80% funciones (supera ≥ 70%)

### F3.1 — Motor de juego — marcado y condición de victoria (completada 2026-05-15)

Módulo `src/core/motor-juego/` con lógica pura de marcado, evaluación de condición y ranking. Sin UI, sin side-effects:

- **`types.ts`:** `CondicionVictoria` (n_marcados / patron / cartonLleno), `Patron` (grilla boolean[][]), `EstadoMarcado`, `RankingEntry`, `EstadoSesion`
- **`marcado.ts`:** `casillasMarcadasDeCartonConNumeros(carton, numerosSorteados)` — casilla FREE (2,2) siempre incluida, coordenadas `"fila,columna"` 0-indexed
- **`victoria.ts`:** `evaluarCondicion(casillasMarcadas, condicion, patrones?)` — 3 tipos de condición; patrón no encontrado retorna `{ ganado: false, faltan: Infinity }`
- **`ranking.ts`:** `calcularRanking(cartones, sorteados, condicion, patrones)` — ganadores primero, luego por `faltan` ascendente; sort estable
- **`index.ts`:** API pública del módulo
- **Tests:** 41 tests nuevos (13 marcado + 17 victoria + 11 ranking). Total: 120 tests verdes.
- **Cobertura:** `core/motor-juego/` → 100% statements, 96.29% branches, 100% funciones (supera ≥ 85%)
- **vitest.config.ts:** añadido `coverage.exclude: ['**/types.ts']` — excluye archivos de solo tipos (sin código ejecutable) del reporte de cobertura

### F3.2 — Editor de patrones libres (completada 2026-05-15)

UI para crear, listar y borrar patrones ganadores. Persistencia en localStorage:

- **`core/almacenamiento/localStorage.ts`:** `leerPatrones`/`guardarPatrones` tipadas con `Patron` (importa desde `@/core/motor-juego`). Validación estructural al leer.
- **`src/lib/stores/patrones.ts`:** Zustand store con `patrones[]` + `error`, actions `cargarPatrones`, `agregarPatron`, `eliminarPatron`, `renombrarPatron`
- **`src/modo-presencial/components/patronUtils.ts`:** función `grillaInicial()` extraída a módulo propio (evita warning de react-refresh)
- **`src/modo-presencial/components/PatronCanvas.tsx`:** grilla 5×5 táctil con modos dibujar/borrar, arrastre con onPointerDown/onPointerEnter, celda FREE [2][2] siempre activa y deshabilitada, tap targets ≥ 44px
- **`src/modo-presencial/pages/EditorPatrones.tsx`:** página única en `/patrones` con vista lista (mini-preview de cada patrón) y vista crear (inline). Validación: nombre obligatorio (max 30), al menos 2 casillas activas además del FREE
- **Router:** ruta `/patrones` añadida. **Layout:** link "Patrones" añadido (4 links en total)
- **Tests:** 19 tests nuevos (8 PatronCanvas + 11 EditorPatrones). Total: **139 tests verdes**.

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11.1.2** instalado globalmente. Configuración endurecida en `pnpm-workspace.yaml`.
- **`allowBuilds` en pnpm 11** usa formato de mapa booleano (`esbuild: true`), no lista.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2.
- **Stack frontend:** React 18 + Vite 5 + TypeScript strict + Tailwind 3 + Zustand 5 + Zod 4 + uuid 14. Tesseract.js entra en F5.
- **Node:** v24.15.0 (supera el mínimo v22 LTS, compatible).
- **react-router-dom:** versión 7.x instalada. API compatible con lo que describe la guía.
- **gitleaks:** vía `pnpm dlx gitleaks protect --staged --redact` en `.husky/pre-commit`.
- **Vercel:** https://bingo-online-bice.vercel.app/ — deploy automático activo.
- **uuid 14.0.0:** `import { v4 as uuidv4 } from 'uuid'` compatible.
- **Zod 4.x:** `z.string().uuid()` valida RFC 9562: requiere versión `[1-8]` y variante `[89ab]`. Usar UUIDs generados por `uuidv4()` en fixtures de tests (no hardcoded con todos ceros).
- **Patrón Result:** `type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }`. Definido en `core/cartones/types.ts`.
- **Zustand 5.x:** API de `create()` igual a v4 para uso básico. Importar con `import { create } from 'zustand'`.
- **Mocking de Zustand en tests:** `vi.mock('@/lib/stores/cartones')` y `vi.mocked(useCartonesStore).mockReturnValue(...)` funciona para llamadas sin selector. Mismo patrón aplica para `usePatronesStore`.
- **`leerPatrones` y `guardarPatrones`:** tipadas con `Patron[]` desde F3.2. Importan `Patron` desde `@/core/motor-juego`.
- **`leerSesion` y `guardarSesion`:** usan `unknown` como tipo provisional. Se tipará con el store de sesión en F3.3.
- **Coordenadas motor-juego:** `"fila,columna"` 0-indexed. B→col0, I→col1, N→col2, G→col3, O→col4. FREE en `"2,2"`.
- **`evaluarCondicion` — patrón no encontrado:** retorna `{ ganado: false, faltan: Infinity }`.
- **`calcularRanking` — sort estable:** en empate de `faltan`, preserva orden del array original.
- **vitest.config.ts `coverage.exclude`:** añadido `['**/types.ts']`. Actualizar si se añaden más patrones de exclusión.
- **react-refresh/only-export-components:** no exportar funciones utilitarias desde archivos de componentes. Usar módulos separados (ej: `patronUtils.ts`).
- **PatronCanvas — grilla controlada:** el componente recibe `grilla: boolean[][]` + `onChange`. El estado se gestiona en el padre (EditorPatrones).
- **EditorPatrones — validación de grilla:** mínimo 3 casillas activas (1 FREE + 2 libres) para guardar un patrón.

---

## Issues abiertos del proyecto

### Vulnerabilidades moderadas en devDependencies

- **esbuild <=0.24.2** (GHSA-67mh-4wv8-2f99): dev server expuesto a requests externos. Solo en desarrollo.
- **vite <=6.4.1** (GHSA-4w7w-66w2-5vf9): Path Traversal en .map handling.

**Impacto:** son devDependencies, solo afectan en desarrollo local. El audit con `--audit-level=high` no las detecta.

---

## Deudas técnicas anotadas

- Migrar a Vite 6+ en el futuro para resolver las 2 vulns moderadas de esbuild y vite.
- `schema.ts`: cobertura baja (33%) en `migrarSiHaceFalta` — sin tests porque requeriría localStorage con datos de versión previa. Aceptable para v1.
- `lib/stores/cartones.ts`: cobertura baja en actions (25%) porque los tests de componentes mockean el store. Considerar tests de integración del store en F3.3.

---

## Notas para la próxima sesión de Claude Code (F3.3)

Al arrancar la sesión de **F3.3**, leer en este orden:

1. `CLAUDE.md`
2. Este archivo (`progreso/estado-actual.md`)
3. `progreso/fase-3.2.md`
4. Sección F3.3 de `docs/guia_desarrollo.md`

**Prerequisito de F3.3:** verificar que `pnpm test:run` pasa 139 tests verdes y `pnpm build` genera dist/.

**F3.3 debe:**

- Crear `src/lib/stores/sesion.ts` — store de sesión con `condicionVictoria`, `numerosSorteados`, actions y selector `rankingComputed`
- Crear `src/modo-presencial/pages/ConfiguracionJuego.tsx` — radio buttons para los 3 tipos de condición, botón "Iniciar sesión"
- Actualizar `Jugar.tsx` para mostrar la condición activa y el estado de la sesión
- Tipar `leerSesion`/`guardarSesion` con el tipo de sesión
- Tests de integración del store de sesión

---

## Bitácora rápida

| Fecha      | Evento                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas.                      |
| 2026-05-14 | F1.1 completada: bootstrap con Vite+React+TS+Tailwind, tubería de calidad operativa, 1 test verde.            |
| 2026-05-14 | F1.2 completada: react-router-dom v7, estructura de carpetas, Layout, 3 rutas, 5 tests verdes.                |
| 2026-05-15 | F2.1 completada: tipos, validación Zod, generador puro. 48 tests nuevos, cobertura 81.81%.                    |
| 2026-05-15 | F2.2 completada: almacenamiento, Zustand store, CartonGrid, formulario, MisCartones. 79 tests.                |
| 2026-05-15 | F3.1 completada: motor-juego puro (marcado, victoria, ranking). 41 tests nuevos, 120 totales.                 |
| 2026-05-15 | F3.2 completada: editor visual de patrones, PatronCanvas táctil, store Zustand. 19 tests nuevos, 139 totales. |
