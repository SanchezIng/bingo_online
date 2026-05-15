# Handoff — Subfase F4.2: Ranking dinámico de cartones

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F4.3 — Historial de números sorteados y reinicio de sesión

---

## Lo que se hizo

### Archivos creados

- `src/modo-presencial/components/CartonRankeado.tsx` — componente `React.memo` que muestra posición, badge y "Faltan N casillas"
- `src/modo-presencial/components/CartonRankeado.test.tsx` — 13 tests

### Archivos modificados

- `src/modo-presencial/pages/Jugar.tsx` — usa `rankingComputed()` para ordenar cartones, renderiza `CartonRankeado`
- `src/modo-presencial/pages/Jugar.test.tsx` — 5 tests de ranking añadidos; tests de marcado actualizados con mock de ranking

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 209 tests verdes (18 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública final de los módulos creados

### `src/modo-presencial/components/CartonRankeado.tsx`

```typescript
interface CartonRankeadoProps {
  carton: Carton
  posicion: number           // 1-indexed
  entrada: RankingEntry      // { cartonId, faltan, ganado }
  numerosSorteados: number[]
}

const CartonRankeado = memo(function CartonRankeado(props): JSX.Element
// Muestra: #{posicion}, badge (BINGO/MUY CERCA/CASI), CartonGrid, "Faltan N casillas"
// Badge logic:
//   ganado=true → 🏆 ¡BINGO!
//   faltan <= 2  → 🔥 MUY CERCA
//   faltan <= 5  → 🎯 CASI
//   faltan > 5   → sin badge
// textoFaltan:
//   ganado=true    → null (no muestra texto)
//   faltan=Infinity → "Patrón no encontrado"
//   faltan=N        → "Faltan N casilla(s)"
```

### `src/modo-presencial/pages/Jugar.tsx` (cambios)

- Llama `rankingComputed()` en cada render (se actualiza con cada número sorteado)
- Construye `cartonMap = Map<id, Carton>` y mapea el ranking ordenado
- Renderiza `CartonRankeado` con `key={carton.id}` para memoización efectiva

---

## Decisiones tomadas

### 1. `rankingComputed()` llamado en el render de Jugar

No se creó un hook `useRanking()` adicional. `Jugar.tsx` ya suscribe a `useSesionStore()`. Cuando `agregarNumeroSorteado` actualiza `numerosSorteados`, Jugar re-renderiza y `rankingComputed()` se recalcula. Esto es suficiente para la reactividad en tiempo real sin complicar la arquitectura.

### 2. Props de CartonRankeado: `numerosSorteados` (no `casillasMarcadas`)

Se pasa `numerosSorteados` en lugar de un `Set<string>` pre-computado. Razón: cuando solo cambia `pedirConfirma` (estado local de Jugar), `numerosSorteados` mantiene la misma referencia (es estado de Zustand sin cambios), así `React.memo` evita el re-render de todos los `CartonRankeado`. Si se pasara un `Set` computado en el padre, sería una nueva referencia cada render.

### 3. Tests de Jugar actualizados

Los tests que verifican renderizado de cartones ahora mockan `rankingComputed` con entradas válidas. La razón: `Jugar.tsx` ya no itera `cartones` directamente — usa el ranking. Sin mock de ranking, los cartones no se renderizan aunque `mockCartones` tenga datos.

### 4. IDs de cartones en tests: no UUID válidos

Los cartones fixture de los tests de ranking (`id-carton-a000-...`) no son UUIDs RFC 9562 válidos, pero no pasan por la validación Zod del módulo de cartones. Son solo keys de React/Map en el contexto del mock — no hay problema.

---

## Sorpresas encontradas

Ninguna. La implementación fue directa.

---

## Lo que necesita F4.3

### Prerequisitos verificados antes de arrancar F4.3

- [x] `pnpm test:run` pasa 209 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] Ranking visible en `/jugar` con posición y badges
- [x] `rankingComputed()` disponible y funcional

### Lo que F4.3 debe hacer

1. Crear `src/modo-presencial/components/HistorialSorteados.tsx`:
   - Lista los números sorteados agrupados por serie B/I/N/G/O
   - Cada serie en su fila con título
   - Números en orden de aparición

2. En `Jugar.tsx`, botón "Ver historial" abre un Modal con ese componente

3. Mejorar: persistir `sesion.numerosSorteados` en localStorage para sobrevivir recargas
   - Añadir `subscribe` de Zustand en el store de sesión
   - Nota: la persistencia básica ya existe (`guardarSesion`/`leerSesion`), pero el store no se recarga al montar — revisar si falta un `cargarSesion()` en `useEffect`

4. Tests:
   - HistorialSorteados con [5, 18, 33, 47]: muestra "B: 5", "I: 18", etc.
   - Reiniciar sesión vacía los números sorteados
   - Al recargar, los números sorteados siguen ahí

### Advertencias para F4.3

- El historial scrollable ya existe en `Jugar.tsx` (los últimos 10 números en chips). El `HistorialSorteados` de F4.3 es diferente: agrupado por serie en un modal.
- El botón "Reiniciar" en 2 pasos ya existe. F4.3 pide un modal separado de confirmación — evaluar si simplemente mejora el existente o añade un nuevo modal.
- `cargarSesion()` existe en el store pero no hay un `useEffect` que lo llame en ningún componente todavía — esto es la parte de "persistencia a recargas" que F4.3 debe completar.
