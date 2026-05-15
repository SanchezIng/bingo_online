# ADR-0001: Alcance v1 limitado al modo presencial, sin backend

**Fecha:** 2026-05-14
**Estado:** Aceptado

---

## Contexto

El documento de diseño original (`bingo-digital-design.md`) describe dos modos:

1. **Modo presencial** — el jugador está físicamente en un bingo, marca cartones digitalizados en el celular mientras alguien canta los números.
2. **Modo virtual** — eventos remotos donde un moderador transmite números en tiempo real y los jugadores juegan desde sus casas. Incluye compra de cartones online y pagos manuales/automáticos.

La pregunta inicial fue: **¿se construye todo de una vez (con Supabase desde el día uno) o se separa en versiones?**

Argumentos a favor de hacer todo:

- Más limpio arquitectónicamente: misma infraestructura desde el inicio.
- Evita reescrituras al migrar de localStorage a Supabase.
- El stack ya está decidido (React + Supabase + Vercel).

Argumentos en contra:

- El modo presencial **no necesita** Supabase. Sus datos (cartones del jugador) son locales por naturaleza.
- Supabase añade complejidad significativa: auth, RLS, Realtime, Storage, manejo de sesiones, configuración de seguridad, política de retención, cumplimiento Ley 29733, etc.
- El autor está aprendiendo React y Supabase simultáneamente. Sumar backend a la curva de aprendizaje aumenta el riesgo de abandono.
- Validar la parte **diferenciadora del producto** (OCR + patrones libres + ranking dinámico) primero permite recoger feedback antes de invertir en pagos y multi-usuario.
- La arquitectura modular por dominio (`src/core/cartones/`, `src/modo-presencial/`, futuros `src/modo-virtual/`) permite añadir Supabase en v2 sin reescribir lo construido.

---

## Decisión

**v1 entrega únicamente el modo presencial, sin backend.** Toda la persistencia es local (`localStorage`). El modo virtual y Supabase se planifican para v2 con un nuevo `project-kickstart` cuando llegue ese momento.

---

## Alternativas consideradas

### Opción A: Construir v1 con Supabase desde el día uno

- ✅ Pros:
  - Una sola arquitectura desde el inicio
  - No hay migración futura de localStorage → Supabase
  - El autor aprende Supabase como parte de v1

- ❌ Contras:
  - Triplica la complejidad de v1
  - Mayor riesgo de abandono ante curva de aprendizaje doble
  - Costos potenciales (Supabase free tier alcanza, pero hay que aprender a configurarlo bien)
  - Retrasa la primera prueba con usuarios reales
  - Activa cumplimiento Ley 29733 prematuramente
  - El modo presencial **no aprovecha** la mayoría de features de Supabase (sin login, sin compartir, sin tiempo real)

### Opción B (elegida): v1 solo presencial sin backend, v2 con Supabase

- ✅ Pros:
  - v1 se entrega en 3-4 semanas vs 6-8 con backend
  - Foco en validar la parte diferenciadora del producto (OCR, patrones libres, ranking)
  - Curva de aprendizaje gradual: React primero, Supabase después
  - Cero costos en v1
  - Sin tratamiento de datos personales = sin obligaciones regulatorias en v1
  - Feedback temprano de usuarios antes de invertir en backend
  - Arquitectura modular: `src/core/almacenamiento/` se reemplaza por un cliente Supabase en v2, el resto no cambia

- ❌ Contras:
  - Migración futura cuando llegue v2 (mitigada por la arquitectura modular)
  - Los datos del usuario están atados al dispositivo (mitigado por export/import en F7)
  - "Sensación" de producto incompleto si el usuario espera multi-dispositivo

### Opción C: v1 solo presencial pero con Supabase mínimo (auth + sincronización opcional)

- ✅ Pros:
  - Sincronización entre dispositivos sin esperar v2
  - Aprender Supabase de forma incremental

- ❌ Contras:
  - Activa Ley 29733 sin entregar el modo virtual (que es donde el backend aporta valor real)
  - Complejidad de "opcional" es alta: cuentas, login, merge de datos local vs remoto
  - El esfuerzo no se proporciona al valor entregado

---

## Consecuencias

### Positivas

- v1 alcanzable en 3-4 semanas con calidad alta.
- El autor aprende React de forma profunda antes de añadir Supabase.
- Cero costos hasta v2.
- Cero obligaciones regulatorias en v1 (Ley 29733 se activa en v2).
- La arquitectura modular permite añadir v2 sin re-trabajo.
- Producto en manos de usuarios reales en ~1 mes, no en 2-3 meses.

### Negativas

- Los cartones del usuario están atados a su navegador. Mitigaciones:
  - RF-08 / RF-31: export/import JSON manual (F7).
  - Banner suave en `/configuracion`: "Recomendamos exportar tus cartones de respaldo".
- Cuando llegue v2, habrá que diseñar la migración de localStorage → Supabase para usuarios existentes (no es trivial, pero es 1-2 días de trabajo).
- Algunos usuarios tempranos pueden quejarse de no poder usarlo en otro dispositivo. Decisión consciente: priorizamos foco sobre completitud.

### Riesgos

- **Riesgo: cambio de prioridades.** Si el feedback de v1 indica que la gente quiere el modo virtual urgentemente, hay que estar preparado para acelerar v2. Mitigación: documentar v1 de forma que un nuevo desarrollador (incluyendo yo mismo en 3 meses) pueda retomar fácilmente. Cubierto por CLAUDE.md + handoff docs.
- **Riesgo: deuda de migración.** Aunque la arquitectura modular ayuda, los detalles de migración (UUIDs, conflictos, datos huérfanos) requerirán pensamiento. Mitigación: en v2, dedicar una subfase específica al diseño de la migración.

---

## Reglas operativas derivadas

- En cualquier subfase de v1, si surge la tentación de "añadir un toque de Supabase para preparar v2", se rechaza. Se anota en `progreso/estado-actual.md` como "idea para v2" y se sigue.
- El acceso a `localStorage` se concentra en `src/core/almacenamiento/`. Ningún componente o hook lo toca directamente. Esto facilita que v2 reemplace ese módulo por un cliente Supabase sin tocar el resto.
- Las páginas de v1 viven en `src/modo-presencial/`. En v2 se añadirá `src/modo-virtual/` como peer, sin tocar `modo-presencial`.

---

## Referencias

- Documento de diseño original: `bingo-digital-design.md` (uploads)
- `docs/especificaciones.md` sección 6.2 (Exclusiones de v1)
- `docs/guia_desarrollo.md` (las 17 subfases planificadas para v1)
- `ROADMAP.md` (cronograma post-v1)
