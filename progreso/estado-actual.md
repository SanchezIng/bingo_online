# Estado Actual del Proyecto

**Última actualización:** 2026-05-17 (cierre F6.1 — PWA instalable y offline)
**Hito alcanzado:** **M3 — Juego presencial sin OCR completo** (M5 — PWA en producción avanzando)
**Última subfase implementada:** **F6.1** (vite-plugin-pwa + manifest + íconos + PWAUpdatePrompt)
**Próxima subfase:** **F6.2 — Sentry + Vercel Analytics**. F5.5/F5.6 pausadas indefinidamente.

---

## Progreso global

- Fases completas en producción: **4 / 8** (F1 ✅, F2 ✅, F3 ✅, F4 ✅). F6 en curso (F6.1 ✅).
- **F5 pausada**: F5.1–F5.4 implementadas pero `FEATURES.ocr=false` las oculta al usuario final. Ver `docs/adr/0004-ocr-pausado-v1.md`.
- Subfases completadas: **15 / 17** (F1.1–F4.3 + F5.4 + F6.1).
- Tests: **327 verdes** (+6 sobre M3), lint y typecheck limpios, build OK con PWA generada.
- Tag: **`v0.4.0`** local (cierre de M3, juego presencial sin OCR). Próximo tag al cerrar F6.2.
- Porcentaje estimado: ~85%.

---

## Resumen de lo construido hasta ahora

### F6.1 — PWA con vite-plugin-pwa (completada 2026-05-17)

App instalable y offline tras primera carga. SW generado, manifest válido, íconos 192/512/maskable + apple-touch-180.

- **Deps:** `vite-plugin-pwa@1.3.0` (dev), `workbox-window@7.4.1` (runtime — peer requerida por `useRegisterSW`).
- **`vite.config.ts`:** plugin `VitePWA({ registerType: 'prompt', manifest, workbox })`. Manifest con `lang: 'es'`, `display: 'standalone'`, `orientation: 'portrait'`, 3 íconos. Workbox `globIgnores: ['**/tesseract/**', '**/tesseract-core/**']` para excluir los ~12 MB del precache (OCR pausado). `runtimeCaching` con CacheFirst para `/tesseract*/` cuando OCR se reactive. `navigateFallback: '/index.html'` con denylist para `/tesseract*`.
- **`src/shared/components/PWAUpdatePrompt.tsx`:** toast fixed bottom-center con `useRegisterSW` (de `virtual:pwa-register/react`). Botones "Recargar" / "Después". También cubre el caso `offlineReady`.
- **`src/test-utils/pwa-register-stub.ts`:** stub del módulo virtual; aliasado en `vitest.config.ts` para que tests no rompan al importarlo.
- **Íconos:** generados con `scripts/generate-pwa-icons.ps1` (PowerShell + System.Drawing — sin deps nuevas). Reproducible.
- **`index.html`:** metadata iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`, `apple-mobile-web-app-title`), `viewport-fit=cover`, `mobile-web-app-capable`.
- **Build:** 234 módulos, precache 11 entries / 383.41 KiB, SW 8.5 KB. Assets de Tesseract siguen en `dist/` (vía `vite-plugin-static-copy`) pero fuera del precache.
- **Tests:** 6 nuevos en `PWAUpdatePrompt.test.tsx`. **Total: 327 tests verdes**.

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

### Polish UX post-F5 (cerrado 2026-05-16, tag `v0.4.0`)

Tras pausar OCR, un bloque coordinado de cambios en `/jugar` y `/patrones` para cerrar M3 (juego presencial sin OCR) con UX pulida. No es una subfase F5/F6 formal — extiende F3/F4.

**1. Rediseño de `/jugar`** (commit `f01095b`):

- Layout reordenado: header → tira últimos 10 → bloque "input + display último número + deshacer" → cartones → tablero general → panel patrón flotante.
- `UltimoNumeroDisplay`: display grande con letra (B-7, etc.) + botón "Deshacer último".
- `InputNumeroSorteado`: campo numérico con preview dinámico de letra, validación rango 1-75, duplicados con error inline.
- `TableroGeneral` (renombrado de TecladoNumerico): celdas marcadas muestran el número con fondo verde + ring (antes "✓"). Sigue clickeable.
- `PanelPatronFlotante`: aside fixed bottom-right con mini-preview, colapsable a FAB 🎯, botón "Cambiar patrón".
- `SelectorCondicion` + `ModalSeleccionarCondicion`: extraídos para compartir entre `/configurar` y modal en `/jugar`. Modo 'iniciar' (reinicia números) y 'cambiar' (preserva números sorteados).
- `establecerCondicion` en el store ahora persiste cuando hay sesión activa.

**2. Bug fix + botón "Modo juego"** (commit `2ab8c7a`):

- Bug: cartones se perdían al recargar `/jugar` directamente — solución: `cargarCartones + cargarPatrones + cargarSesion` en el useEffect inicial.
- Botón "Modo juego" al lado del título → abre `ModalSeleccionarCondicion` en modo 'cambiar'.
- Nuevo flujo "elegir patrón": en el modal, opción "Patrón guardado" muestra botón **"Ir a elegir patrón →"** (en vez de `<select>`). Click → navega a `/patrones` con `state: { volverAJugar: true }`.
- En `EditorPatrones`, el state `volverAJugar` activa modo selección: banner explicativo, botón verde "Usar para jugar" por patrón, "Guardar y usar" al crear, "Cancelar" para volver. Aplica `establecerCondicion + navigate('/jugar')` al elegir/crear.

**3. Cards visuales en `/patrones` + nombre opcional** (commit `e93c278`):

- `MiniPatronGrid`: componente compartido para mini-visualización 5×5 de patrones (mismo render en panel flotante y editor).
- Cards en `/patrones` con preview gráfico (28px) en vez de `<pre>` ASCII. Grid responsive 1/2/3 columnas.
- Nombre del patrón ahora **opcional**: si está vacío al guardar, se autogenera "Patrón N" buscando el primer entero libre.

**Tests:** 321 verdes (+42 sobre los 279 del cierre F4.3). Incluye `SelectorCondicion.test.tsx` y modo selección de `EditorPatrones`.

### F5.4 — Preprocessing + OCR por celda (completada 2026-05-15)

Rediseño profundo del flujo OCR. La heurística F5.1/F5.2 (OCR global + asignación por bbox a una grilla 5×5) era frágil con fotos reales. F5.4 cambia a OCR por celda con preprocesamiento de imagen:

- **`src/core/ocr/preprocess.ts`:** helpers Canvas y funciones puras sobre `Uint8ClampedArray`. Pipeline: grayscale (luminancia perceptual 0.299/0.587/0.114) → contraste (factor 1.4) → binarización Otsu. `cropCelda` recorta una celda de la grilla 5×5 a un canvas separado. La lógica pura (sin Canvas) está testeada; las wrappers de Canvas están marcadas con `/* v8 ignore */` porque jsdom no implementa Canvas 2D.
- **`src/core/ocr/tesseract.ts`:** refactor completo. `procesarImagenOCR` ahora retorna `Result<GrillaDetectada, OcrError>` directamente. Pipeline: file → canvas → preprocess → loop 5×5 (24 celdas, FREE excluida) → `recognize()` por celda con `tessedit_pageseg_mode=8` (single word) + whitelist `0123456789`. Worker reutilizable: se crea una vez y se termina al final. Validación de rango por columna (B=1-15, I=16-30, …) baja confianza a 'baja' si el número cae fuera. Logger emite progreso por etapas: preprocess 0-5, init 5-15 (con sub-progreso de "loading core" y "loading traineddata"), ocr-celda 15-95 incrementando por celda procesada, fin 100.
- **`src/core/ocr/post-process.ts`:** simplificado. Solo queda `consolidarCandidatos`; `estructurarEnGrilla` eliminada (ya no se necesita porque el OCR retorna grilla directa).
- **`src/core/ocr/types.ts`:** eliminados `BboxOCR`, `BloqueOCR`, `ResultadoOCRBruto`. Se mantienen `OcrError`, `CandidatoOCR`, `CeldaDetectada`, `GrillaDetectada`.
- **`CrearCartonOCR.tsx`:** no llama más a `estructurarEnGrilla`. El warning de confianza baja ahora se calcula con promedio ponderado de candidatos por nivel (alta=1, media=0.6, baja=0.2). Dimensiones de imagen ya no se trackean (no se necesitan; el preprocess opera sobre el canvas creado internamente).
- **Tests:** 17 nuevos en `preprocess.test.ts` (lógica pura: grayscale, contraste, histograma, Otsu, umbral, sharpen). 13 nuevos en `tesseract.test.ts` (mocks de createWorker + preprocess; verifica workerPath/corePath locales, PSM=8, whitelist, 24 recognize calls, mapeo de confianza, validación de rango, progreso monotónico). 8 simplificados en `post-process.test.ts` (solo `consolidarCandidatos`). 10 ajustados en `CrearCartonOCR.test.tsx`. **Total: 281 tests verdes** (+9 netos sobre F5.3).
- **Decisión arquitectónica:** OCR por celda toma ~50-200 ms por celda × 24 = 1.2-4.8s total. Más lento que OCR global (~1s) pero mucho más preciso porque cada cell tiene PSM=8 (single word) y solo dígitos.

### F5.3 — UI de confirmación editable y guardado (completada 2026-05-15)

Cierra el flujo OCR end-to-end: foto → procesamiento → grilla editable con confianza visual → validación → guardado:

- **`src/modo-presencial/components/RevisionOCR.tsx`:** grilla 5×5 con inputs editables, encabezados B-I-N-G-O, celda FREE bloqueada. Borde por confianza (alta=verde-500, media=amber-500, baja=red-500, sin candidato=dashed gray-300). Tooltip con etiqueta de confianza. Validación local: 24 casillas no-FREE con `number` en rango habilita "Guardar cartón". `validarNumerosCarton` se ejecuta dentro del componente y muestra errores inline (duplicados, etc.).
- **`src/modo-presencial/pages/CrearCartonOCR.tsx`:** flujo refactorizado a etapas `seleccion → procesando → revision → error`. Al terminar OCR: `estructurarEnGrilla` + `consolidarCandidatos` → pasar a RevisionOCR. Warning ámbar si confianza promedio < 30%. Al confirmar guardado: `crearCartonDesdeNumeros` con `fuente='ocr'`, `agregarCarton`, navegar a `/cartones` con `state: { mensaje: 'Cartón creado por OCR.' }`. Dimensiones de imagen capturadas con `onLoad` (naturalWidth/Height), con fallback 500×500.
- **Tests:** 13 nuevos en `RevisionOCR.test.tsx` (24 inputs + FREE, valores iniciales, edición, guardar deshabilitado/habilitado, callbacks, duplicados, colores por confianza, tooltip). 11 en `CrearCartonOCR.test.tsx` (mocks de OCR, store, useNavigate; flujo a revisión, warning < 30%, sin warning ≥ 30%, guardar→navega, volver a tomar foto, error path). **Total: 272 tests verdes** (+17 sobre F5.2).
- **F5 completa.** Considerar tag `v0.5.0`.

### F5.2 — Post-procesamiento: estructurar OCR en grilla 5×5 (completada 2026-05-15)

Módulo `src/core/ocr/post-process.ts` con lógica pura de post-proceso. Sin UI, sin Tesseract real:

- **Nuevos tipos en `src/core/ocr/types.ts`:** `CandidatoOCR` (numero + confianza 'alta'|'media'|'baja'), `CeldaDetectada` (fila, columna, candidatos[]), `GrillaDetectada` (celdas[])
- **`estructurarEnGrilla(resultado, dimensionesImagen)`:** Divide imagen en grilla 5×5, asigna cada bloque a su celda por coordenadas del centro. Mapea confianza Tesseract (0-100) a alta/media/baja (≥80/50-79/<50). Valida rangos por columna (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75); fuera de rango → confianza forzada a 'baja'. Celda (2,2) FREE siempre excluida. Devuelve 24 celdas (5×5 menos FREE).
- **`consolidarCandidatos(grilla)`:** Selecciona el candidato de mayor confianza por celda. Sin candidatos → null. Columna N fila 2 siempre 'FREE'. Retorna `NumerosCartonParcial`.
- **`src/core/ocr/index.ts`:** exporta `estructurarEnGrilla`, `consolidarCandidatos` y los 3 nuevos tipos.
- **Tests:** 21 tests nuevos con fixtures (sin Tesseract real). Total: **255 tests verdes**.

### F5.1 — Integración de Tesseract.js y captura de imagen (completada 2026-05-15)

Módulo `src/core/ocr/` con tipos, función OCR y UI de captura. Sin post-proceso aún (eso es F5.2):

- **`tesseract.js 7.0.0`** instalado. `allowBuilds: tesseract.js: true` añadido en `pnpm-workspace.yaml`.
- **`src/core/ocr/types.ts`:** `BboxOCR`, `BloqueOCR`, `ResultadoOCRBruto`, `OcrError`, `OcrErrorTipo`
- **`src/core/ocr/tesseract.ts`:** `procesarImagenOCR(file, onProgreso?)` — worker con lang='eng', whitelist='0123456789', extrae words de `blocks→paragraphs→lines→words`, `terminate()` garantizado en `finally`, retorna `Result<ResultadoOCRBruto, OcrError>`
- **`src/core/ocr/index.ts`:** API pública del módulo
- **`src/modo-presencial/pages/CrearCartonOCR.tsx`:** input `accept="image/*" capture="environment"`, preview, barra de progreso, chips de números detectados con confianza en tooltip, sección `<details>` para texto bruto
- **Router:** ruta `/cartones/foto` con `React.lazy` + `Suspense` — chunk separado de 18 kB, no va en bundle principal
- **`MisCartones.tsx`:** botón "Crear con foto (OCR)" → `/cartones/foto`
- **`vercel.json`:** `cdn.jsdelivr.net` añadido a `connect-src` para descarga de modelos Tesseract
- **`src/test-setup.ts`:** mock global de `URL.createObjectURL` / `URL.revokeObjectURL` (jsdom no los implementa)
- **Tests:** 15 tests nuevos (8 tesseract + 7 CrearCartonOCR). Total: **234 tests verdes**.

### F4.3 — Historial de números sorteados y reinicio de sesión (completada 2026-05-15)

Modal reutilizable, historial agrupado por serie B/I/N/G/O, reiniciar con confirmación explícita y persistencia de sesión a recargas:

- **`src/shared/components/Modal.tsx`:** overlay accesible (`role="dialog"`, ESC + click fuera cierra), reutilizable
- **`src/modo-presencial/components/HistorialSorteados.tsx`:** lista números sorteados agrupados por serie (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75), orden de aparición preservado
- **`Jugar.tsx`:** botón "Ver historial" → modal con `HistorialSorteados`; "Reiniciar" → modal con texto descriptivo y botones Cancelar/Confirmar; `useEffect(() => cargarSesion(), [cargarSesion])` para persistencia a recargas
- **Tests:** 10 nuevos (7 HistorialSorteados + 3 Jugar). Total: **219 tests verdes**.
- **F4 completa.** El juego presencial end-to-end sin OCR está listo. Tag `v0.4.0` recomendado.

### F4.2 — Ranking dinámico de cartones (completada 2026-05-15)

Lista de cartones en `/jugar` reordenada en tiempo real por proximidad al patrón:

- **`src/modo-presencial/components/CartonRankeado.tsx`:** componente `React.memo` con posición (`#N`), badge (🏆 BINGO / 🔥 MUY CERCA / 🎯 CASI), `CartonGrid` con casillas marcadas, y texto "Faltan N casillas". Badge BINGO cuando `ganado=true`; MUY CERCA cuando `faltan <= 2`; CASI cuando `faltan <= 5`.
- **`src/modo-presencial/pages/Jugar.tsx`:** llama `rankingComputed()` en cada render, construye `cartonMap` y renderiza `CartonRankeado` en orden del ranking. `key={carton.id}` para memoización efectiva.
- **Tests:** 13 tests nuevos (CartonRankeado) + 5 tests de ranking en Jugar. Total: **209 tests verdes**.

### F4.1 — Teclado numérico y registro de números sorteados (completada 2026-05-15)

UI de juego en tiempo real: teclado numérico 1-75 y marcado de casillas en cartones:

- **`src/modo-presencial/components/TecladoNumerico.tsx`:** grilla 5×15 con números 1-75 organizados por columnas BINGO. Botones ≥ 60px. Números sorteados deshabilitados con fondo verde y check. Indicador grande del último número con prefijo de serie (B-7, I-20, etc.). Botón "Deshacer último" deshabilitado si no hay números.
- **`src/modo-presencial/pages/Jugar.tsx`:** reemplazado placeholder con UI completa. Header con condición+conteo+botón reiniciar (2 pasos). Historial scrollable de últimos 10 números (el más reciente destacado). Lista de cartones con casillas marcadas en verde usando `casillasMarcadasDeCartonConNumeros`. Layout: teclado izquierda en desktop, abajo en móvil.
- **Tests:** 22 tests nuevos (12 TecladoNumerico + 10 Jugar). Total: **191 tests verdes**.

### F3.3 — Integración del motor con stores y configuración de victoria (completada 2026-05-15)

Store de sesión de juego que une cartones + patrones + condición + números sorteados:

- **`src/lib/stores/sesion.ts`:** Zustand store con `condicionVictoria`, `numerosSorteados`, `iniciadaEn`. Actions: `establecerCondicion`, `agregarNumeroSorteado` (ignora duplicados y sin sesión), `deshacerUltimoNumero`, `reiniciarSesion`, `cargarSesion`. Getter: `rankingComputed()` usando `getState()` de otros stores.
- **`src/core/almacenamiento/localStorage.ts`:** `leerSesion`/`guardarSesion` tipadas con `EstadoSesion` (antes `unknown`). Validación estructural al leer.
- **`src/modo-presencial/pages/ConfiguracionJuego.tsx`:** radio buttons para 3 condiciones, input numérico para `n_marcados`, dropdown de patrones para `patron`, botón "Iniciar sesión" que llama `establecerCondicion` + `reiniciarSesion` y navega a `/jugar`.
- **`src/modo-presencial/pages/Jugar.tsx`:** muestra resumen de sesión activa (condición, cartones, números) o CTA a `/configurar` si no hay sesión.
- **Router:** ruta `/configurar` → `ConfiguracionJuego` añadida.
- **Tests:** 30 tests nuevos (21 store + 9 ConfiguracionJuego). Total: **169 tests verdes**.

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11.1.2** instalado globalmente. Configuración endurecida en `pnpm-workspace.yaml`.
- **`allowBuilds` en pnpm 11** usa formato de mapa booleano (`esbuild: true`), no lista.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2.
- **Stack frontend:** React 18 + Vite 5 + TypeScript strict + Tailwind 3 + Zustand 5 + Zod 4 + uuid 14 + **Tesseract.js 7.0.0** (instalado en F5.1).
- **Node:** v24.15.0 (supera el mínimo v22 LTS, compatible).
- **react-router-dom:** versión 7.x instalada. API compatible con lo que describe la guía.
- **gitleaks:** vía `pnpm dlx gitleaks protect --staged --redact` en `.husky/pre-commit`.
- **Vercel:** https://bingo-online-bice.vercel.app/ — deploy automático activo.
- **uuid 14.0.0:** `import { v4 as uuidv4 } from 'uuid'` compatible.
- **Zod 4.x:** `z.string().uuid()` valida RFC 9562: requiere versión `[1-8]` y variante `[89ab]`. Usar UUIDs generados por `uuidv4()` en fixtures de tests (no hardcoded con todos ceros).
- **Patrón Result:** `type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }`. Definido en `core/cartones/types.ts`.
- **Zustand 5.x:** API de `create()` igual a v4 para uso básico. Importar con `import { create } from 'zustand'`.
- **Mocking de Zustand en tests:** `vi.mock('@/lib/stores/X')` + `vi.mocked(useXStore).mockReturnValue(...)`. Funciona cuando el componente llama `useXStore()` sin selector. **IMPORTANTE:** si el componente usa selector `useXStore((s) => s.campo)`, el mock devuelve el objeto completo (no el campo) — usar desestructuración sin selector en componentes.
- **`leerPatrones` y `guardarPatrones`:** tipadas con `Patron[]` desde F3.2. Importan `Patron` desde `@/core/motor-juego`.
- **`leerSesion` y `guardarSesion`:** tipadas con `EstadoSesion` desde F3.3. Incluyen validación estructural.
- **Coordenadas motor-juego:** `"fila,columna"` 0-indexed. B→col0, I→col1, N→col2, G→col3, O→col4. FREE en `"2,2"`.
- **`evaluarCondicion` — patrón no encontrado:** retorna `{ ganado: false, faltan: Infinity }`.
- **`calcularRanking` — sort estable:** en empate de `faltan`, preserva orden del array original.
- **vitest.config.ts `coverage.exclude`:** añadido `['**/types.ts']`. Actualizar si se añaden más patrones de exclusión.
- **react-refresh/only-export-components:** no exportar funciones utilitarias desde archivos de componentes. Usar módulos separados (ej: `patronUtils.ts`).
- **PatronCanvas — grilla controlada:** el componente recibe `grilla: boolean[][]` + `onChange`. El estado se gestiona en el padre (EditorPatrones).
- **EditorPatrones — validación de grilla:** mínimo 3 casillas activas (1 FREE + 2 libres) para guardar un patrón.
- **`EstadoSesion` vs store de sesión:** el tipo `EstadoSesion` usa `condicionActiva`; el store usa `condicionVictoria`. El mapping se hace explícito en `persistirSesion` y `cargarSesion`.
- **`rankingComputed`:** función getter en el store de sesión que llama `useCartonesStore.getState()` y `usePatronesStore.getState()`. Calcula on-demand. En F4.2 se confirmó que llamarlo en el render de `Jugar.tsx` es suficiente para la reactividad — no se necesita un hook adicional.
- **`CartonRankeado`:** props `{ carton, posicion, entrada, numerosSorteados }`. Usa `React.memo`. Pasa `numerosSorteados` (no `Set<string>`) para que memo evite re-renders cuando solo cambia estado local de `Jugar` (ej: `pedirConfirma`).
- **`TecladoNumerico.tsx`:** usa el store de sesión directamente (sin props). Números en orden fila×columna para `grid-cols-5`: fórmula `n = col*15 + row + 1` donde `i = row*5 + col`.
- **Tests de Jugar con cartones:** deben mockear `rankingComputed` con entradas válidas. Sin ranking mock, `Jugar.tsx` no renderiza cartones aunque `mockCartones` tenga datos.
- **`serieDe(n)`:** función local en TecladoNumerico: B=1-15, I=16-30, N=31-45, G=46-60, O=61-75.
- **`role="region"`:** el div del historial en Jugar.tsx lleva `role="region"` + `aria-label` para que sea consultable por `getByRole('region')` en tests.
- **`Modal.tsx`:** en `src/shared/components/`. Props: `titulo`, `children`, `onClose`. No usa Portal. Click fuera y ESC llaman `onClose`.
- **`HistorialSorteados.tsx`:** props `{ numerosSorteados: number[] }`. Rangos: B=1-15, I=16-30, N=31-45, G=46-60, O=61-75. Serie vacía muestra "—".
- **`cargarSesion()` en Jugar.tsx:** `useEffect(() => cargarSesion(), [cargarSesion])`. Mismo patrón que `cargarCartones` en MisCartones y `cargarPatrones` en EditorPatrones.
- **`RevisionOCR.tsx`:** props `{ grilla, numerosBase, onGuardar, onVolver }`. La validación final (incluye duplicados) se hace dentro del componente vía `validarNumerosCarton`; el padre solo recibe el `NumerosCarton` ya validado. El estado interno `valores: NumerosCartonParcial` se inicializa una vez con `useState(numerosBase)` — el componente se desmonta al volver a "seleccion", así que no necesita sincronizar `numerosBase` cambiante.
- **`CrearCartonOCR.tsx` — `useCartonesStore()` sin selector:** se accede como `const { agregarCarton } = useCartonesStore()` para que el mock global con `vi.mocked(useCartonesStore).mockReturnValue(...)` funcione en tests. Coherente con la nota de memoria sobre Zustand y selectors.
- **`CrearCartonOCR.tsx` — `useNavigate` mockeado en tests:** `vi.mock('react-router-dom', async (importOriginal) => { const actual = await importOriginal(); return { ...actual, useNavigate: () => navigateMock } })`. Patrón reutilizable.
- **Dimensiones de imagen para OCR:** se capturan con `onLoad` del `<img>` en un `ref` (no state, evita re-renders). Fallback `{ w: 500, h: 500 }` si no se cargó (sólo afecta tests, en producción el usuario ve la preview antes de procesar).
- **Mocking de funciones puras de `@/core/ocr` en tests de páginas:** `vi.mock('@/core/ocr', () => ({ procesarImagenOCR, estructurarEnGrilla, consolidarCandidatos: vi.fn() }))`. Cada test controla sus return values con `vi.mocked(fn).mockReturnValue(...)`.
- **PWA — `registerType: 'prompt'`:** la app NO se recarga sola al detectar nueva versión. `PWAUpdatePrompt.tsx` muestra un toast y el usuario decide. Importante para no perder estado en mitad de un bingo.
- **PWA — assets de Tesseract en `globIgnores` (no en runtimeCaching):** quedan en `dist/` (vía `vite-plugin-static-copy`) pero NO entran al precache. Si `FEATURES.ocr` se reactiva, `runtimeCaching` con `CacheFirst` los baja la primera vez. Reactivar OCR no requiere rebuild.
- **PWA — `virtual:pwa-register/react` en tests:** alias en `vitest.config.ts` → `src/test-utils/pwa-register-stub.ts`. El stub devuelve estado neutral. Tests de `PWAUpdatePrompt.tsx` aún hacen `vi.mock('virtual:pwa-register/react', ...)` para controlar el valor.
- **PWA — `workbox-window` como dependency (no devDep):** lo importa `useRegisterSW` en runtime, vive en el bundle del cliente. Sin él, `pnpm build` falla con "Rollup failed to resolve import".
- **PWA — íconos generados con PowerShell:** `scripts/generate-pwa-icons.ps1` usa `System.Drawing` (sin deps nuevas). Diseño coherente con `favicon.svg` (header BINGO + grilla 5×5 + FREE central amarillo). Reemplazar manualmente los PNG si se quiere otro diseño.
- **PWA — Vercel rewrites + archivos físicos:** Vercel respeta el filesystem antes de aplicar rewrites; `sw.js` y `workbox-*.js` se sirven directos aunque no estén en el negative lookahead. Si en F6.2+ se cambia el rewrite a incondicional, añadir `sw\.js`, `workbox-`, `/tesseract*` a las exclusiones.

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
- `lib/stores/cartones.ts`: cobertura baja en actions (25%) porque los tests de componentes mockean el store. Considerar tests de integración del store en F4.
- `rankingComputed` no es reactivo: si cambian cartones o patrones sin re-renderizar el componente que usa el store de sesión, el ranking puede estar desactualizado. En F4, cuando el marcador sea interactivo, evaluar si se necesita un hook `useRanking()` con suscripción a los 3 stores.

---

## Notas para la próxima sesión de Claude Code (F6.2)

Al arrancar la sesión de **F6.2**, leer en este orden:

1. `CLAUDE.md`
2. Este archivo (`progreso/estado-actual.md`)
3. `progreso/fase-6.1.md` (último handoff)
4. Sección F6.2 de `docs/guia_desarrollo.md`

**Prerrequisito de F6.2:** `pnpm test:run` pasa **327 tests verdes**.

**F6.2 debe:**

- Instalar Sentry SDK y Vercel Analytics.
- Configurar Sentry con `sendDefaultPii: false` + `beforeSend` que filtra contenido de cartones, fotos, números de sesión, etc. (ver CLAUDE.md sección "Logging").
- Añadir `VITE_SENTRY_DSN` a `.env.example` y a Vercel.
- Tracking de uso con Vercel Analytics (cero PII).

**Pendientes de QA manual de F6.1 (no bloquean F6.2):**

- Lighthouse PWA = 100 (correr en deploy de Vercel, no en localhost). La PWA solo se sirve correctamente en HTTPS — `pnpm preview` funciona pero conviene validar en el deploy real.
- Instalación en Android Chrome y iOS Safari (verificar ícono y nombre).
- Funcionamiento en modo avión tras primera carga.
- Probar el prompt de actualización subiendo una nueva versión.

**OCR — si vuelve a la mesa:**

- Ver `docs/adr/0004-ocr-pausado-v1.md` — tabla con 5 alternativas (Gemini Vision recomendada por calidad/costo).
- Cambiar `FEATURES.ocr` a `true` reactiva todo el flujo F5.4 inmediatamente (los tests siguen verdes).
- El SW NO precachea los assets de Tesseract; `runtimeCaching` los descarga la primera vez con `CacheFirst` (configurado en F6.1).
- F5.5 (calibración 4 esquinas) y F5.6 (top-N + debug) están fuera del plan corto.

---

## Bitácora rápida

| Fecha      | Evento                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-17 | **F6.1 completada**: PWA con vite-plugin-pwa. Manifest, íconos 192/512/maskable, SW con precache 383 KiB excluyendo Tesseract. PWAUpdatePrompt (modo `prompt`). 327 tests.    |
| 2026-05-16 | **Cierre M3 → tag `v0.4.0` (local)**: juego presencial sin OCR completo y pulido. ROADMAP actualizado.                                                                        |
| 2026-05-16 | Polish `/patrones`: cards visuales con MiniPatronGrid (compartido con panel flotante), nombre opcional con auto-generación "Patrón N". 321 tests.                             |
| 2026-05-16 | Fix bug: cartones se perdían al recargar `/jugar` (faltaba cargarCartones/cargarPatrones en useEffect). Añadido botón "Modo juego" + flujo elegir patrón desde `/patrones`.   |
| 2026-05-16 | Rediseño `/jugar`: panel flotante de patrón, InputNumeroSorteado, UltimoNumeroDisplay, TableroGeneral (renombre). Layout reordenado.                                          |
| 2026-05-15 | OCR pausado en UI tras prueba real (feature flag `FEATURES.ocr=false`). F5.5/F5.6 fuera del plan corto. ADR-0004 documenta alternativas v1.5+. 284 tests verdes.              |
| 2026-05-15 | F5.4 completada: rediseño OCR — preprocess Canvas (gris/contraste/Otsu) + OCR por celda con PSM=8. 30 tests nuevos, 281 totales. **Precisión insuficiente en foto real.**     |
| 2026-05-15 | Fix CSP runtime: auto-host worker+core de Tesseract (vite-plugin-static-copy), `'wasm-unsafe-eval'` en script-src para compilar WASM.                                         |
| 2026-05-15 | F5.3 completada: RevisionOCR (grilla editable, confianza visual), CrearCartonOCR refactorizado, warning < 30%. 17 tests nuevos, 272 totales. F5 v1 ✅ (reemplazada por F5 v2) |
| 2026-05-15 | F5.2 completada: post-process.ts (estructurarEnGrilla + consolidarCandidatos), 3 tipos nuevos, 21 tests nuevos, 255 totales.                                                  |
| 2026-05-15 | F5.1 completada: tesseract.js 7.0.0, core/ocr/, CrearCartonOCR lazy-loaded, 15 tests nuevos, 234 totales.                                                                     |
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas.                                                                                      |
| 2026-05-14 | F1.1 completada: bootstrap con Vite+React+TS+Tailwind, tubería de calidad operativa, 1 test verde.                                                                            |
| 2026-05-14 | F1.2 completada: react-router-dom v7, estructura de carpetas, Layout, 3 rutas, 5 tests verdes.                                                                                |
| 2026-05-15 | F2.1 completada: tipos, validación Zod, generador puro. 48 tests nuevos, cobertura 81.81%.                                                                                    |
| 2026-05-15 | F2.2 completada: almacenamiento, Zustand store, CartonGrid, formulario, MisCartones. 79 tests.                                                                                |
| 2026-05-15 | F3.1 completada: motor-juego puro (marcado, victoria, ranking). 41 tests nuevos, 120 totales.                                                                                 |
| 2026-05-15 | F3.2 completada: editor visual de patrones, PatronCanvas táctil, store Zustand. 19 tests nuevos, 139 totales.                                                                 |
| 2026-05-15 | F3.3 completada: store sesión, ConfiguracionJuego, Jugar actualizado. 30 tests nuevos, 169 totales.                                                                           |
| 2026-05-15 | F4.1 completada: TecladoNumerico (1-75), marcado en vivo de cartones, historial. 22 tests nuevos, 191 totales.                                                                |
| 2026-05-15 | F4.2 completada: CartonRankeado (memo), ranking dinámico en /jugar, badges BINGO/MUY CERCA/CASI. 18 tests nuevos, 209 totales.                                                |
| 2026-05-15 | F4.3 completada: Modal.tsx, HistorialSorteados, reiniciar con modal, cargarSesion en useEffect. 10 tests nuevos, 219 totales. F4 ✅                                           |
