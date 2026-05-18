# Handoff — Subfase F6.2: Sentry + Vercel Analytics

**Fecha de cierre:** 2026-05-17
**Estado:** ✅ Implementación completada
**Siguiente:** F7 — Pulido final (Lighthouse PWA=100, Performance≥90, Accessibility≥90).

---

## Objetivo cumplido

Observabilidad activa en producción con privacy-by-default: errores van a Sentry (con filtros estrictos sobre datos del usuario), métricas de uso a Vercel Analytics, y la app entera está envuelta en un `ErrorBoundary` con fallback amigable que invita a recargar.

**Cumplimiento OWASP A09 (Logging):** `sendDefaultPii: false` + `beforeSend` que descarta o redacta eventos con claves sensibles (`carton`, `cartones`, `numeros`, `numerosSorteados`, `ocrImage`, `foto`, `fotoOCR`).

---

## Lo que se hizo

### Dependencias añadidas

- `@sentry/react@10.53.1` (dependency)
- `@vercel/analytics@2.0.1` (dependency)

### Archivos creados

- `src/lib/sentry.ts` — `initSentry()` + `beforeSend()` + `redactarSensibles()`
- `src/lib/sentry.test.ts` — 15 tests sobre filtrado de PII y arranque condicional
- `src/shared/components/ErrorFallback.tsx` — UI del fallback global

### Archivos modificados

- `src/main.tsx` — `initSentry()` se llama ANTES de `createRoot().render()`
- `src/App.tsx` — envuelto en `Sentry.ErrorBoundary fallback={ErrorFallback}`; añadido `<Analytics />` de `@vercel/analytics/react`
- (sin tocar `vercel.json` — la CSP ya permitía `*.sentry.io` y `vitals.vercel-insights.com` desde F1.1)
- (sin tocar `.env.example` — ya tenía `VITE_SENTRY_DSN` y `VITE_APP_ENV` desde F1.1)

### Comportamiento de `initSentry()`

| Condición                                    | Sentry se inicializa | Sentido                                               |
| -------------------------------------------- | -------------------- | ----------------------------------------------------- |
| Sin `VITE_SENTRY_DSN`                        | ❌                   | Local dev sin DSN configurado — no-op silencioso      |
| `VITE_APP_ENV === 'development'`             | ❌                   | Evitar ruido en dev (errores ya visibles en DevTools) |
| `VITE_SENTRY_DSN` + `VITE_APP_ENV !== 'dev'` | ✅                   | preview / production / staging                        |

Config activada: `sendDefaultPii: false`, `tracesSampleRate: 0.1`, `beforeSend`.

### Comportamiento de `beforeSend`

Dos niveles de defensa:

1. **Top-level → descartar evento entero.** Si `event.extra` o `event.contexts` tienen una clave sensible como propiedad directa (`event.extra.cartones = [...]`), `beforeSend` retorna `null`. El evento ni siquiera sale del dispositivo.
2. **Anidado → redactar a `[REDACTED]`.** Recorre `event.extra`, `event.contexts`, y `breadcrumbs[].data` recursivamente, sustituyendo el valor de cualquier clave sensible. Los mensajes string de breadcrumb (`message`) también se sanean para evitar fugas tipo `"cartones=[1,2,3]"`.

Lista negra centralizada en `CLAVES_SENSIBLES` (exportada del módulo, por si se necesita extender desde otro punto).

### ErrorBoundary global

`Sentry.ErrorBoundary` envuelve el `<RouterProvider />`, el `<PWAUpdatePrompt />` y el `<Analytics />`. El fallback (`ErrorFallback.tsx`) muestra:

- Título "Algo salió mal"
- Mensaje: "Hubo un error inesperado. Tus cartones y patrones siguen guardados. Recarga la página para continuar."
- Botón "Recargar la app" → `resetError()` + `window.location.reload()`

### Verificaciones

| Comando          | Resultado                                                                          |
| ---------------- | ---------------------------------------------------------------------------------- |
| `pnpm test:run`  | ✅ **342 tests verdes** (+15 de F6.2 sobre los 327 de F6.1)                        |
| `pnpm lint`      | ✅ 0 errores                                                                       |
| `pnpm typecheck` | ✅ 0 errores                                                                       |
| `pnpm build`     | ✅ 557 módulos, bundle `index-*.js` pasa de 349 → 369 KB (+20 KB Sentry+Analytics) |

---

## Decisiones tomadas

### 1. Top-level descarta, anidado redacta (no "descartar siempre")

La guía F6.2 dice "si encuentra claves sensibles → retorna null; si las encuentra anidadas, redacta a [REDACTED]". Lo implementé tal cual con dos pasadas:

1. `tieneClaveSensibleAlTope(event.extra)` o `event.contexts` → `return null`.
2. `redactarSensibles(...)` recursivo para anidados.

**Por qué dos comportamientos:** una clave sensible al tope de `event.extra` casi siempre significa "alguien hizo `Sentry.captureException(err, { extra: { cartones } })` por error". No queremos esos eventos en absoluto. Pero si un breadcrumb interno contiene una clave anidada (p.ej. `redux-state-snapshot` con `state.cartones`), descartar el evento entero perdería información útil; redactar conserva el stack trace.

### 2. Filtro permite "redactar mensajes" en breadcrumbs

`redactarMensajeBreadcrumb()` aplica regex tipo `/(carton)\s*[:=]\s*\S+/gi` para reemplazar el valor inmediatamente después. No es perfecto (un mensaje muy creativo puede burlarlo), pero defiende contra logs informales tipo `console.log("cartones=", cartones)`.

### 3. ErrorBoundary fallback enfatiza "tus datos siguen guardados"

`localStorage` no desaparece al recargar. El mensaje del fallback lo dice explícitamente para reducir la ansiedad del usuario ante un crash. El botón "Recargar la app" llama a `window.location.reload()` (no a `resetError()` solo) porque suele ser necesario re-inicializar todo el árbol React tras una excepción crítica.

### 4. `Analytics` dentro del `ErrorBoundary`

`<Analytics />` de Vercel es un componente "side-effect only" (inyecta el script). Dentro del boundary, si crashea, queda atrapado y el resto sigue. Por seguridad y simplicidad, está al mismo nivel del `<RouterProvider />`.

### 5. Sin botón de prueba en producción

Confirmado con el usuario (vía `AskUserQuestion`). La validación end-to-end en Sentry (provocar un error real desde un botón "Probar Sentry") queda como tarea de QA manual. Mantener el commit limpio sin código de demo en main.

### 6. Sin workflow de sourcemaps en CI

Confirmado con el usuario. Stack traces en Sentry serán minificados hasta que se añada `.github/workflows/release.yml` con `SENTRY_AUTH_TOKEN`. Tarea diferida, no bloquea F7.

### 7. `.env.example` no se tocó

Ya tenía `VITE_SENTRY_DSN=` (vacío), `VITE_APP_ENV=development`, y documentación de `SENTRY_AUTH_TOKEN` en sección CI/CD. Cosa de F1.1 — todo listo desde el principio.

---

## Sorpresas encontradas

### ESLint `no-unused-vars` rechaza `_hint` con prefijo subrayado

La firma original `beforeSend(event, _hint)` aún disparaba el error `'_hint' is defined but never used`. La regla TypeScript de ESLint por defecto NO honra el prefijo `_` (requiere config explícita con `argsIgnorePattern: '^_'`). Solución mínima: eliminar el segundo arg. Sentry lo acepta — el tipo de `beforeSend` es `(event, hint?) => event | null | Promise<...>`, así que un solo argumento sigue siendo válido.

### `@sentry/react` v10 expone tipos vía re-export

`ErrorEvent` y `EventHint` no viven en `@sentry/react` directamente; vienen de `@sentry/core` y se re-exportan vía `@sentry/browser → @sentry/react`. Funciona, pero algunas IDE muestran "from @sentry/core" al hover. Sin impacto en runtime.

### Build sube +20 KB gzip

`@sentry/react` añade ~17 KB gzip (mínimo) por su tracing init. Aceptable: la meta del proyecto es bundle inicial < 250 KB gzip, vamos en 114 KB gzip. Margen suficiente.

---

## Para F7 (Pulido final)

### Prerrequisitos

- [x] `pnpm test:run` pasa **342 tests verdes**
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `pnpm build` genera SW + manifest + PWA assets

### TODOs heredados (pendientes acumulados, no bloquean F7)

1. **Configurar Sentry en Vercel** (manual del usuario):
   - Crear proyecto en sentry.io tipo "React"
   - Copiar el DSN público
   - En Vercel → Settings → Environment Variables:
     - `VITE_SENTRY_DSN` = `<el DSN>` (Environment: Production y Preview)
     - `VITE_APP_ENV` = `production` (Production), `preview` (Preview)
2. **Validar que Sentry recibe eventos en preview/prod**:
   - Añadir temporalmente un botón "Probar Sentry" en `/` o `/jugar` con `onClick={() => { throw new Error('Test Sentry') }}`
   - Deploy a preview → click el botón → verificar en dashboard de Sentry
   - Eliminar el botón antes del merge a main
3. **Sourcemaps a Sentry vía CI** (opcional pero recomendado):
   - Crear `.github/workflows/release.yml` en push a `main`
   - Build + subir sourcemaps con `@sentry/cli` o la action oficial
   - `SENTRY_AUTH_TOKEN` con scope `project:releases` en GitHub Secrets
4. **Pendientes QA manual de F6.1** (siguen vigentes):
   - Lighthouse PWA = 100 en deploy Vercel HTTPS real
   - Instalación Android Chrome / iOS Safari 16+
   - Modo avión tras primera carga
   - Probar prompt de actualización con dos deploys consecutivos

### Notas para F7 (Pulido final)

- F7 según `docs/guia_desarrollo.md` (no leída aún en esta sesión): apuntar a Lighthouse Performance≥90, Accessibility≥90 + UX polish + export/import accesible.
- Cobertura: revisar si `core/motor-juego/` sigue ≥85% (meta proyecto) tras los cambios acumulados.
- Tag sugerido al cerrar F7: `v0.9.0` (beta lista, M6).
