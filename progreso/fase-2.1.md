# Handoff — Subfase F2.1: Modelo, validación y generador de cartones

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F2.2 — Almacenamiento, store y UI de creación manual

---

## Lo que se hizo

### Archivos creados

- `src/core/cartones/types.ts` — tipos `SerieBingo`, `NumerosCarton`, `NumerosCartonParcial`, `Carton`, `Result<T,E>`
- `src/core/cartones/validacion.ts` — schemas Zod por columna + `validarNumerosCarton` + `validarCartonCompleto`
- `src/core/cartones/generador.ts` — `crearCartonAleatorio`, `crearCartonDesdeNumeros`, `cartonVacioPlantilla`
- `src/core/cartones/index.ts` — API pública (re-exports de todos los tipos y funciones anteriores)
- `src/core/cartones/validacion.test.ts` — 25 tests de validación
- `src/core/cartones/generador.test.ts` — 23 tests del generador

### Archivos modificados

- `package.json` — añadidas dependencias `zod ^4.4.3`, `uuid ^14.0.0`, devDep `@types/uuid ^11.0.0`
- `pnpm-lock.yaml` — actualizado

### Comandos verificados

| Comando              | Resultado                                                  |
| -------------------- | ---------------------------------------------------------- |
| `pnpm test:run`      | ✅ 53 tests verdes (5 archivos)                            |
| `pnpm test:coverage` | ✅ core/cartones: 81.81% stmts, 96.15% branches, 88.88% fn |
| `pnpm lint`          | ✅ 0 errores                                               |
| `pnpm typecheck`     | ✅ 0 errores                                               |

---

## Versiones instaladas en F2.1

| Paquete     | Versión | Notas                                               |
| ----------- | ------- | --------------------------------------------------- |
| zod         | 4.4.3   | API compatible con v3 para casos usados             |
| uuid        | 14.0.0  | `import { v4 as uuidv4 } from 'uuid'` funciona      |
| @types/uuid | 11.0.0  | Stub deprecated — uuid 14 incluye sus propios tipos |

---

## API pública final de `core/cartones/index.ts`

```typescript
// Tipos
export type { SerieBingo, NumerosCarton, NumerosCartonParcial, Carton, Result } from './types'
export type { OpcionesCarton } from './generador'

// Funciones
export { crearCartonAleatorio, crearCartonDesdeNumeros, cartonVacioPlantilla } from './generador'
export { validarNumerosCarton, validarCartonCompleto } from './validacion'
```

---

## Decisiones tomadas

### 1. Patrón Result (no excepciones)

`validarNumerosCarton` y `validarCartonCompleto` retornan `Result<T, string[]>`. Nunca lanzan. Definido en `types.ts`:

```typescript
export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }
```

### 2. `NumerosCartonParcial` añadido a `types.ts`

No estaba en la especificación original, pero se añadió porque `cartonVacioPlantilla` necesita retornar una estructura con `null` en las casillas (para inicializar formularios en F2.2). Es una extensión lógica del tipo `NumerosCarton`.

### 3. Validación de duplicados fuera del schema Zod

Zod valida rangos y tipos, pero la detección de duplicados _entre columnas_ requiere lógica cruzada. Se implementó como función auxiliar `tieneDuplicados` separada, llamada desde `validarNumerosCarton` y `validarCartonCompleto`.

### 4. `/* v8 ignore file */` en `types.ts`

`types.ts` solo tiene declaraciones TypeScript (compiladas a nada en runtime). Sin el comentario, aparece como 0% en la cobertura v8 y arrastra el porcentaje del módulo por debajo del umbral.

### 5. Tests importan desde `./index` (no desde implementación interna)

Buena práctica: testear la API pública, no los internos. Esto garantiza que `index.ts` también se cubre.

### 6. Zod 4.x

La guía de desarrollo no especificaba versión de Zod. pnpm instaló v4.4.3 (pasó el cooldown). La API usada (`z.object`, `z.tuple`, `z.number`, `z.literal`, `z.enum`, `.safeParse`) es compatible entre v3 y v4. Sin cambios de migración necesarios.

---

## Sorpresas encontradas

1. **uuid 14.0.0:** versión instalada (pnpm respetó el cooldown). Versión mayor pero API idéntica — `import { v4 as uuidv4 } from 'uuid'` funciona igual.

2. **`@types/uuid` deprecated:** al instalar, pnpm advirtió que `@types/uuid` es un stub deprecado porque uuid ya incluye sus propios tipos. Se instaló igual para evitar errores de TypeScript si alguna dependencia lo referencia, pero no se usa directamente.

3. **Zod 4 con `z.tuple` y columna N:** el schema de la columna N tiene un `z.literal('FREE')` en la posición 2. Zod 4 lo maneja sin problemas con `z.tuple([rangoN, rangoN, z.literal('FREE'), rangoN, rangoN])`.

---

## Lo que necesita F2.2

### Prerequisitos verificados antes de arrancar F2.2

- [x] `pnpm test:run` pasa 53 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `pnpm build` genera dist/ (no comprobado explícitamente, pero lint/typecheck y test:run pasan sin errores)
- [x] API pública de `core/cartones` disponible vía `index.ts`

### Lo que F2.2 debe hacer

1. Instalar Zustand con pnpm
2. Crear `src/core/almacenamiento/schema.ts` (SCHEMA_VERSION, migrarSiHaceFalta)
3. Crear `src/core/almacenamiento/localStorage.ts` (leerCartones, guardarCartones, etc.)
4. Crear `src/core/almacenamiento/index.ts`
5. Crear `src/lib/stores/cartones.ts` (Zustand store)
6. Crear `FormularioCartonManual.tsx` y `CrearCartonManual.tsx`
7. Actualizar `MisCartones.tsx` con listado real
8. Actualizar router con ruta `/cartones/nuevo`
9. Tests del store y de los componentes

### Advertencias para F2.2

- **Importar de `core/cartones`** usando el `index.ts` (API pública), no desde los archivos internos
- **NO importar `core/almacenamiento` desde `core/cartones`** — los módulos de `core/` no se importan entre sí directamente
- **localStorage solo se toca desde `core/almacenamiento/`** — ningún componente ni store escribe localStorage directamente
- El formulario debe ser usable en móvil: tap-targets ≥ 44px, inputs grandes

---

## TODOs pendientes (no bloqueantes para F2.2)

- [ ] Verificar `pnpm build` explícitamente (debería funcionar, TypeScript pasa)
- [ ] Considerar si `@types/uuid` puede eliminarse (la advertencia de deprecated indica que uuid incluye sus tipos)
