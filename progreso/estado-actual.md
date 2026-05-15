# Estado Actual del Proyecto

**Última actualización:** 2026-05-14 (F1.1 completada)
**Última subfase completada:** **F1.1 — Bootstrap del proyecto y tubería de calidad**
**Próxima subfase:** **F1.2 — Estructura de carpetas inicial, routing y deploy a Vercel**

---

## Progreso global

- Fases completadas: 0 / 8 (F1 en progreso)
- Subfases completadas: 1 / 17 (F1.1 ✅)
- Porcentaje estimado: 6%

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

La app muestra "Hello, Bingo Digital 🎯" con Tailwind. `dist/` se genera sin errores.

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11.1.2** instalado globalmente. Configuración endurecida en `pnpm-workspace.yaml`.
- **`allowBuilds` en pnpm 11** usa formato de mapa booleano (`esbuild: true`), no lista. La clave `onlyBuiltDependencies` existe pero `allowBuilds` es la que realmente habilita builds cuando `strictDepBuilds: true`.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2.
- **Stack frontend:** React 18 + Vite 5 + TypeScript strict + Tailwind 3 + Zustand + Zod + Tesseract.js. (Zustand y Zod se instalan en F2.1.)
- **Node:** v24.15.0 (supera el mínimo v22 LTS, compatible).
- **gitleaks:** configurado via framework Python `pre-commit` (`.pre-commit-config.yaml` existente). El usuario debe ejecutar `pip install pre-commit && pre-commit install` una vez para activarlo.
- **Hosting:** Vercel (free tier). Conexión se hace en F1.2.

---

## Issues abiertos del proyecto

### Vulnerabilidades moderadas en devDependencies

- **esbuild <=0.24.2** (GHSA-67mh-4wv8-2f99): dev server expuesto a requests externos. Solo en desarrollo. Corregido en >=0.24.3 (requiere vite 6+).
- **vite <=6.4.1** (GHSA-4w7w-66w2-5vf9): Path Traversal en .map handling. Corregido en >=6.4.2 (requiere migración a vite 6).

**Impacto en F1.1:** ninguno — son devDependencies, solo aplican en desarrollo local. El audit con `--audit-level=high` no las detecta (son `moderate`). Se puede migrar a Vite 6 en un momento futuro.

---

## Deudas técnicas anotadas

- Migrar a Vite 6+ cuando sea estable y las otras devDeps sean compatibles (resolver las 2 vulns moderadas de esbuild y vite).
- El `create-vite@latest` fue bloqueado por `minimumReleaseAge: 1440` durante la inicialización. Se creó el proyecto manualmente — el resultado es equivalente.

---

## Notas para la próxima sesión de Claude Code (F1.2)

Al arrancar la sesión de **F1.2**, leer en este orden:

1. `CLAUDE.md`
2. Este archivo (`progreso/estado-actual.md`)
3. `progreso/fase-1.1.md`
4. Sección F1.2 de `docs/guia_desarrollo.md`

**Prerequisito de F1.2:** verificar que `pnpm dev` abre la app en localhost:5173 y `pnpm test:run` pasa.

---

## Bitácora rápida

| Fecha      | Evento                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas.           |
| 2026-05-14 | F1.1 completada: bootstrap con Vite+React+TS+Tailwind, tubería de calidad operativa, 1 test verde. |
