# Handoff — Subfase F5.2: Post-procesamiento: estructurar OCR en grilla 5×5

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F5.3 — UI de confirmación editable y guardado

---

## Lo que se hizo

### Archivos creados

- `src/core/ocr/post-process.ts` — funciones `estructurarEnGrilla` y `consolidarCandidatos`
- `src/core/ocr/post-process.test.ts` — 21 tests con fixtures (sin Tesseract real)

### Archivos modificados

- `src/core/ocr/types.ts` — añadidos `CandidatoOCR`, `CeldaDetectada`, `GrillaDetectada`
- `src/core/ocr/index.ts` — exporta `estructurarEnGrilla`, `consolidarCandidatos` y los 3 nuevos tipos

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 255 tests verdes (22 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública final

### `src/core/ocr/types.ts` (adiciones)

```typescript
interface CandidatoOCR {
  numero: number
  confianza: 'alta' | 'media' | 'baja'
}

interface CeldaDetectada {
  fila: number
  columna: number
  candidatos: CandidatoOCR[]
}

interface GrillaDetectada {
  celdas: CeldaDetectada[]
}
```

### `src/core/ocr/post-process.ts`

```typescript
function estructurarEnGrilla(
  resultado: ResultadoOCRBruto,
  dimensionesImagen: { w: number; h: number },
): GrillaDetectada
// Siempre retorna 24 celdas (5×5 menos la FREE en (2,2)).
// Asigna bloques por coordenadas del centro del bbox.
// Mapea confianza Tesseract: ≥80→alta, 50-79→media, <50→baja.
// Fuera de rango por columna (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75) → confianza forzada 'baja'.
// Texto no numérico e ignorado. Celda (2,2) bloqueada.

function consolidarCandidatos(grilla: GrillaDetectada): NumerosCartonParcial
// Selecciona el candidato de mayor confianza por celda (alta > media > baja).
// Sin candidatos → null en esa casilla.
// Columna N (col 2) fila 2 → siempre 'FREE'.
```

---

## Decisiones tomadas

### 1. Las 24 celdas siempre presentes en GrillaDetectada

`estructurarEnGrilla` inicializa las 24 celdas (excluyendo FREE) con `candidatos: []` antes de procesar los bloques. Así `consolidarCandidatos` puede hacer un lookup directo por clave `"fila,columna"` sin tratar el caso de celda ausente.

### 2. Confianza fuera de rango → 'baja' (no descarte)

El candidato se mantiene en `candidatos` con confianza `'baja'`. F5.3 mostrará esas celdas en rojo para que el usuario las corrija. Descartar habría perdido el número detectado incluso si Tesseract era correcto y el error era de posición.

### 3. Rango de columna validado en `estructurarEnGrilla`, no en `consolidarCandidatos`

La validación pertenece al paso de estructuración (transforma datos brutos en datos semánticos). `consolidarCandidatos` es una reducción pura que no sabe de rangos.

### 4. `consolidarCandidatos` usa `NumerosCartonParcial` de `@/core/cartones/types`

Reutiliza el tipo existente según lo indicado en el handoff de F5.1. La importación es `import type { NumerosCartonParcial } from '@/core/cartones/types'`.

---

## Sorpresas encontradas

### Import no usado detectado por ESLint

El test importaba `GrillaDetectada` como tipo pero lo infería de la función. ESLint `@typescript-eslint/no-unused-vars` lo marcó como error. Se eliminó del import en el test.

---

## Lo que necesita F5.3

### Prerequisitos antes de arrancar F5.3

- [x] `pnpm test:run` pasa 255 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `estructurarEnGrilla` y `consolidarCandidatos` exportadas desde `@/core/ocr`
- [x] `GrillaDetectada` y `NumerosCartonParcial` tipadas y disponibles

### Lo que F5.3 debe hacer

1. Crear `src/modo-presencial/components/RevisionOCR.tsx`:
   - Props: `grilla: GrillaDetectada`, `numerosBase: NumerosCartonParcial`, `onGuardar: (numeros: NumerosCarton) => void`, `onVolver: () => void`
   - Grilla 5×5 editable: cada celda es un `<input type="number">` con el valor inicial de `numerosBase`
   - Borde de color por confianza del candidato: alta=verde, media=amarillo, baja=rojo, sin candidato=gris punteado
   - Tooltip con porcentaje de confianza del candidato seleccionado
   - Botón "Guardar cartón" deshabilitado hasta que las 24 casillas no-FREE sean números válidos
   - Botón "Volver a tomar foto" → llama `onVolver`

2. Actualizar `CrearCartonOCR.tsx`:
   - Etapas: `seleccion` → `procesando` → `revision` (nuevo) → `error`
   - Al terminar OCR: llamar `estructurarEnGrilla` + `consolidarCandidatos`, pasar a `RevisionOCR`
   - Al confirmar en RevisionOCR: llamar `validarNumerosCarton` de `core/cartones`, luego `agregarCarton(...)` con `fuente='ocr'`, navegar a `/cartones`
   - "Volver a tomar foto" → vuelve a etapa `seleccion`

3. Tests:
   - `RevisionOCR`: muestra valores detectados en inputs; input inválido deshabilita botón guardar; click guardar llama onGuardar con los números editados
   - `CrearCartonOCR`: flujo hasta RevisionOCR mockeando `procesarImagenOCR` + `estructurarEnGrilla`

### Advertencias para F5.3

- `dimensionesImagen` para `estructurarEnGrilla` se obtiene del `<img>` renderizado (`naturalWidth`, `naturalHeight`), no del `File`. El componente debe esperar a que la imagen cargue.
- `RevisionOCR` debe usar `validarNumerosCarton` de `core/cartones` (ya tipada con Zod) para el check de guardado; no reimplementar la validación.
- La celda FREE (N[2]) debe mostrarse en la grilla pero no ser editable (disabled, texto "FREE").
