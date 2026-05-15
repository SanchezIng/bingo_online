# Handoff — Subfase F4.1: Teclado numérico y registro de números sorteados

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F4.2 — Ranking dinámico de cartones

---

## Lo que se hizo

### Archivos creados

- `src/modo-presencial/components/TecladoNumerico.tsx` — teclado 1-75 organizado por columnas BINGO
- `src/modo-presencial/components/TecladoNumerico.test.tsx` — 12 tests
- `src/modo-presencial/pages/Jugar.test.tsx` — 10 tests

### Archivos modificados

- `src/modo-presencial/pages/Jugar.tsx` — UI completa de juego (antes era placeholder)

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 191 tests verdes (17 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública final de los módulos creados

### `src/modo-presencial/components/TecladoNumerico.tsx`

```typescript
export default function TecladoNumerico(): JSX.Element
// Usa useSesionStore directamente (no props)
// Renderiza grilla 5×15 con números 1-75
// Muestra indicador del último número sorteado
// Botón "Deshacer último" (deshabilitado si no hay números)
```

### `src/modo-presencial/pages/Jugar.tsx` (cambios relevantes)

Ahora incluye:

- Header: condición de victoria + conteo + botón Reiniciar (2 pasos)
- Historial: últimos 10 números sorteados (más reciente primero, destacado)
- Layout: `TecladoNumerico` + lista de cartones con `casillasMarcadas` en tiempo real
- Cartones vacíos: mensaje + link a `/cartones/nuevo`

---

## Decisiones tomadas

### 1. TecladoNumerico usa el store directamente

Por coherencia con el patrón del proyecto (ConfiguracionJuego, FormularioCartonManual). Si se necesitara reutilizar el teclado fuera de la sesión de juego, se podría refactorizar a props.

### 2. Orden de números en la grilla: fila×columna

La grilla CSS es `grid-cols-5`, que llena por filas. Para que aparezcan B:1-15 en columna 1, I:16-30 en columna 2, etc., los números se generan con `n = col*15 + row + 1` iterando `i = row*5 + col`:

```
Fila 0: 1, 16, 31, 46, 61
Fila 1: 2, 17, 32, 47, 62
...
Fila 14: 15, 30, 45, 60, 75
```

### 3. Reiniciar en 2 pasos

El botón "Reiniciar" requiere doble confirmación (primer click → "¿Confirmar?", segundo click → acción). Se cancela con `onBlur`. Esto protege contra toques accidentales que borran todos los números sorteados.

### 4. role="region" en el historial

El `div` del historial lleva `role="region"` + `aria-label` para ser consultable por ARIA y por `getByRole('region')` en tests. Un `div` con solo `aria-label` no expone role "region" automáticamente.

---

## Sorpresas encontradas

1. **`role="region"` en `<div>`:** un `<div aria-label="...">` no tiene role "region" implícito — solo `<section aria-label="...">` lo tiene. Solución: añadir `role="region"` explícito. Detectado al fallar el test de historial.

---

## Lo que necesita F4.2

### Prerequisitos verificados antes de arrancar F4.2

- [x] `pnpm test:run` pasa 191 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `TecladoNumerico` renderizado en `/jugar`
- [x] Cartones con casillas marcadas en tiempo real
- [x] `rankingComputed()` disponible en el store de sesión

### Lo que F4.2 debe hacer

1. En `Jugar.tsx`, reemplazar la lista plana de cartones con la lista ordenada por `rankingComputed()`
2. El cartón con menos casillas faltantes aparece primero (ganadores primero)
3. Indicador visual de "faltan N" por cartón
4. El ranking se recalcula con cada número sorteado (reactividad)
5. Tests de reordenación

### Advertencias para F4.2

- `rankingComputed()` es on-demand, no reactivo por suscripción. En F4.2 se necesita un hook `useRanking()` que suscriba a los 3 stores (sesión, cartones, patrones) o que se llame dentro del render de Jugar (que ya se re-renderiza cuando el store de sesión cambia).
- La deuda técnica anotada en `estado-actual.md` sobre esto sigue vigente: evaluar si el render de Jugar es suficiente trigger o si se necesita suscripción explícita.
- `RankingEntry` tiene campos `cartonId`, `faltan`, `ganado`. Usarlos para mostrar "¡BINGO!" cuando `ganado === true`.
