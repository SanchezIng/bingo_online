# Handoff — Subfase F5.1: Integración de Tesseract.js y captura de imagen

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F5.2 — Post-procesamiento: estructurar OCR en grilla 5×5

---

## Lo que se hizo

### Archivos creados

- `src/core/ocr/types.ts` — tipos `BboxOCR`, `BloqueOCR`, `ResultadoOCRBruto`, `OcrError`, `OcrErrorTipo`
- `src/core/ocr/tesseract.ts` — función `procesarImagenOCR(file, onProgreso?)` con worker Tesseract
- `src/core/ocr/index.ts` — API pública del módulo
- `src/core/ocr/tesseract.test.ts` — 8 tests unitarios (worker mockeado)
- `src/modo-presencial/pages/CrearCartonOCR.tsx` — UI de captura/subida y resultado bruto
- `src/modo-presencial/pages/CrearCartonOCR.test.tsx` — 7 tests de la UI

### Archivos modificados

- `pnpm-workspace.yaml` — añadido `tesseract.js: true` en `allowBuilds`
- `src/lib/router.tsx` — ruta `/cartones/foto` con `React.lazy` + `Suspense`
- `src/modo-presencial/pages/MisCartones.tsx` — botón "Crear con foto (OCR)" → `/cartones/foto`
- `src/test-setup.ts` — mock global `URL.createObjectURL` y `URL.revokeObjectURL` (jsdom no los implementa)
- `vercel.json` — `connect-src` ampliado con `https://cdn.jsdelivr.net` para modelos Tesseract
- `package.json` + `pnpm-lock.yaml` — `tesseract.js 7.0.0` añadido

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 234 tests verdes (21 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |
| `pnpm build`     | ✅ bundle ok; chunk OCR separado  |

---

## API pública final de los módulos creados

### `src/core/ocr/types.ts`

```typescript
interface BboxOCR {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface BloqueOCR {
  texto: string
  confianza: number
  bbox: BboxOCR
}

interface ResultadoOCRBruto {
  texto: string
  bloques: BloqueOCR[]
}

type OcrErrorTipo = 'archivo_invalido' | 'procesamiento_fallido' | 'sin_texto'

interface OcrError {
  tipo: OcrErrorTipo
  mensaje: string
}
```

### `src/core/ocr/tesseract.ts`

```typescript
async function procesarImagenOCR(
  file: File,
  onProgreso?: (progreso: number) => void,
): Promise<Result<ResultadoOCRBruto, OcrError>>
// Crea worker con lang='eng', OEM=1 (LSTM only).
// Configura tessedit_char_whitelist='0123456789'.
// Extrae palabras navegando blocks→paragraphs→lines→words.
// Garantiza worker.terminate() en finally.
// Errores: archivo_invalido (no imagen), sin_texto, procesamiento_fallido.
```

### `src/modo-presencial/pages/CrearCartonOCR.tsx`

- Ruta: `/cartones/foto` (lazy-loaded)
- Etapas: `seleccion` → `procesando` → `resultado` | `error`
- Input con `accept="image/*" capture="environment"` (cámara en móvil)
- Barra de progreso con `role="progressbar"` + `aria-valuenow`
- En resultado: chips de números detectados con confianza en tooltip
- `<details>` con texto bruto colapsado

---

## Decisiones tomadas

### 1. Tesseract.js 7.0.0 (no v5)

pnpm instaló v7.0.0, la versión más reciente disponible tras el cooldown de 24h. La API es compatible con lo que describe la guía (misma firma de `createWorker`, `setParameters`, `recognize`, `terminate`). Se documentó en `allowBuilds` la justificación.

### 2. Extracción de `words` en lugar de `blocks`

La jerarquía `blocks → paragraphs → lines → words` da la granularidad correcta: cada número del cartón de bingo es una `word` de Tesseract. Los `blocks` de alto nivel agrupan párrafos completos y son menos útiles para la asignación por celda que hará F5.2.

### 3. Lazy-load confirmado en build

El build de Vite genera `CrearCartonOCR-[hash].js` (18 kB) separado del bundle principal (339 kB). Tesseract.js no aparece en el bundle porque se carga a través del worker de Tesseract en runtime, no vía `import` estático.

### 4. `URL.createObjectURL` mockeado globalmente en test-setup

jsdom no implementa la API de Blob URLs del navegador. Se añadió en `src/test-setup.ts` en lugar de en tests individuales para que esté disponible en futuros componentes que muestren imágenes con `URL.createObjectURL`.

### 5. CSP en vercel.json ampliado con jsDelivr

Tesseract.js v7 descarga sus modelos de lenguaje (`eng.traineddata`) desde `cdn.jsdelivr.net` por defecto. Se añadió a `connect-src`. Si en el futuro se decide alojar los modelos localmente (en `public/tessdata/`), se puede eliminar esa entrada del CSP.

### 6. OcrError usa `errors` (no `error`) para alinearse con el patrón Result

El tipo `Result<T,E>` definido en `core/cartones/types.ts` usa `errors` en la rama `{ ok: false }`. `procesarImagenOCR` sigue ese patrón: `{ ok: false, errors: OcrError }`.

---

## Sorpresas encontradas

### pnpm modificó `pnpm-workspace.yaml` automáticamente

Al correr `pnpm add tesseract.js` y detectar que requería build scripts, pnpm añadió automáticamente `tesseract.js: set this to true or false` en `allowBuilds`. Se reemplazó ese placeholder con `true` manualmente.

### TypeScript detectó comparación imposible en el componente

`etapa !== 'procesando'` dentro de un bloque que solo se ejecuta cuando `etapa` es `'seleccion' | 'resultado' | 'error'` es siempre verdadero. TypeScript lo detecta como error TS2367. Se reemplazó por `etapa === 'seleccion'` que tiene la semántica correcta (el botón "Procesar OCR" no debe aparecer después de ya tener un resultado).

---

## Estado del bundle

```
dist/assets/CrearCartonOCR-[hash].js  18.36 kB │ gzip:   7.17 kB   ← chunk OCR
dist/assets/index-[hash].js          339.17 kB │ gzip: 104.93 kB   ← bundle principal
```

El chunk OCR solo se descarga cuando el usuario navega a `/cartones/foto`. ✅

---

## Lo que necesita F5.2

### Prerequisitos verificados antes de arrancar F5.2

- [x] `pnpm test:run` pasa 234 tests verdes
- [x] `pnpm lint && pnpm typecheck && pnpm build` limpios
- [x] `/cartones/foto` accesible en la app
- [x] `ResultadoOCRBruto` con `bloques` correctamente tipados (bbox incluido)

### Lo que F5.2 debe hacer

1. Crear `src/core/ocr/post-process.ts` con:
   - `estructurarEnGrilla(resultado: ResultadoOCRBruto, dimensiones: { w: number; h: number }): GrillaDetectada`
   - `consolidarCandidatos(grilla: GrillaDetectada): NumerosCartonParcial`
2. Heurística: dividir imagen en grilla 5×5, asignar cada bloque a su celda por coordenadas del centro
3. Validar rango por columna (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75)
4. Bajar confianza a 'baja' si el número no corresponde al rango de su columna
5. Tests con fixtures (sin llamada real a Tesseract)

### Advertencias para F5.2

- `BboxOCR` ya está definido en `src/core/ocr/types.ts` — importar desde ahí
- `NumerosCartonParcial` ya existe en `src/core/cartones/types.ts` — reusar
- `GrillaDetectada` es un tipo nuevo que F5.2 debe añadir a `src/core/ocr/types.ts`
- La celda (2,2) es FREE — en `estructurarEnGrilla` no se asigna ningún bloque a esa celda
- Los `bloques` de `ResultadoOCRBruto` tienen bboxes en píxeles absolutos de la imagen original
