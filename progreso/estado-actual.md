# Estado Actual del Proyecto

**Última actualización:** 2026-05-14 (F1.2 completada)
**Última subfase completada:** **F1.2 — Estructura de carpetas inicial, routing y deploy a Vercel**
**Próxima subfase:** **F2.1 — Modelo, validación y generador de cartones**

---

## Progreso global

- Fases completadas: 1 / 8 (F1 ✅)
- Subfases completadas: 2 / 17 (F1.1 ✅, F1.2 ✅)
- Porcentaje estimado: 12%

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

- **react-router-dom 7.15.0** instalado (pnpm bloqueó 7.15.1 por cooldown de 24h — correcto)
- **Estructura:** `src/core/`, `src/modo-presencial/`, `src/shared/`, `src/lib/`
- **Router:** `src/lib/router.tsx` con rutas `/`, `/cartones`, `/jugar` usando `createBrowserRouter`
- **Layout:** `src/shared/components/Layout.tsx` con header sticky, NavLink activo
- **Páginas:** `Home.tsx` (hero + 2 botones CTA), `MisCartones.tsx` (placeholder), `Jugar.tsx` (placeholder)
- **Tests:** 5 tests verdes (Layout: 2, Home: 2, App: 1)
- **Build:** 235KB JS (react-router incluido)
- **Vercel:** conexión pendiente — el usuario la realiza vía dashboard web (ver handoff)
- **gitleaks en pre-commit:** `pnpm dlx gitleaks protect --staged --redact` añadido al hook

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11.1.2** instalado globalmente. Configuración endurecida en `pnpm-workspace.yaml`.
- **`allowBuilds` en pnpm 11** usa formato de mapa booleano (`esbuild: true`), no lista.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2.
- **Stack frontend:** React 18 + Vite 5 + TypeScript strict + Tailwind 3 + Zustand + Zod + Tesseract.js. (Zustand y Zod se instalan en F2.1.)
- **Node:** v24.15.0 (supera el mínimo v22 LTS, compatible).
- **react-router-dom:** versión 7.x instalada (la guía pedía v6; la API `createBrowserRouter`/`RouterProvider`/`NavLink` es compatible). Ver handoff F1.2 para detalle.
- **gitleaks:** vía `pnpm dlx gitleaks protect --staged --redact` en `.husky/pre-commit`.
- **Hosting:** Vercel — pendiente de conectar por el usuario vía dashboard web.

---

## Issues abiertos del proyecto

### Vulnerabilidades moderadas en devDependencies

- **esbuild <=0.24.2** (GHSA-67mh-4wv8-2f99): dev server expuesto a requests externos. Solo en desarrollo. Corregido en >=0.24.3 (requiere vite 6+).
- **vite <=6.4.1** (GHSA-4w7w-66w2-5vf9): Path Traversal en .map handling. Corregido en >=6.4.2 (requiere migración a vite 6).

**Impacto:** son devDependencies, solo afectan en desarrollo local. El audit con `--audit-level=high` no las detecta.

### Vercel no conectado aún

- El usuario conecta el repo de GitHub a Vercel vía dashboard web (vercel.com → Add New Project).
- Configuración: Framework = Vite, Build = `pnpm build`, Output = `dist`, Install = `pnpm install --frozen-lockfile`.
- Una vez conectado, anotar la URL en este archivo.

---

## Deudas técnicas anotadas

- Migrar a Vite 6+ en el futuro para resolver las 2 vulns moderadas de esbuild y vite.
- Anotar URL de Vercel una vez que el usuario conecte el repo.

---

## Notas para la próxima sesión de Claude Code (F2.1)

Al arrancar la sesión de **F2.1**, leer en este orden:

1. `CLAUDE.md`
2. Este archivo (`progreso/estado-actual.md`)
3. `progreso/fase-1.2.md`
4. `docs/especificaciones.md` secciones 3.1 (RF-01 a RF-08) y 7.3 (tipos)
5. Sección F2.1 de `docs/guia_desarrollo.md`

**Prerequisito de F2.1:** verificar que `pnpm test:run` pasa 5 tests verdes y `pnpm build` genera dist/.

---

## Bitácora rápida

| Fecha      | Evento                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas.           |
| 2026-05-14 | F1.1 completada: bootstrap con Vite+React+TS+Tailwind, tubería de calidad operativa, 1 test verde. |
| 2026-05-14 | F1.2 completada: react-router-dom v7, estructura de carpetas, Layout, 3 rutas, 5 tests verdes.     |
