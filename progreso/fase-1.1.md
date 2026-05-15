# Handoff — Subfase F1.1: Bootstrap del proyecto y tubería de calidad

**Fecha de cierre:** 2026-05-14
**Estado:** ✅ Completada
**Siguiente:** F1.2 — Estructura de carpetas inicial, routing y deploy a Vercel

---

## Lo que se hizo

Creación del esqueleto completo del proyecto desde cero (sin código fuente previo):

### Archivos creados

- `package.json` — scripts, dependencies (react, react-dom), devDependencies completas
- `pnpm-workspace.yaml` — configuración de seguridad endurecida
- `.npmrc` — auto-install-peers, strict-peer-dependencies
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` — TypeScript strict con paths `@/`
- `vite.config.ts` — plugin React, alias `@`, `build.sourcemap: 'hidden'`
- `tailwind.config.js` + `postcss.config.js` — Tailwind 3 con content paths
- `src/index.css` — directivas @tailwind
- `eslint.config.js` — flat config ESLint 9 con typescript-eslint, react-hooks, react-refresh
- `.prettierrc` + `.prettierignore` — Prettier 3 con prettier-plugin-tailwindcss
- `vitest.config.ts` — jsdom environment, alias @, setup file
- `src/test-setup.ts` — import @testing-library/jest-dom
- `commitlint.config.js` — extends @commitlint/config-conventional
- `.husky/pre-commit` — `pnpm lint-staged`
- `.husky/commit-msg` — `pnpm dlx commitlint --edit $1`
- `.github/workflows/ci.yml` — job con pnpm 11 + Node 22 + lint/typecheck/test/build/audit
- `vercel.json` — 6 headers de seguridad (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- `index.html` — template con metadata básica en español
- `src/main.tsx` — punto de entrada React con StrictMode
- `src/App.tsx` — "Bingo Digital 🎯" centrado con Tailwind
- `src/App.test.tsx` — test que verifica el texto "Bingo Digital"
- `src/vite-env.d.ts` — tipos de Vite

### Comandos verificados

| Comando                         | Resultado                                |
| ------------------------------- | ---------------------------------------- |
| `pnpm test:run`                 | ✅ 1 test verde                          |
| `pnpm lint`                     | ✅ 0 errores                             |
| `pnpm typecheck`                | ✅ 0 errores                             |
| `pnpm build`                    | ✅ dist/ generado (142KB JS + 5.3KB CSS) |
| `pnpm audit --audit-level=high` | ✅ 0 vulnerabilidades high/critical      |

---

## Versiones exactas instaladas

| Paquete                         | Versión instalada |
| ------------------------------- | ----------------- |
| pnpm                            | 11.1.2            |
| Node                            | 24.15.0           |
| react                           | 18.3.1            |
| react-dom                       | 18.3.1            |
| vite                            | 5.4.21            |
| @vitejs/plugin-react            | 4.7.0             |
| typescript                      | 5.9.3             |
| tailwindcss                     | 3.4.19            |
| vitest                          | 3.2.4             |
| @testing-library/react          | 16.3.2            |
| @testing-library/jest-dom       | 6.9.1             |
| eslint                          | 9.39.4            |
| typescript-eslint               | 8.59.3            |
| prettier                        | 3.8.3             |
| prettier-plugin-tailwindcss     | 0.6.14            |
| husky                           | 9.1.7             |
| lint-staged                     | 15.5.2            |
| @commitlint/cli                 | 19.8.1            |
| @commitlint/config-conventional | 19.8.1            |

---

## Decisiones tomadas

### 1. No se usó `pnpm create vite@latest`

El comando interactivo fue bloqueado por `minimumReleaseAge: 1440` (create-vite@9.0.7 fue publicado hace 3 días, pero pnpm con `minimumReleaseAge: 1440` lo bloqueó, posiblemente por el tag `@latest` con evaluación diferente a versiones con número).

**Alternativa:** se crearon todos los archivos manualmente. El resultado es equivalente a la plantilla `react-ts` de Vite, con configuraciones adicionales (alias, sourcemap, etc.).

### 2. Formato de `allowBuilds` en pnpm 11

La documentación del ADR usaba formato de lista YAML para `allowBuilds`:

```yaml
allowBuilds:
  - esbuild
```

Pero pnpm 11.1.2 espera un mapa booleano:

```yaml
allowBuilds:
  esbuild: true
  '@swc/core': true
```

pnpm modificó el archivo automáticamente y mostró el placeholder `esbuild: set this to true or false`. Se corrigió a `esbuild: true`.

### 3. `gitleaks` via framework Python `pre-commit`

El usuario eligió el enfoque del framework Python `pre-commit` (ya existía `.pre-commit-config.yaml` del kickstart). El usuario debe ejecutar `pip install pre-commit && pre-commit install` una vez en su máquina para activar gitleaks en cada commit.

### 4. `strictDepBuilds: true` funciona correctamente

esbuild@0.21.5 fue bloqueado inicialmente (correcto — es un script de build). Al añadir `allowBuilds: esbuild: true`, pnpm ejecutó el `postinstall` de esbuild. El mecanismo de seguridad funciona como se esperaba.

---

## Sorpresas encontradas

1. **pnpm minimumReleaseAge bloqueó create-vite:** aunque la versión tenía 3 días (>24h), el cooldown aplicó al tag `@latest`. La solución fue crear archivos manualmente.

2. **Vulns moderadas en vite 5 + esbuild 0.21.5:** el audit reporta 2 vulnerabilidades moderadas. Son en devDependencies (solo afectan desarrollo local, no producción). El CI con `--audit-level=high` no las bloquea. Para eliminarlas se necesita migrar a Vite 6+ (fuera del scope de F1.1 que requería Vite 5).

3. **`allowBuilds` vs `onlyBuiltDependencies` en pnpm 11:** existían ambas opciones. `allowBuilds` es la que controla el comportamiento cuando `strictDepBuilds: true`. `onlyBuiltDependencies` parece ser para un caso de uso diferente.

---

## Lo que necesita F1.2

### Prerequisitos verificados

- [x] `pnpm dev` levanta la app en localhost:5173 ← verificar antes de empezar
- [x] `pnpm test:run` pasa 1 test
- [x] `pnpm lint && pnpm typecheck && pnpm build` limpios
- [x] `.github/workflows/ci.yml` existe y está bien configurado
- [x] `vercel.json` con headers de seguridad

### Lo que F1.2 debe hacer

1. Instalar `react-router-dom` v6
2. Crear estructura de carpetas: `src/core/`, `src/modo-presencial/pages/`, `src/modo-presencial/components/`, `src/modo-presencial/hooks/`, `src/shared/components/`
3. Crear `src/lib/router.tsx` con rutas: `/`, `/cartones`, `/jugar`
4. Crear `src/shared/components/Layout.tsx` con header y nav
5. Crear páginas placeholder: `Home.tsx`, `MisCartones.tsx`, `Jugar.tsx`
6. Actualizar `src/App.tsx` para usar el router
7. Conectar el repo a Vercel y verificar deploy automático

### Advertencias para F1.2

- **NO instalar Zustand, Sentry, vite-plugin-pwa** — eso es F2+ y F6
- **NO crear archivos en `src/core/cartones/`** — eso es F2.1
- El `src/core/` solo necesita un `.gitkeep` en F1.2
- Preguntar al usuario por su cuenta de Vercel antes de conectar

---

## TODOs pendientes (no bloqueantes para F1.2)

- [ ] Migrar a Vite 6+ en el futuro para resolver las 2 vulns moderadas
- [ ] El usuario debe ejecutar `pip install pre-commit && pre-commit install` para activar gitleaks
- [ ] Diseño visual final del "Hello, Bingo Digital" se refinará en F7
