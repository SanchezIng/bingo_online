# Handoff — Subfase F2.2: Almacenamiento, store y UI de creación manual

**Fecha de cierre:** 2026-05-15
**Estado:** ✅ Completada
**Siguiente:** F3.1 — Motor de juego — marcado y condición de victoria

---

## Lo que se hizo

### Archivos creados

- `src/core/almacenamiento/schema.ts` — `SCHEMA_VERSION = '1.0'`, `migrarSiHaceFalta()`
- `src/core/almacenamiento/localStorage.ts` — leer/guardar cartones+patrones+sesión, exportarTodo, importarTodo, manejo de QuotaExceededError con Result
- `src/core/almacenamiento/index.ts` — API pública del módulo
- `src/core/almacenamiento/localStorage.test.ts` — 13 tests de almacenamiento
- `src/lib/stores/cartones.ts` — Zustand store con state `cartones[]` + `error` y actions cargar/agregar/eliminar/editar
- `src/modo-presencial/components/CartonGrid.tsx` — grilla 5×5 reutilizable con prop `casillasMarcadas` para F4
- `src/modo-presencial/components/FormularioCartonManual.tsx` — formulario mobile-first, inputs ≥44px, validación inline, llenar aleatorio
- `src/modo-presencial/components/FormularioCartonManual.test.tsx` — 6 tests del formulario
- `src/modo-presencial/pages/CrearCartonManual.tsx` — página wrapper que redirige a /cartones tras guardar
- `src/modo-presencial/pages/MisCartones.test.tsx` — 7 tests de la página de listado

### Archivos modificados

- `src/modo-presencial/pages/MisCartones.tsx` — reescrito: listado real del store, tarjetas con CartonGrid, confirmación de borrado en 2 pasos
- `src/lib/router.tsx` — añadida ruta `/cartones/nuevo` → CrearCartonManual
- `package.json` — añadida dependencia `zustand ^5.0.13`
- `pnpm-lock.yaml` — actualizado

### Comandos verificados

| Comando              | Resultado                                                     |
| -------------------- | ------------------------------------------------------------- |
| `pnpm test:run`      | ✅ 79 tests verdes (8 archivos)                               |
| `pnpm test:coverage` | ✅ core/almacenamiento: 85.84% stmts, 79.31% branches, 80% fn |
| `pnpm lint`          | ✅ 0 errores                                                  |
| `pnpm typecheck`     | ✅ 0 errores                                                  |
| `pnpm build`         | ✅ dist/ generado, 316.62 kB JS (gzip: 99.23 kB)              |

---

## Versiones instaladas en F2.2

| Paquete | Versión | Notas                                        |
| ------- | ------- | -------------------------------------------- |
| zustand | 5.0.13  | API `create()` idéntica a v4 para uso básico |

---

## API pública final de `core/almacenamiento/index.ts`

```typescript
// schema
export { migrarSiHaceFalta, SCHEMA_VERSION }

// localStorage
export {
  leerCartones,
  guardarCartones,
  leerPatrones,
  guardarPatrones, // tipo provisional unknown[] hasta F3.2
  leerSesion,
  guardarSesion, // tipo provisional unknown hasta F3.3
  exportarTodo,
  importarTodo,
}
```

---

## Decisiones tomadas

### 1. Zustand 5.0.13 (no 4.x como dice la guía)

pnpm instaló la versión más reciente estable que pasó el cooldown. La API de `create()` es idéntica; no se necesitó nada de v4 específico.

### 2. `leerPatrones` / `leerSesion` con tipos provisionales

`Patron` (F3.1) y el tipo de sesión (F3.3) no existen aún. Se usó `unknown[]` y `unknown` respectivamente. En F3.2 y F3.3 se reemplazarán con los tipos reales.

### 3. Store de Zustand inicializa con `cartones: []`, no carga automático

El store no llama `leerCartones()` en su inicialización. En cambio, expone `cargarCartones()` que los componentes llaman en `useEffect`. Esto evita side-effects al importar el módulo en tests y facilita el mocking.

### 4. Confirmación de borrado en 2 pasos (sin modal)

En lugar de `window.confirm()` o un modal complejo, `MisCartones.tsx` muestra botones "Confirmar" / "Cancelar" inline en la tarjeta. Solución simple, accesible y evita dependencias.

### 5. `FormularioCartonManual` recibe `onGuardar` como prop

La página `CrearCartonManual` es quien llama al store. El formulario solo es responsable de la UI y de emitir los números validados. Esto separa responsabilidades y facilita los tests (el formulario no necesita mockar el store).

### 6. Zod v4 UUID RFC 9562

Descubierto en fase de tests: `z.string().uuid()` en Zod 4 valida RFC 9562 (requiere versión `[1-8]` en posición 14 y variante `[89ab]` en posición 19). Los UUIDs con todos-ceros (`00000000-0000-0000-0000-000000000001`) fallan. **Regla para todos los fixtures de tests futuros: usar UUIDs generados por `uuidv4()` o con formato RFC válido** (ej: `f47ac10b-58cc-4372-a567-0e02b2c3d479`).

---

## Sorpresas encontradas

1. **Zustand 5.x instalado en vez de 4.x**: la guía mencionaba Zustand 4+, pero pnpm instaló 5.0.13. La API es compatible.

2. **Zod v4 UUID RFC 9562**: explicado arriba. Fue el único bloqueante en tests.

3. **lint-staged reformateó componentes**: Prettier reordenó algunas clases de Tailwind en los TSX al commitear. Los cambios son cosméticos y no afectan funcionalidad.

---

## Lo que necesita F3.1

### Prerequisitos verificados antes de arrancar F3.1

- [x] `pnpm test:run` pasa 79 tests verdes
- [x] `pnpm lint && pnpm typecheck` limpios
- [x] `pnpm build` genera dist/
- [x] API pública de `core/cartones` y `core/almacenamiento` disponibles
- [x] Zustand store de cartones operativo

### Lo que F3.1 debe hacer

1. Crear `src/core/motor-juego/types.ts` con tipos `Patron`, `CondicionVictoria`, coordenadas como `"fila,columna"`
2. Crear `src/core/motor-juego/marcado.ts` — `casillasMarcadasDeCartonConNumeros()`
3. Crear `src/core/motor-juego/victoria.ts` — `evaluarCondicion()`
4. Crear `src/core/motor-juego/ranking.ts` — `calcularRanking()`
5. Crear `src/core/motor-juego/index.ts`
6. Tests exhaustivos: cobertura ≥ 85%
7. Commit: `feat(motor): marcado, condición de victoria y ranking`

### Advertencias para F3.1

- **NO tocar UI** — F3.1 es puro `core/`
- **NO importar `core/motor-juego` desde `core/cartones`** — no se importan entre sí directamente
- **Funciones puras, sin side-effects**
- La casilla central `(2,2)` siempre está marcada (FREE space)
- Coordenadas como strings `"fila,columna"` 0-indexed para serialización
- Los tipos `Patron` que se definan en F3.1 serán usados en F3.2 para tipar `leerPatrones` / `guardarPatrones`

---

## TODOs pendientes (no bloqueantes para F3.1)

- [ ] Añadir tests de integración del store `cartones.ts` directamente (actualmente solo se testea vía mocks de componentes)
- [ ] Explorar si `@types/uuid` puede eliminarse (deprecated desde uuid 14+ que incluye sus propios tipos)
