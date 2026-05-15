# Handoff — Subfase F4.3: Historial de números sorteados y reinicio de sesión

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F5.1 — Integración de Tesseract.js (OCR)

---

## Lo que se hizo

### Archivos creados

- `src/shared/components/Modal.tsx` — componente modal reutilizable (ESC + click fuera cierra, accessible con `role="dialog"`)
- `src/modo-presencial/components/HistorialSorteados.tsx` — números agrupados por serie B/I/N/G/O
- `src/modo-presencial/components/HistorialSorteados.test.tsx` — 7 tests

### Archivos modificados

- `src/modo-presencial/pages/Jugar.tsx` — botón "Ver historial" + modal historial + modal reiniciar + `cargarSesion()` en useEffect
- `src/modo-presencial/pages/Jugar.test.tsx` — 3 tests actualizados (reiniciar → modal) + 3 tests nuevos (historial modal, cargarSesion on mount)

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 219 tests verdes (19 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública final de los módulos creados

### `src/shared/components/Modal.tsx`

```typescript
interface ModalProps {
  titulo: string
  children: React.ReactNode
  onClose: () => void
}

export default function Modal({ titulo, children, onClose }: ModalProps)
// Overlay negro semitransparente. Click fuera o ESC llama onClose.
// role="dialog" + aria-modal="true" + aria-label={titulo}
```

### `src/modo-presencial/components/HistorialSorteados.tsx`

```typescript
interface HistorialSorteadosProps {
  numerosSorteados: number[]
}

export default function HistorialSorteados({ numerosSorteados }: HistorialSorteadosProps)
// Muestra 5 secciones (B/I/N/G/O). Cada sección filtra los números de su rango.
// B=1-15, I=16-30, N=31-45, G=46-60, O=61-75.
// Serie vacía muestra "—". Orden de aparición preservado.
```

### `src/modo-presencial/pages/Jugar.tsx` (cambios)

- `useEffect(() => cargarSesion(), [cargarSesion])` al montar → sesión persiste a recargas
- Dos botones en el header: "Ver historial" (gris) y "Reiniciar" (rojo suave)
- "Ver historial" → `verHistorial=true` → `<Modal><HistorialSorteados /></Modal>`
- "Reiniciar" → `pedirConfirmaReinicio=true` → `<Modal>` con texto + botones Cancelar/Confirmar
- "Confirmar" llama `reiniciarSesion()` y cierra modal

---

## Decisiones tomadas

### 1. Modal como componente compartido en `shared/`

Se creó en `src/shared/components/Modal.tsx` porque se usa dos veces en `Jugar.tsx` (historial + reinicio) y es candidato a usarse en F5 (confirmación de OCR). No se usó Portal (`ReactDOM.createPortal`) para mantener la simplicidad — en esta app no hay problemas de z-index que lo requieran.

### 2. `cargarSesion()` en `useEffect` de `Jugar.tsx`

Patrón consistente con `cargarCartones()` en `MisCartones.tsx` y `cargarPatrones()` en `EditorPatrones.tsx`. Cada página carga sus propios datos. Si el usuario entra directamente a `/jugar`, la sesión se recupera del localStorage.

### 3. Modal de reiniciar reemplaza el botón 2-pasos

El botón `pedirConfirma` existente fue reemplazado por un modal explícito. Ventaja: el texto "Tus cartones y patrones se mantienen" aclara exactamente qué se borra, reduciendo el miedo del usuario a tocar el botón por error.

### 4. Tests de reinicio actualizados (no rota hacia atrás)

Los tests `'botón Reiniciar muestra confirmación en dos pasos'` y `'confirmar reinicio llama reiniciarSesion'` fueron reemplazados con equivalentes que verifican el modal. Los nuevos tests verifican: apertura de modal, confirmación, y cancelación sin efecto.

---

## Sorpresas encontradas

Ninguna. La implementación fue directa. El patrón de Modal es estándar.

---

## Estado del tag intermedio

La guía sugiere tag `v0.4.0` al cerrar F4 ("bingo presencial funcional end-to-end sin OCR"). F4 está completa. El tag puede aplicarse cuando el usuario lo decida.

---

## Lo que necesita F5.1

### Prerequisitos verificados antes de arrancar F5.1

- [x] `pnpm test:run` pasa 219 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] Historial visible en modal agrupado por serie
- [x] Reiniciar con modal de confirmación
- [x] Sesión persiste a recargas

### Lo que F5.1 debe hacer

1. Instalar Tesseract.js (`pnpm add tesseract.js`)
2. Crear `src/core/ocr/` con tipos y función `procesarImagen(file: File): Promise<Result<NumerosCartonParcial, OcrError>>`
3. UI mínima: botón "Subir foto del cartón" en `/cartones/nuevo` o ruta separada
4. Tests: mock de Tesseract, resultado parcial, manejo de error

### Advertencias para F5.1

- `src/core/ocr/` no debe existir hasta F5.1 — la guía lo prohíbe explícitamente en CLAUDE.md
- Tesseract.js trabaja con workers; el import puede requerir configuración especial en Vite
- Las fotos del cartón JAMÁS salen del dispositivo (OCR 100% en cliente). Nunca añadir un endpoint que reciba imágenes.
- El flujo obliga confirmación manual del usuario (el OCR no es perfecto) — el score de confianza por casilla debe mostrarse
