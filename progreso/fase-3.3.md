# Handoff — Subfase F3.3: Integración del motor con stores y configuración de victoria

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F4.1 — Teclado numérico y registro de números sorteados

---

## Lo que se hizo

### Archivos creados

- `src/lib/stores/sesion.ts` — Zustand store de sesión con estado, acciones y `rankingComputed`
- `src/lib/stores/sesion.test.ts` — 21 tests (estado inicial, cada acción, integración con motor)
- `src/modo-presencial/pages/ConfiguracionJuego.tsx` — página `/configurar` con radio buttons para los 3 tipos de condición
- `src/modo-presencial/pages/ConfiguracionJuego.test.tsx` — 9 tests

### Archivos modificados

- `src/core/almacenamiento/localStorage.ts` — `leerSesion`/`guardarSesion` tipadas con `EstadoSesion` (antes `unknown`)
- `src/modo-presencial/pages/Jugar.tsx` — reemplazado placeholder con vista de sesión activa
- `src/lib/router.tsx` — ruta `/configurar` → `ConfiguracionJuego` añadida

### Comandos verificados

| Comando          | Resultado                         |
| ---------------- | --------------------------------- |
| `pnpm test:run`  | ✅ 169 tests verdes (15 archivos) |
| `pnpm lint`      | ✅ 0 errores, 0 warnings          |
| `pnpm typecheck` | ✅ 0 errores                      |

---

## API pública final de los módulos creados

### `src/lib/stores/sesion.ts`

```typescript
export const useSesionStore // Zustand store
// State:
//   condicionVictoria: CondicionVictoria (default: { tipo: 'cartonLleno' })
//   numerosSorteados: number[]
//   iniciadaEn: string | null
// Actions:
//   establecerCondicion(c: CondicionVictoria): void
//   agregarNumeroSorteado(n: number): void  — ignora si sin sesión o duplicado
//   deshacerUltimoNumero(): void             — ignora si sin sesión o lista vacía
//   reiniciarSesion(): void                  — resetea números, marca iniciadaEn=now
//   cargarSesion(): void                     — carga desde localStorage
//   rankingComputed(): RankingEntry[]        — usa getState() de otros stores
```

### `src/core/almacenamiento/localStorage.ts` (cambios relevantes)

```typescript
// Antes: leerSesion(): unknown | null
// Ahora:
export function leerSesion(): EstadoSesion | null // con validación estructural
export function guardarSesion(sesion: EstadoSesion): Result<void, string>
```

---

## Decisiones tomadas

### 1. `rankingComputed` como función getter, no selector reactivo

`rankingComputed` se implementó como `() => RankingEntry[]` dentro del store, llamando a `useCartonesStore.getState()` y `usePatronesStore.getState()` directamente. Esto evita depender de hooks dentro del store. La función se llama on-demand desde componentes, no como selector reactivo — el ranking reactivo en tiempo real es responsabilidad de F4.

### 2. Separación store ↔ tipo persistido

`EstadoSesion` usa `condicionActiva` (nombre del tipo original). El store usa `condicionVictoria` internamente. El mapping explícito se hace en `reiniciarSesion`/`agregarNumeroSorteado`/`deshacerUltimoNumero` al construir el objeto `EstadoSesion` para persistir, y en `cargarSesion` al leer. Esto mantiene el nombre del tipo original intacto.

### 3. Stores sin selectores en componentes

`ConfiguracionJuego` y `Jugar` usan desestructuración sin selectores (`const { patrones } = usePatronesStore()`). Razón práctica: los mocks de vitest con `vi.mock` + `mockReturnValue` ignoran el argumento selector — si se usa `useStore((s) => s.campo)`, el mock devuelve el objeto completo y no el campo extraído. La consistencia con los otros componentes también apoya esta decisión.

### 4. Validación estructural en `leerSesion`

Se añadió validación explícita antes de castear el `unknown` parseado a `EstadoSesion`. Comprueba que `numerosSorteados` es array, `iniciadaEn` es string, y `condicionActiva` es objeto. Silencia datos corruptos retornando `null`.

### 5. `Jugar.tsx` flujo sin sesión

Si `iniciadaEn === null`, muestra CTA directo a `/configurar`. Si hay sesión activa, muestra resumen (condición, cartones, números sorteados). El marcador de números llega en F4.1.

---

## Sorpresas encontradas

1. **Selectores en mocks de Zustand:** `vi.mocked(useStore).mockReturnValue(obj)` devuelve `obj` sin importar el selector pasado. Esto hizo fallar los tests de `ConfiguracionJuego` con `patrones.map is not a function`. Solución: no usar selectores en componentes, usar desestructuración directa.

---

## Lo que necesita F4.1

### Prerequisitos verificados antes de arrancar F4.1

- [x] `pnpm test:run` pasa 169 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `useSesionStore` disponible con `agregarNumeroSorteado`, `deshacerUltimoNumero`, `rankingComputed`
- [x] `/configurar` → `ConfiguracionJuego` funcional
- [x] `/jugar` muestra estado de sesión activa

### Lo que F4.1 debe hacer

1. En `/jugar`, añadir un **teclado numérico grande** (botones 1–75) para ingresar números sorteados
2. Al tocar un número: `agregarNumeroSorteado(n)` en el store de sesión
3. Botón "Deshacer" para revertir el último número: `deshacerUltimoNumero()`
4. Historial de números sorteados visible (los últimos 5-10)
5. Tests de interacción del teclado

### Advertencias para F4.1

- El teclado numérico 1–75 en móvil necesita tap targets ≥ 44px — considerar grilla compacta
- Los números ya sorteados deben verse visualmente distintos (deshabilitados o marcados)
- `agregarNumeroSorteado` ya ignora duplicados en el store — el UI puede reflejarlo deshabilitando el botón
