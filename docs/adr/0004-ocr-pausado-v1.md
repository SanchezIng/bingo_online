# ADR-0004: OCR de cartones pausado en v1; alternativas para v1.5+

**Fecha:** 2026-05-15
**Estado:** Aceptado

---

## Contexto

La fase F5 de la guía de desarrollo (`docs/guia_desarrollo.md`) tenía como objetivo el OCR de cartones físicos: el usuario toma una foto, Tesseract.js detecta los números y propone una grilla 5×5 que el usuario corrige antes de guardar. El roadmap (M4 — "producto diferenciado") considera el OCR el principal valor diferencial del producto sobre alternativas manuales.

Se implementaron 4 subfases:

| Subfase | Aproximación                                                                | Resultado real                                                                              |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| F5.1    | Integración Tesseract.js, captura desde cámara                              | ✅ Funcional pero sin estructura por celda                                                  |
| F5.2    | Heurística post-procesamiento: bbox → celda 5×5                             | ✅ En tests con fixtures; frágil en práctica                                                |
| F5.3    | UI de revisión editable con colores por confianza                           | ✅ Completa                                                                                 |
| F5.4    | Rediseño: preprocess Canvas (gris/contraste/Otsu) + OCR por celda con PSM=8 | ❌ **Precisión insuficiente** — devuelve números no presentes en el cartón con fotos reales |

Tras probar F5.4 con una foto real de cartón impreso, el OCR consistentemente retornaba números incorrectos. El usuario tomó la decisión de pausar la funcionalidad en lugar de seguir invirtiendo esfuerzo en mejoras incrementales (F5.5 calibración manual + F5.6 top-N candidatos) cuyos rendimientos esperados también son inciertos.

### Causa raíz analizada

Limitaciones acumuladas del approach frontend-only:

1. **Tesseract.js LSTM** está entrenado para texto natural, no para grillas numéricas con tipografía variable y bordes interferentes (líneas de la grilla del cartón).
2. **Preprocesado Canvas** (grayscale → Otsu → contraste) ayuda con iluminación uniforme pero falla con sombras o flash desigual del celular.
3. **Crop equiespaciado 5×5** asume cartón perfectamente perpendicular y llenando el frame; cualquier perspectiva mete texto de celdas vecinas en cada crop.
4. **Sin canal de "top-N candidatos"** estable en `tesseract.js@7` PSM=8 — solo el top-1 se expone.

Las soluciones que cerrarían estas brechas pesan mucho:

- OpenCV.js para detección de bordes + perspective warp → ~8 MB de runtime y rompería el bundle objetivo de v1.
- Modelo Tesseract fine-tuned para dígitos en grids → requiere dataset etiquetado y entrenamiento.
- Mantener el flujo experimental visible al usuario final → mala UX, expectativas erróneas.

---

## Decisión

**El OCR se pausa en la UI de producción.** El código queda en cuarentena tras un feature flag — no se elimina, no se borra, no se descomenta. Se preserva como referencia para reactivación futura con una estrategia distinta.

Acciones tomadas:

1. **Feature flag** en `src/config/features.ts`: `FEATURES.ocr = false`.
2. **`CrearCartonOCR.tsx`** renderiza un banner ("OCR temporalmente deshabilitado") con CTA a creación manual cuando el flag está off. La lógica del flujo OCR permanece en `CrearCartonOCRImpl` debajo del wrapper.
3. **`MisCartones.tsx`** oculta condicionalmente el botón "Crear con foto (OCR)".
4. **Ruta `/cartones/foto`** sigue accesible por URL directa; muestra el banner.
5. **Tests del módulo `core/ocr/`** y de `CrearCartonOCR` (con feature ON mockeado) **siguen ejecutándose**: cubren el código en cuarentena para que no se descomponga.

Roadmap actualizado:

- F5.5 / F5.6 **pausadas indefinidamente**.
- Próxima subfase activa: **F6.1 — PWA con vite-plugin-pwa**.
- Tag `v0.5.0` previsto para cierre de F5 → ya no aplica. Saltar a `v0.6.0` tras F6 si corresponde.

---

## Alternativas para reactivar el OCR (v1.5+)

Si en el futuro se decide retomar, evaluar estas opciones por separado en un nuevo ADR. Cada una rompe alguna restricción actual de v1 (sin backend, sin secrets):

### 1. Google Cloud Vision API (text detection)

- **Calidad:** muy alta. Maneja perspectiva, iluminación, tipografías arbitrarias.
- **Costo:** ~$1.50 por 1000 imágenes.
- **Implementación:** la API key NO puede ir al cliente. Requiere proxy: Vercel Edge Function o ruta de Supabase Functions.
- **Cambios v1 que requiere:** introducir backend Edge Functions (rompe "v1 sin backend" del ADR-0001).
- **Latencia:** ~1-3s incluyendo round-trip.
- **Privacidad:** la foto sale del dispositivo. Hay que actualizar threat-model y aviso al usuario.

### 2. Gemini Vision API (multimodal)

- **Calidad:** comparable a Cloud Vision; además puede entender "extrae los 24 números de este cartón de bingo agrupados por columna B-I-N-G-O" en lenguaje natural.
- **Costo:** Gemini 2.0 Flash ~$0.10 por 1000 imágenes (más barato).
- **Implementación:** misma que Google Cloud Vision (API key server-side).
- **Ventaja extra:** un solo call ya devuelve la estructura, sin post-procesamiento.

### 3. AWS Textract

- **Calidad:** especializado en formularios y tablas. Excelente para grillas.
- **Costo:** ~$1.50 por 1000 con análisis de forms.
- **Implementación:** AWS SDK + IAM, requiere backend.
- **Mismas implicaciones de privacidad y backend que las anteriores.**

### 4. Tesseract.js en backend Node con OpenCV preprocesado

- **Calidad:** mejor que frontend (puede usar OpenCV completo: edge detection, contour finding, perspective warp), pero sigue Tesseract.
- **Costo:** $0 en LLM/API. Solo CPU del servidor.
- **Implementación:** Edge Function de Vercel + Tesseract.js Node + OpenCV (Node-canvas).
- **Limitaciones:** Edge Functions tienen límites de CPU/memoria. Procesar imágenes grandes puede timeout.

### 5. Modelo CV específico para cartones de bingo

- **Calidad:** la más alta si se entrena bien.
- **Costo:** alto en tiempo (dataset, etiquetado, entrenamiento). $0 en runtime.
- **Implementación:** ML pipeline (PyTorch/TensorFlow), exportar a ONNX o tflite, runtime con onnxruntime-web (~5 MB).
- **Privacidad:** se puede correr frontend.
- **Plazo realista:** semanas/meses.

### Tabla de comparación

| Opción              | Calidad  | Costo runtime | Rompe "v1 sin backend"  | Privacidad foto | Esfuerzo implementación |
| ------------------- | -------- | ------------- | ----------------------- | --------------- | ----------------------- |
| Gemini Vision       | Muy alta | $0.10/1000    | Sí (Edge Function)      | Sale del device | Bajo                    |
| Google Cloud Vision | Muy alta | $1.50/1000    | Sí                      | Sale del device | Bajo                    |
| AWS Textract        | Muy alta | $1.50/1000    | Sí                      | Sale del device | Medio                   |
| Tesseract backend   | Media    | $0            | Sí                      | Sale del device | Medio                   |
| Modelo CV propio    | Muy alta | $0            | No (puede ser frontend) | Stays local     | Alto                    |

**Recomendación tentativa para v1.5+:** Gemini Vision por relación calidad/costo, asumiendo que el usuario acepta la implicación de privacidad documentada en el threat-model actualizado.

---

## Consecuencias

### Positivas

- El usuario final no ve flujo experimental que da resultados erróneos (mejor UX).
- El roadmap avanza: F6.1 (PWA) puede empezar sin bloqueo de F5.5/F5.6.
- El código OCR permanece en el repo bajo tests — listo para reactivar cuando se decida estrategia.
- Las dependencias `tesseract.js` y `tesseract.js-core` se mantienen instaladas: si más adelante se decide backend Tesseract, se reutiliza la pipeline de preprocess.

### Negativas

- Pérdida temporal del feature diferencial del producto. M4 ("producto diferenciado") queda incumplido en v1.
- Bundle sigue cargando `worker.min.js` y `tesseract-core/*` (vía `vite-plugin-static-copy`) aunque no se usen. Ver "Pendiente" abajo.
- Los handoffs F5.1 / F5.2 / F5.3 / F5.4 mencionan trabajo que no llega a producción. Está documentado en `progreso/estado-actual.md` y en este ADR.

### Pendiente (no en este ADR)

- **Decidir si limpiar los assets de Tesseract del bundle.** Hoy `vite-plugin-static-copy` los emite (~12 MB). Mientras `FEATURES.ocr === false`, son peso muerto en el deploy. Opciones:
  - a) Dejarlos: el día que se reactive el flag funciona inmediatamente, no requiere rebuild.
  - b) Quitarlos del build cuando `FEATURES.ocr === false` (condicional en `vite.config.ts`). Requiere ADR específico.
- **Quitar el chunk lazy `CrearCartonOCR-*.js`** del bundle si nunca se carga la ruta. Vite ya lo separa; el banner es un componente pequeño, así que el costo es mínimo.

---

## Decisiones que reemplaza

Este ADR no reemplaza ningún ADR previo. Ajusta el alcance funcional de v1 que en ADR-0001 ("alcance v1 sin backend") asumía OCR funcional.

## Decisiones futuras esperadas

- ADR-0005 (cuando se retome): "estrategia de OCR de cartones para v1.5+" — elige una de las 5 alternativas listadas arriba.
- ADR-0006 (si la elegida requiere backend): "introducción de Vercel Edge Functions / Supabase Functions en v1.5".
