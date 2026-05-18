# Handoff — Subfase F6.1: PWA con vite-plugin-pwa

**Fecha de cierre:** 2026-05-17
**Estado:** ✅ Implementación completada
**Siguiente:** F6.2 — Sentry + Vercel Analytics.

---

## Objetivo cumplido

La app es **instalable** como PWA y **funciona offline** tras la primera carga. El service worker precachea los assets de la app (~383 KiB) y excluye explícitamente los ~12 MB de Tesseract (OCR pausado vía `FEATURES.ocr=false`).

---

## Lo que se hizo

### Dependencias añadidas

- `vite-plugin-pwa@1.3.0` (devDependency)
- `workbox-window@7.4.1` (dependency — runtime del cliente, lo usa `useRegisterSW`)

### Archivos creados

- `public/icons/icon-192.png` — 192×192 (PNG generado con PowerShell + System.Drawing)
- `public/icons/icon-512.png` — 512×512
- `public/icons/icon-512-maskable.png` — 512×512 con safe zone interior (80%) para Android maskable
- `public/apple-touch-icon.png` — 180×180
- `scripts/generate-pwa-icons.ps1` — script reproducible de generación (sin deps nuevas, usa GDI+)
- `src/shared/components/PWAUpdatePrompt.tsx` — toast con botón "Recargar"
- `src/shared/components/PWAUpdatePrompt.test.tsx` — 6 tests
- `src/test-utils/pwa-register-stub.ts` — stub del módulo virtual para tests

### Archivos modificados

- `vite.config.ts` — añade `VitePWA({ registerType: 'prompt', manifest, workbox })`
- `vitest.config.ts` — alias `virtual:pwa-register/react` → stub
- `src/vite-env.d.ts` — añade triple-slash references a `vite-plugin-pwa/react` y `vite-plugin-pwa/client`
- `src/App.tsx` — monta `<PWAUpdatePrompt />` junto al `RouterProvider`
- `index.html` — `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `mobile-web-app-capable`, `viewport-fit=cover`
- `.gitignore` — añade `dev-dist/` (carpeta que genera vite-plugin-pwa en dev si se activa)

### Manifest generado (dist/manifest.webmanifest)

```json
{
  "name": "Bingo Digital",
  "short_name": "Bingo",
  "description": "Marca tus cartones de bingo presencial desde el celular",
  "lang": "es",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service worker

- `dist/sw.js` (Workbox generateSW mode)
- Precache: **11 entradas, 383.41 KiB** (`index.html`, JS/CSS, íconos, manifest, favicon, apple-touch-icon, chunk lazy `CrearCartonOCR`).
- **Excluidos del precache** vía `globIgnores: ['**/tesseract/**', '**/tesseract-core/**']`.
- `runtimeCaching` con `CacheFirst` para `/tesseract*/`: el día que `FEATURES.ocr` se reactive, los ~12 MB se cachean en la primera carga.
- `navigateFallback: '/index.html'` para soporte SPA offline; `navigateFallbackDenylist` excluye `/tesseract*` para que no devuelva el HTML cuando se pida un worker.

### Verificaciones

| Comando          | Resultado                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `pnpm test:run`  | ✅ **327 tests verdes** (+6 sobre los 321 de M3)                                           |
| `pnpm lint`      | ✅ 0 errores                                                                               |
| `pnpm typecheck` | ✅ 0 errores                                                                               |
| `pnpm build`     | ✅ 234 módulos, SW generado, precache 383 KiB, 19 assets copy                              |
| `pnpm preview`   | ✅ `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/tesseract/worker.min.js` responden 200 |

---

## Decisiones tomadas

### 1. `registerType: 'prompt'` (no `autoUpdate`)

Confirmado con el usuario. Si la app recarga sola a mitad de un bingo, el usuario pierde estado en pantalla aunque el `localStorage` se preserve. Un toast "Nueva versión disponible" deja al usuario decidir el momento.

### 2. Assets de Tesseract: se mantienen en `dist/` pero NO en precache

Confirmado con el usuario (vía `AskUserQuestion`). `vite-plugin-static-copy` sigue copiando `worker.min.js` y `tesseract-core*.{js,wasm}` al deploy (~12 MB), pero `globIgnores` los saca del precache. Si `FEATURES.ocr` se reactiva mañana, no se requiere cambio de build — los assets ya están servidos, el SW los cachea en runtime con `CacheFirst`.

Alternativa rechazada: condicionar `viteStaticCopy` a `FEATURES.ocr` → más complejo y obligaría a rebuild para reactivar OCR.

### 3. Stub del módulo virtual para tests

El módulo `virtual:pwa-register/react` solo se materializa cuando vite-plugin-pwa corre el bundler. En vitest no existe. Solución: alias en `vitest.config.ts` que redirige a `src/test-utils/pwa-register-stub.ts`, que devuelve estado neutral (`needRefresh: false`, `offlineReady: false`). Los tests de `PWAUpdatePrompt.tsx` lo siguen mockeando explícitamente con `vi.mock` para controlar los valores devueltos.

### 4. Íconos generados con PowerShell + System.Drawing

No quería añadir dependencias pesadas (sharp, puppeteer) ni un step manual de exportación desde Figma. El diseño es coherente con `favicon.svg` (cartón blanco con header azul "BINGO" y grilla 5×5 con FREE amarillo central). El script `scripts/generate-pwa-icons.ps1` es reproducible: `& "$PWD\scripts\generate-pwa-icons.ps1"` regenera los 4 PNG.

Calidad suficiente para v1 / instalación PWA. Si se quiere algo más pulido (gradiente, logo propio), reemplazar manualmente los 4 PNG sin tocar nada más.

### 5. `lang: 'es'` y `orientation: 'portrait'` en el manifest

El default de vite-plugin-pwa pone `lang: 'en'`. Lo sobreescribimos: la UI es 100% en español. `orientation: 'portrait'` porque el flujo del bingo es vertical en celular (cartones apilados + teclado abajo).

---

## Sorpresas encontradas

### `workbox-window` requerido como dependency

Al primer `pnpm build` falló con `Rollup failed to resolve import "workbox-window"`. `useRegisterSW` lo importa en runtime para hablar con el SW. La documentación de `vite-plugin-pwa` no lo explicita, pero es peer requerida cuando se usa el hook React. Se instaló como `dependency` (no devDep) porque el código vive en el bundle del cliente.

### Vercel rewrites + archivos físicos

`vercel.json` tiene un rewrite `/((?!assets|icons|favicon\.ico|manifest\.webmanifest).*) → /index.html`. Esto NO incluye `sw.js` ni `workbox-*.js`. En Vercel los rewrites son condicionales (solo aplican si NO existe el archivo físico), por lo que `sw.js` se sirve correctamente desde `dist/sw.js`. **No fue necesario tocar `vercel.json`** (archivo de la lista "no tocar sin avisar").

Si en F6.2 o más adelante alguien añade un rewrite incondicional, recordar excluir `sw\.js`, `workbox-`, `/tesseract/`, `/tesseract-core/`.

### CSP ya compatible

`vercel.json` ya permite `'wasm-unsafe-eval'`, `worker-src 'self' blob:`, `manifest-src 'self'`. El SW se sirve desde el mismo origen, así que `script-src 'self'` cubre la registración. No fue necesario tocar la CSP.

---

## Para F6.2

### Prerrequisitos

- [x] `pnpm test:run` pasa **327 tests verdes**
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `pnpm build` genera `dist/sw.js`, `dist/manifest.webmanifest`, íconos
- [x] Manifest sirve `lang: 'es'`, `display: 'standalone'`, 3 íconos válidos

### Pendientes de QA manual (no bloquean F6.2)

- [ ] **Lighthouse PWA = 100** en Chrome DevTools tras `pnpm build && pnpm preview`. No se corrió localmente; conviene validar en el deploy de Vercel (preview branch) donde la PWA se sirve en HTTPS real.
- [ ] **Instalación en Android Chrome** desde el deploy de Vercel: aparece "Añadir a pantalla de inicio".
- [ ] **Instalación en iOS Safari 16+**: "Compartir → Añadir a pantalla de inicio". Verificar que el ícono renderiza con el apple-touch-icon de 180px.
- [ ] **Modo avión**: tras primera carga, recargar `/jugar` con red apagada → los cartones y la sesión siguen ahí.
- [ ] **Prompt de actualización**: subir una nueva versión, abrir la app instalada, debería aparecer "Nueva versión disponible. Recargar".

### Notas para F6.2 (Sentry + Vercel Analytics)

- El cuerpo del SW está cubierto por el deploy. Sentry deberá filtrar eventos cuando `import.meta.env.MODE === 'development'` (intencional, evita ruido en dev).
- El `beforeSend` de Sentry tiene que filtrar el contenido de cartones y sesiones (ver CLAUDE.md sección "Logging").
- `VITE_SENTRY_DSN` se añade a `.env.example` y se configura en Vercel.
- `connect-src` en `vercel.json` ya incluye `https://*.sentry.io` y `https://vitals.vercel-insights.com` — no requiere cambios.

---

## Cómo regenerar los íconos

Si se quiere otro diseño:

```powershell
# Editar scripts/generate-pwa-icons.ps1 (función New-BingoIcon)
# Después:
& "$PWD\scripts\generate-pwa-icons.ps1"
```

Salida:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`
- `public/apple-touch-icon.png`

Para diseños más sofisticados (gradiente, SVG complejo) considerar usar Figma + exportar PNG manualmente y dejar el script como fallback temporal.
