# Handoff — Subfase F5.3: UI de confirmación editable y guardado

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada — **F5 cerrada**
**Siguiente:** F6.1 — Convertir a PWA con vite-plugin-pwa

---

## Lo que se hizo

### Archivos creados

- `src/modo-presencial/components/RevisionOCR.tsx` — componente con grilla 5×5 editable, borde por confianza, validación interna
- `src/modo-presencial/components/RevisionOCR.test.tsx` — 13 tests

### Archivos modificados

- `src/modo-presencial/pages/CrearCartonOCR.tsx` — flujo refactorizado a `seleccion → procesando → revision → error`. Integra OCR + post-process + RevisionOCR + guardado en store + navegación.
- `src/modo-presencial/pages/CrearCartonOCR.test.tsx` — reemplaza el viejo test de "resultado bruto" por tests del flujo de revisión, warning, guardado y navegación. 11 tests (antes 7).

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 272 tests verdes (23 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública / contratos del componente

### `RevisionOCR`

```typescript
interface RevisionOCRProps {
  grilla: GrillaDetectada
  numerosBase: NumerosCartonParcial
  onGuardar: (numeros: NumerosCarton) => void
  onVolver: () => void
}
```

Comportamientos:

- Renderiza grilla 5×5 con encabezados B-I-N-G-O.
- Cada celda no-FREE es un `<input type="number">`. La celda FREE muestra texto "FREE" deshabilitado (sin input).
- Borde por confianza del mejor candidato OCR en esa celda:
  - `alta` → `border-green-500`
  - `media` → `border-amber-500`
  - `baja` → `border-red-500`
  - sin candidato → `border-dashed border-gray-300`
- `title` del input contiene "Confianza alta/media/baja" o "Sin detección OCR".
- Atributo `data-confianza` (`alta` | `media` | `baja` | `ninguna`) — útil en tests.
- Botón "Guardar cartón" deshabilitado hasta que las 24 casillas no-FREE tengan un `number` dentro del rango de su columna.
- Al hacer click en "Guardar cartón":
  1. Ejecuta `validarNumerosCarton(valores)` de `@/core/cartones`.
  2. Si falla, renderiza errores inline en `<ul role="alert">`.
  3. Si pasa, llama `onGuardar(result.value)` con el `NumerosCarton` ya validado.
- "Volver a tomar foto" llama `onVolver()`.

### `CrearCartonOCR` — flujo final

```
seleccion ─(seleccionar archivo + click Procesar)─▶ procesando
procesando ─(OCR ok)──▶ revision    (grilla detectada + numerosBase listos)
procesando ─(OCR error)──▶ error
revision  ─(onVolver)──▶ seleccion  (resetea estado y revoca URL)
revision  ─(onGuardar)─▶ navigate('/cartones', { state: { mensaje } })
error     ─(reintentar)▶ seleccion
```

Pasos al guardar (`handleGuardarCarton`):

1. `crearCartonDesdeNumeros(numeros, { fuente: 'ocr' })` — re-valida y construye un `Carton` con UUID + timestamp.
2. Si falla, transiciona a `error` con mensaje descriptivo.
3. `agregarCarton(result.value)` del store (persiste en localStorage).
4. `navigate('/cartones', { state: { mensaje: 'Cartón creado por OCR.' } })`.

Warning de confianza baja: si el promedio de `bloque.confianza` (0-100) de los bloques detectados es `< 30`, se muestra una caja ámbar encima de RevisionOCR.

---

## Decisiones tomadas

### 1. Validación final dentro de `RevisionOCR`, no en el padre

`RevisionOCR` llama a `validarNumerosCarton` y muestra errores inline (incluidos los duplicados). El padre recibe siempre un `NumerosCarton` válido. Esto mantiene la responsabilidad de UX donde está el formulario (mostrar errores al usuario) y evita un round-trip de errores a través de props.

### 2. `useCartonesStore()` sin selector en `CrearCartonOCR`

Coherente con la nota de memoria del proyecto: los mocks de Zustand con `mockReturnValue` funcionan limpiamente solo cuando el componente desestructura el state completo. `CrearCartonManual` usa selector, pero al no haber tests que requieran mockear su store, no es problema allí.

### 3. Dimensiones de imagen vía `useRef`, no `useState`

`onLoad` solo necesita disponibilizar las dimensiones al click de "Procesar OCR". Guardarlas en `useState` provocaría un re-render innecesario. Se usan en `handleProcesar` y se resetean en `resetEstado`.

### 4. Fallback `{ w: 500, h: 500 }` para dimensiones

JSDOM no dispara `onLoad` en `<img>`. En producción el usuario siempre ve la preview antes de procesar (load ya disparó). En tests, las funciones del módulo `@/core/ocr` están mockeadas y no usan las dimensiones, así que el fallback solo sirve como salvaguarda.

### 5. Mocks de `@/core/ocr` con `procesarImagenOCR` + `estructurarEnGrilla` + `consolidarCandidatos`

Antes (F5.1) solo se mockeaba `procesarImagenOCR`. Ahora el flujo importa también las dos funciones de post-process. Se mockean todas y cada test controla los valores de retorno necesarios.

### 6. Tooltip muestra etiqueta de nivel, no porcentaje

`CandidatoOCR.confianza` ya viene cuantizado a `'alta' | 'media' | 'baja'` desde F5.2 (estructurarEnGrilla pierde el % crudo). En lugar de re-mapear a un % sintético, el tooltip muestra "Confianza alta" / "media" / "baja" — honesto y consistente con el modelo.

### 7. Cuatro etapas: dropped `'resultado'`

La etapa intermedia `'resultado'` (que mostraba chips de bloques crudos) era un placeholder de F5.1. Ahora el flujo va directo a `'revision'`. Se eliminó toda la UI asociada.

---

## Sorpresas encontradas

### Tests pasaron al primer intento

No hubo sorpresas funcionales. La única consideración fue verificar que el mock de `useCartonesStore` debía exponer el shape completo del state (no solo `agregarCarton`) para que la desestructuración en el componente no tropezara con `undefined`.

### `pnpm test:run -- <archivo>` no filtra

Pasar `-- src/modo-presencial/components/RevisionOCR.test.tsx` a `pnpm test:run` no actúa como filtro de archivo — corre toda la suite igual. Para futuras subfases, usar `pnpm test src/modo-presencial/...` o ajustar el script.

---

## Lo que necesita F6.1

### Prerequisitos antes de arrancar F6.1

- [x] `pnpm test:run` pasa 272 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] Flujo OCR end-to-end funcional: foto → revisión → guardado en store

### Lo que F6.1 debe hacer

1. Instalar `vite-plugin-pwa` y configurar generación de service worker (Workbox).
2. Crear `manifest.webmanifest` con metadata de la app + iconos (192×192, 512×512, maskable).
3. Configurar estrategia offline: assets estáticos + index.html como app shell.
4. Verificar:
   - Lighthouse PWA = 100
   - App instalable en Chrome/Safari móvil
   - Funciona offline tras primera carga
5. `vite.config.ts` está en la lista de archivos sensibles (`docs/CLAUDE.md`). Cambios cuidadosos a la sección PWA.

### Advertencias para F6.1

- El bundle inicial de la app actual ya incluye un chunk lazy de Tesseract (~18 KB stub). El SW debe **no** precachear los modelos de Tesseract (vienen de `cdn.jsdelivr.net` y pesan ~2 MB). Considerar `runtimeCaching` con strategy `CacheFirst` y `cacheableResponse: { statuses: [0, 200] }` para esos recursos remotos.
- `vercel.json` ya tiene `cdn.jsdelivr.net` en `connect-src`. Si el plugin-pwa requiere algo adicional al CSP (workers blob, etc.) anotarlo y revisar headers.
- En dev (`pnpm dev`) el plugin-pwa no debe activarse (configurable con `devOptions.enabled = false` o `mode: 'development'` flag).

### Suite manual de QA pendiente (de la guía F5.3)

La guía pedía "5 fotos de prueba de cartones de bingo, anotar tasa de acierto en el handoff". **No se ejecutó en esta sesión** — Claude Code no puede tomar/procesar fotos reales. Queda como **tarea manual del usuario**: cuando pruebes la app desplegada (https://bingo-online-bice.vercel.app/), pasa por `/cartones/foto` con 3-5 cartones reales y anota acá la precisión observada.

**Plantilla:**

| Foto | Casillas correctas (sobre 24) | Notas |
| ---- | ----------------------------- | ----- |
| 1    |                               |       |
| 2    |                               |       |
| 3    |                               |       |
