# Handoff — Subfase F1.2: Estructura de carpetas inicial, routing y deploy a Vercel

**Fecha de cierre:** 2026-05-14
**Estado:** ✅ Completada (Vercel pendiente de conectar por el usuario)
**Siguiente:** F2.1 — Modelo, validación y generador de cartones

---

## Lo que se hizo

### Archivos creados

- `src/core/.gitkeep` — carpeta placeholder para módulos de F2+
- `src/modo-presencial/components/.gitkeep` — placeholder
- `src/modo-presencial/hooks/.gitkeep` — placeholder
- `src/modo-presencial/pages/Home.tsx` — hero con 2 botones CTA (→ /cartones, → /jugar)
- `src/modo-presencial/pages/MisCartones.tsx` — placeholder
- `src/modo-presencial/pages/Jugar.tsx` — placeholder
- `src/shared/components/Layout.tsx` — header sticky + NavLink activo + Outlet
- `src/shared/components/Layout.test.tsx` — 2 tests
- `src/modo-presencial/pages/Home.test.tsx` — 2 tests
- `src/lib/router.tsx` — `createBrowserRouter` con rutas `/`, `/cartones`, `/jugar`

### Archivos modificados

- `src/App.tsx` — reemplazado por `<RouterProvider router={router} />`
- `src/App.test.tsx` — actualizado a `getAllByText` (el texto "Bingo Digital" aparece 2 veces con el router)
- `package.json` — añadida dependencia `react-router-dom ^7.15.0`
- `pnpm-lock.yaml` — actualizado
- `.husky/pre-commit` — gitleaks añadido: `pnpm dlx gitleaks protect --staged --redact`

### Comandos verificados

| Comando          | Resultado                                 |
| ---------------- | ----------------------------------------- |
| `pnpm test:run`  | ✅ 5 tests verdes (3 archivos)            |
| `pnpm lint`      | ✅ 0 errores                              |
| `pnpm typecheck` | ✅ 0 errores                              |
| `pnpm build`     | ✅ dist/ generado (235KB JS + 8.55KB CSS) |

---

## Versiones instaladas en F1.2

| Paquete          | Versión |
| ---------------- | ------- |
| react-router-dom | 7.15.0  |

---

## Decisiones tomadas

### 1. react-router-dom v7 en lugar de v6

La guía pedía v6. pnpm instaló v7.15.0 (la más estable que pasó el cooldown de 24h; la 7.15.1 fue bloqueada). La API relevante que usamos (`createBrowserRouter`, `RouterProvider`, `NavLink`, `Outlet`, `MemoryRouter`) es **idéntica** entre v6 y v7 en el modo "library" (sin file-based routing). Sin impacto en código.

### 2. `getAllByText` en App.test.tsx

Con el router, la palabra "Bingo Digital" aparece dos veces: en el `<span>` del header y en el `<h1>` de Home. Se cambió `getByText` por `getAllByText(...).length > 0` para evitar el error "Found multiple elements".

### 3. gitleaks en pre-commit

Se encontró que el usuario ya había añadido `pnpm dlx gitleaks protect --staged --redact` al `.husky/pre-commit`. Se incluye en el commit de F1.2 (es la estrategia que se documentó en F1.1 como pendiente).

---

## Sorpresas encontradas

1. **Sesión arrancó queriendo hacer F2.1 directamente.** El estado-actual.md marcaba F1.2 como "siguiente" y el código confirmaba que F1.2 no se había hecho. Se detectó la inconsistencia, se consultó al usuario y se decidió respetar el orden.

2. **react-router-dom v7:** pnpm bloqueó v7.15.1 (publicada hace <24h) e instaló v7.15.0. API compatible, sin problema.

---

## Lo que necesita F2.1

### Prerequisitos verificados antes de arrancar F2.1

- [x] `pnpm test:run` pasa 5 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `pnpm build` genera dist/ (235KB JS)
- [ ] Vercel conectado (opcional para F2.1 — es solo lógica pura TypeScript)

### Lo que F2.1 debe hacer

1. Instalar `zod` y `uuid` + `@types/uuid` con pnpm
2. Crear `src/core/cartones/types.ts` con `SerieBingo`, `NumerosCarton`, `Carton`
3. Crear `src/core/cartones/validacion.ts` con schema Zod y Result pattern
4. Crear `src/core/cartones/generador.ts` con funciones puras de creación
5. Crear `src/core/cartones/index.ts` con la API pública
6. Tests con cobertura ≥ 80%
7. **NO usar React ni DOM en core/cartones/**

### Advertencias para F2.1

- **NO instalar Zustand todavía** — eso es F2.2
- **NO crear UI ni localStorage** — eso es F2.2
- **NO crear src/core/almacenamiento/** — eso es F2.2
- **NO crear src/core/motor-juego/** — eso es F3.1
- Leer `docs/especificaciones.md` sección 7.3 para los tipos exactos antes de empezar

---

## TODOs pendientes (no bloqueantes para F2.1)

- [ ] Usuario debe conectar repo a Vercel vía dashboard web (vercel.com → Add New Project → Import repo)
  - Framework: Vite
  - Build: `pnpm build`
  - Output: `dist`
  - Install: `pnpm install --frozen-lockfile`
  - Una vez conectado, anotar URL en `progreso/estado-actual.md`
- [ ] Migrar a Vite 6+ en algún momento futuro (resolver las 2 vulns moderadas)
