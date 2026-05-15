# Estado Actual del Proyecto

**Última actualización:** 2026-05-14 (kit inicial generado)
**Última subfase completada:** ninguna — proyecto recién iniciado
**Próxima subfase:** **F1.1 — Bootstrap del proyecto y tubería de calidad**

---

## Progreso global

- Fases completadas: 0 / 8
- Subfases completadas: 0 / 17
- Porcentaje estimado: 0%

---

## Resumen de lo construido hasta ahora

El kit de documentación está completo (CLAUDE.md, especificaciones, guía de desarrollo con 17 subfases, ROADMAP, ADRs, threat model, README, glosario, configuración de hooks). **Aún no hay código fuente**. La primera subfase (F1.1) creará el proyecto con Vite + React + TypeScript + Tailwind + pnpm endurecido y toda la tubería de calidad (linter, formatter, tests, hooks, CI).

---

## Decisiones técnicas vivas (las que afectan trabajo futuro)

- **pnpm 11+** obligatorio con `minimumReleaseAge: 1440`, `strictDepBuilds: true`, `blockExoticSubdeps: true`. NO usar npm ni yarn. Ver `docs/adr/0002-pnpm-sobre-npm.md`.
- **v1 sin backend.** Todo en `localStorage`. Supabase entra en v2. Ver `docs/adr/0001-alcance-v1-sin-backend.md`.
- **Stack frontend:** React + Vite + TypeScript strict + Tailwind + Zustand + Zod + Tesseract.js. Ver `docs/adr/0003-stack-frontend.md`.
- **Hosting:** Vercel (free tier, dominio gratis `bingo-digital.vercel.app`).
- **Observabilidad:** Sentry con `sendDefaultPii: false` y filtro de contenido de cartones; Vercel Analytics sin cookies.
- **Arquitectura modular por dominio:** `src/core/*` es puro (sin React, sin DOM, testeable). `src/modo-presencial/*` contiene la UI. En v2 se añadirá `src/modo-virtual/*` sin tocar lo anterior.

---

## Issues abiertos del proyecto

_Sin issues abiertos. El proyecto recién comienza._

---

## Deudas técnicas anotadas

_Sin deudas. La primera subfase aún no se ha ejecutado._

---

## Notas para la próxima sesión de Claude Code

Al arrancar la **primera sesión de Claude Code** (F1.1), seguir estos pasos:

1. **Verificar versiones del entorno:**
   ```bash
   node --version    # debe ser v22.x (LTS)
   pnpm --version    # debe ser 11.x o superior
   git --version     # cualquier versión moderna
   ```
   Si pnpm no está instalado: `npm install -g pnpm@latest` o vía corepack.

2. **Dar a Claude Code el siguiente prompt literal:**

   > Lee CLAUDE.md, docs/especificaciones.md (al menos secciones 5.2, 5.3, 8.1) y docs/guia_desarrollo.md (sección F1.1 completa). Después confirma que entendiste el objetivo de la subfase F1.1 y empieza siguiendo el prompt sugerido tal como está documentado.

3. **NO empieces la F1.2** en la misma sesión. Cierra al terminar F1.1 con el handoff doc y abre una sesión nueva para F1.2.

---

## Bitácora rápida

| Fecha | Evento |
|-------|--------|
| 2026-05-14 | Kit de documentación inicial generado con `project-kickstart`. 17 subfases planificadas. |
