# Estado Actual del Proyecto

**Última actualización:** 2026-05-15 (F2.1 completada)
**Última subfase completada:** **F2.1 — Modelo, validación y generador de cartones**
**Próxima subfase:** **F2.2 — Almacenamiento, store y UI de creación manual**

---

## Progreso global

- Fases completadas: 1 / 8 (F1 ✅)
- Subfases completadas: 3 / 17 (F1.1 ✅, F1.2 ✅, F2.1 ✅)
- Porcentaje estimado: 18%

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
- **Tests:** 48 tests nuevos (25 en validacion.test.ts, 23 en generador.test.ts). Total: 53 tests verdes.
- **Cobertura:** `core/cartones/` → 81.81% statements, 96.15% branches, 88.88% funciones (supera ≥ 80%)

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11.1.2** instalado globalmente. Configuración endurecida en `pnpm-workspace.yaml`.
- **`allowBuilds` en pnpm 11** usa formato de mapa booleano (`esbuild: true`), no lista.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2.
- **Stack frontend:** React 18 + Vite 5 + TypeScript strict + Tailwind 3 + Zustand + Zod + Tesseract.js. (Zustand se instala en F2.2.)
- **Node:** v24.15.0 (supera el mínimo v22 LTS, compatible).
- **react-router-dom:** versión 7.x instalada. API compatible con lo que describe la guía.
- **gitleaks:** vía `pnpm dlx gitleaks protect --staged --redact` en `.husky/pre-commit`.
- **Vercel:** https://bingo-online-bice.vercel.app/ — deploy automático activo.
- **uuid 14.0.0:** versión instalada por pnpm (pasó el cooldown de 24h). API `import { v4 as uuidv4 } from 'uuid'` compatible.
- **Zod 4.x:** API compatible con v3 para los casos usados (z.object, z.tuple, z.literal, .safeParse). Importar con `import { z } from 'zod'`.
- **Patrón Result:** `type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }`. Definido en `core/cartones/types.ts`.
- **`types.ts` con `/* v8 ignore file */`:** el archivo es puro TypeScript de tipos (sin código ejecutable). El comentario lo excluye del reporte de cobertura de v8.

---

## Issues abiertos del proyecto

### Vulnerabilidades moderadas en devDependencies

- **esbuild <=0.24.2** (GHSA-67mh-4wv8-2f99): dev server expuesto a requests externos. Solo en desarrollo.
- **vite <=6.4.1** (GHSA-4w7w-66w2-5vf9): Path Traversal en .map handling.

**Impacto:** son devDependencies, solo afectan en desarrollo local. El audit con `--audit-level=high` no las detecta.

---

## Deudas técnicas anotadas

- Migrar a Vite 6+ en el futuro para resolver las 2 vulns moderadas de esbuild y vite.

---

## Notas para la próxima sesión de Claude Code (F2.2)

Al arrancar la sesión de **F2.2**, leer en este orden:

1. `CLAUDE.md`
2. Este archivo (`progreso/estado-actual.md`)
3. `progreso/fase-2.1.md`
4. `docs/especificaciones.md` secciones 3.5, 7.4
5. Sección F2.2 de `docs/guia_desarrollo.md`

**Prerequisito de F2.2:** verificar que `pnpm test:run` pasa 53 tests verdes y `pnpm build` genera dist/.

---

## Bitácora rápida

| Fecha      | Evento                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas.           |
| 2026-05-14 | F1.1 completada: bootstrap con Vite+React+TS+Tailwind, tubería de calidad operativa, 1 test verde. |
| 2026-05-14 | F1.2 completada: react-router-dom v7, estructura de carpetas, Layout, 3 rutas, 5 tests verdes.     |
| 2026-05-15 | F2.1 completada: tipos, validación Zod, generador puro. 48 tests nuevos, cobertura 81.81%.         |
