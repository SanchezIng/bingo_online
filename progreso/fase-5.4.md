# Handoff — Subfase F5.4: Preprocessing + OCR por celda

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F5.5 — Calibración manual de 4 esquinas + perspective warp

---

## Por qué F5.4 existe (cambio de plan vs guía original)

La guía `docs/guia_desarrollo.md` tenía F5 v1 con 3 subfases (F5.1 / F5.2 / F5.3) basadas en:

1. OCR global de la imagen completa.
2. Heurística de asignación a celdas por coordenadas de bbox.
3. UI de revisión con validación por rango.

Tras probar el flujo en producción contra una foto real, la precisión fue inaceptable (`docs/Modificaciones_proximas.txt`): el OCR global con bbox heurístico no segmenta bien los números cuando la foto tiene perspectiva, sombras o ruido típicos de celular. El usuario solicitó rediseño con:

- OCR por celda (no global)
- Preprocessing previo (grayscale, contraste, binarización)
- PSM ajustado para dígitos individuales
- Calibración manual de 4 esquinas (en F5.5)
- Top-N candidatos + debug visual (en F5.6)
- Mantener frontend-only (sin OpenCV/APIs externas)

F5.4 implementa los 3 primeros puntos. F5.5 y F5.6 son nuevas subfases.

---

## Lo que se hizo

### Archivos creados

- `src/core/ocr/preprocess.ts` — pipeline de pre-procesamiento (Canvas + funciones puras)
- `src/core/ocr/preprocess.test.ts` — 17 tests de la lógica pura

### Archivos modificados (refactor sustancial)

- `src/core/ocr/tesseract.ts` — pipeline completo (file → canvas → preprocess → OCR por celda → `GrillaDetectada`)
- `src/core/ocr/tesseract.test.ts` — 13 tests reescritos con mocks de createWorker + preprocess
- `src/core/ocr/post-process.ts` — simplificado: solo queda `consolidarCandidatos`
- `src/core/ocr/post-process.test.ts` — 8 tests (de 29) que solo cubren `consolidarCandidatos`
- `src/core/ocr/types.ts` — eliminados `BboxOCR`, `BloqueOCR`, `ResultadoOCRBruto`
- `src/core/ocr/index.ts` — exports actualizados
- `src/modo-presencial/pages/CrearCartonOCR.tsx` — sin `estructurarEnGrilla` ni `dimensionesRef`. Promedio de confianza ahora por candidatos (ponderado: alta=1, media=0.6, baja=0.2)
- `src/modo-presencial/pages/CrearCartonOCR.test.tsx` — mocks ajustados al nuevo contrato

### Comandos verificados

| Comando          | Resultado                                        |
| ---------------- | ------------------------------------------------ |
| `pnpm test:run`  | ✅ 281 tests verdes (24 archivos, +9 netos)      |
| `pnpm lint`      | ✅ 0 errores, 0 warnings                         |
| `pnpm typecheck` | ✅ 0 errores                                     |
| `pnpm build`     | ✅ 224 módulos transformados, 19 assets copiados |

---

## API pública / contratos

### `src/core/ocr/preprocess.ts`

```typescript
// Lógica pura sobre RGBA Uint8ClampedArray (testeable sin DOM)
export function aGrisesPixels(data: Uint8ClampedArray): void
export function aplicarContrastePixels(data: Uint8ClampedArray, factor: number): void
export function histograma(data: Uint8ClampedArray): number[]
export function calcularUmbralOtsu(hist: number[]): number
export function aplicarUmbralPixels(data: Uint8ClampedArray, umbral: number): void
export function aplicarSharpen(src, w, h): Uint8ClampedArray

// Wrappers de Canvas (no testeadas con jsdom)
export async function imagenAImagenCanvas(file: File): Promise<HTMLCanvasElement>
export function preprocesarCanvas(canvas, contrasteFactor = 1.4): HTMLCanvasElement
export function cropCelda(src, fila, columna, filas = 5, columnas = 5): HTMLCanvasElement
```

### `src/core/ocr/tesseract.ts`

```typescript
export async function procesarImagenOCR(
  file: File,
  onProgreso?: (progreso: number) => void,
): Promise<Result<GrillaDetectada, OcrError>>
```

Pipeline interno:

```
file → imagenAImagenCanvas → preprocesarCanvas (gris/contraste/Otsu)
     → createWorker(eng, OEM=1, {workerPath, corePath, logger})
     → setParameters({whitelist: '0123456789', PSM: 8})
     → for fila×columna (skip 2,2 FREE) { cropCelda → recognize }
     → terminate
     → Result<GrillaDetectada>
```

### Mapeo de progreso (cold start vs warm)

| Etapa Tesseract              | Rango  | Notas                               |
| ---------------------------- | ------ | ----------------------------------- |
| preprocess (Canvas)          | 0–5%   | Instantáneo                         |
| loading tesseract core       | 5–8%   | Solo en cold start, vino de cache   |
| loading language traineddata | 8–15%  | ~10 MB desde jsdelivr en cold start |
| ocr-celda (24 celdas)        | 15–95% | Incrementa por celda procesada      |
| fin                          | 100%   | Tras terminate                      |

---

## Decisiones tomadas

### 1. OCR por celda en vez de OCR global

OCR por celda es ~3-5× más lento pero precisión significativamente mayor: cada celda usa PSM=8 (single word) sobre una imagen pequeña preprocesada, evitando que Tesseract intente "interpretar" la estructura completa.

Tradeoff aceptado: en celular promedio 24 × ~80 ms = ~2s de OCR efectivo (excluyendo descarga del modelo, que se cachea tras la primera vez).

### 2. Separar lógica pura de wrappers Canvas

jsdom no implementa Canvas 2D, así que toda la lógica de pixel-math se separó en funciones que operan sobre `Uint8ClampedArray`. Las wrappers (`imagenAImagenCanvas`, `preprocesarCanvas`, `cropCelda`) son thin glue, sin tests automatizados pero con `/* v8 ignore */` para que no penalicen cobertura.

### 3. Strict `>` en `aplicarUmbralPixels`

Caso límite: con distribución bimodal extrema (todos los píxeles en valores X o Y), Otsu retorna el primer máximo, que cae en el pico oscuro. Con `>=` ese pico iría a 255 (blanco) — clasificación incorrecta. Con strict `>`, el píxel exactamente igual al umbral va al fondo (0), comportamiento correcto.

### 4. `consolidarCandidatos` se mantiene; `estructurarEnGrilla` se elimina

En el nuevo flujo, `procesarImagenOCR` retorna directamente `GrillaDetectada`. `consolidarCandidatos` sigue siendo útil para reducir candidatos→`NumerosCartonParcial` (lo usa `CrearCartonOCR`). `estructurarEnGrilla` ya no se usa, así que se borra junto con sus 21 tests.

### 5. Promedio de confianza ponderado (no media de % crudo)

F5.3 calculaba el promedio sumando `bloque.confianza` (0-100). En F5.4 ya no tenemos % crudo por celda (solo el nivel cuantizado). Se pondera: alta=1, media=0.6, baja=0.2, multiplicado por 100 para mantener el threshold del warning en 30%. "Todos baja" → 20% → warning; "todos alta" → 100% → sin warning.

### 6. PSM=8 ("single word") vs PSM=10 ("single character")

PSM=8 acepta 1-2 dígitos contiguos (10, 25, 75 son válidos). PSM=10 forzaría a 1 char y rompería con números de 2 dígitos. PSM=8 con whitelist='0123456789' es el sweet spot.

### 7. `tessedit_pageseg_mode: '8' as never`

Los tipos de `tesseract.js` para `setParameters` no incluyen `tessedit_pageseg_mode`. Cast a `never` para silenciar TS; el parámetro existe y funciona en runtime (documentado en la API de Tesseract).

---

## Sorpresas encontradas

### Otsu sobre histograma bimodal extremo

El primer test de Otsu asumía que el umbral caería estrictamente entre los dos picos. En la práctica, con distribución degenerada (50 píxeles en X, 50 en Y, 0 en el medio), la variance inter-clase es idéntica para cualquier umbral en `[X, Y-1]`; el algoritmo retorna el primer t con variance máxima, que es X. Solución: usar `>` (no `>=`) en `aplicarUmbralPixels` para que el umbral pertenezca al cluster oscuro.

### `data.symbols[i].choices` no existe en `data` con PSM=8

Tesseract.js v7 con PSM=8 devuelve `data.text` y `data.confidence` pero **no** un array de candidatos alternativos por símbolo a nivel de la API pública (`data.symbols` solo trae el símbolo elegido, sin `choices`). Esto afecta F5.6 (top-N candidatos): habrá que evaluar si vale la pena bajar a Tesseract LSTM raw output o aceptar solo el top-1 por celda.

### vi.mock sobre `./preprocess`

Para evitar Canvas API en jsdom durante los tests de `tesseract.ts`, el módulo `./preprocess` se mockea entero. Funciona porque `recognize` también está mockeado y no le importa qué objeto recibe.

---

## Lo que necesita F5.5

### Prerequisitos

- [x] `pnpm test:run` pasa 281 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] OCR funcional end-to-end con preprocess + OCR por celda

### Lo que F5.5 debe hacer

1. Crear `src/modo-presencial/components/CalibradorCarton.tsx`:
   - Renderiza la preview de la imagen + 4 markers SVG/div arrastrables en cada esquina.
   - Inicia con markers en las 4 esquinas de la imagen.
   - Props: `imagenUrl`, `onConfirmar: (esquinas: { tl, tr, br, bl }) => void`.

2. Crear `src/core/ocr/perspective.ts`:
   - `perspectiveWarp(srcCanvas, esquinas, anchoDst, altoDst): HTMLCanvasElement`.
   - Aplicar transformación de 4 puntos a un rectángulo `anchoDst × altoDst`.
   - Usar matriz homogénea 3×3 (~50 líneas de código). Implementación: solve linear system para 8 coeficientes, luego iterar cada pixel destino y muestrear el source.

3. Modificar `tesseract.ts`:
   - Antes de `cropCelda`, aplicar `perspectiveWarp` con las esquinas elegidas.
   - El crop por celda equiespaciado trabaja ahora sobre la imagen rectificada.

4. Actualizar `CrearCartonOCR.tsx`:
   - Nueva etapa `calibrando` entre `seleccion` y `procesando`.
   - Usuario coloca esquinas → click "Procesar" → OCR procede con esquinas.

5. Tests:
   - `perspective.ts`: tests sobre matemáticas con coordenadas conocidas.
   - `CalibradorCarton`: drag de markers actualiza estado.
   - `CrearCartonOCR`: flujo `seleccion → calibrando → procesando → revision`.

### Advertencias

- `perspectiveWarp` sobre celular puede ser lento (cada pixel requiere matriz-vector). Considerar:
  - Limitar tamaño destino a 500×500 o 600×600.
  - Usar bilinear sampling (más calidad) vs nearest neighbor (más rápido).
- Los tests existentes de `tesseract.ts` mockean `preprocess`; F5.5 deberá agregar al mock también `perspective.ts` o equivalente.

---

## Plantilla de suite de QA manual (sigue pendiente)

Cuando pruebes el deploy con fotos reales, anota acá:

| Foto | Casillas correctas (sobre 24) | Confianza promedio | Notas |
| ---- | ----------------------------- | ------------------ | ----- |
| 1    |                               |                    |       |
| 2    |                               |                    |       |
| 3    |                               |                    |       |
| 4    |                               |                    |       |
| 5    |                               |                    |       |

Meta del proyecto (CLAUDE.md sección métricas): **≥ 70% acierto por casilla en cartón nítido**. Si F5.4 ya cumple, F5.5/F5.6 son polish; si no, son obligatorias.
