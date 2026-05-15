# Roadmap — Bingo Digital

> Vista panorámica del progreso. Actualizar manualmente al cerrar cada subfase.

**Inicio estimado:** 2026-05-14
**Cierre estimado v1.0:** 2026-06-15 (≈ 4 semanas a ritmo moderado)

---

## Leyenda

⏳ Pendiente · 🔄 En curso · ✅ Completada · ⚠️ Bloqueada · ⏸️ Pausada

---

## Estado general

| Métrica | Valor |
|---------|-------|
| Fases totales | 8 |
| Subfases totales | 17 |
| Completadas | 0 / 17 |
| % avance | 0% |
| Versión actual | — (pre-F1) |

---

## v1.0 — Modo presencial (PWA sin backend)

### F1: Setup del proyecto

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F1.1 — Bootstrap del proyecto y tubería de calidad
- ⏳ F1.2 — Estructura de carpetas inicial, routing y deploy a Vercel

**Entregable:** repo configurado, deploy en Vercel mostrando "Hello, Bingo Digital".

---

### F2: Núcleo de cartones

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F2.1 — Modelo, validación y generador de cartones (`src/core/cartones/`)
- ⏳ F2.2 — Almacenamiento, store y UI de creación manual

**Entregable:** el usuario puede crear, listar y borrar cartones. Persisten al recargar.

---

### F3: Motor de juego

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F3.1 — Motor: marcado y condición de victoria
- ⏳ F3.2 — Editor de patrones libres
- ⏳ F3.3 — Integración del motor con stores y configuración de victoria

**Entregable:** la lógica de marcado y ranking funciona en tests. Usuario puede dibujar patrones.

---

### F4: Modo presencial — marcador y ranking en vivo

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F4.1 — Teclado numérico y registro de números sorteados
- ⏳ F4.2 — Ranking dinámico de cartones
- ⏳ F4.3 — Historial de sorteados y reinicio de sesión

**Entregable:** **un juego de bingo presencial funcional end-to-end sin OCR**. Hito intermedio sugerido: tag `v0.4.0`.

---

### F5: OCR con Tesseract.js

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F5.1 — Integración de Tesseract.js y captura de imagen
- ⏳ F5.2 — Post-procesamiento: estructurar en grilla 5x5
- ⏳ F5.3 — UI de confirmación editable y guardado

**Entregable:** crear cartón tomando foto del cartón físico, con confirmación obligatoria. Tag sugerido: `v0.5.0`.

---

### F6: PWA y observabilidad

**Estado:** ⏳ Pendiente

**Subfases:**
- ⏳ F6.1 — Convertir a PWA con vite-plugin-pwa
- ⏳ F6.2 — Sentry + Vercel Analytics

**Entregable:** app instalable y funcionando offline. Tracking de errores activo.

---

### F7: Pulido final

**Estado:** ⏳ Pendiente
**Subfases:** sin subfases

**Entregable:** Lighthouse PWA=100, Performance≥90, Accessibility≥90. UX pulida. Export/import accesible. Tag sugerido: `v0.9.0`.

---

### F8: Documentación de usuario y release v1.0

**Estado:** ⏳ Pendiente
**Subfases:** sin subfases

**Entregable:** README completo, CHANGELOG, página `/ayuda`, **tag `v1.0.0`**, release en GitHub.

---

## Hitos clave (milestones)

| Hito | Descripción | Cuándo se alcanza |
|------|-------------|-------------------|
| **M1 — Tubería de calidad** | Proyecto configurado, CI verde, deploy automático | Al cerrar F1.2 |
| **M2 — Cartones funcionales** | Usuario crea/borra cartones con persistencia | Al cerrar F2.2 |
| **M3 — Juego sin OCR** | Bingo presencial completo (manual) | Al cerrar F4.3 (tag `v0.4.0`) |
| **M4 — Producto diferenciado** | OCR funcionando = diferenciador del producto | Al cerrar F5.3 (tag `v0.5.0`) |
| **M5 — PWA en producción** | App instalable y offline | Al cerrar F6.2 |
| **M6 — Beta lista** | Producto pulido para validación | Al cerrar F7 (tag `v0.9.0`) |
| **M7 — V1.0 lanzada** | Release oficial | Al cerrar F8 (tag `v1.0.0`) |

---

## Roadmap post-v1 (planeación, no compromiso)

### v1.5 — Mejoras de experiencia (1-2 semanas)
Solo se planifica con un NUEVO project-kickstart al cerrar v1.0 y recoger feedback de usuarios.
- Modo oscuro
- Sonidos y feedback háptico al marcar
- Export de resultados a PDF
- Vibración al detectar BINGO
- Mejoras de branding visual

### v2 — Modo virtual con Supabase (4-6 semanas)
Requiere nuevo project-kickstart. Decisiones a re-evaluar al llegar:
- Magic link vs OAuth
- Manejo de pagos manuales con comprobante
- Validación de ganador en servidor (Edge Function)
- Threat modeling ampliado (datos personales en juego)
- Cumplimiento Ley 29733

### v2.5 — Pagos automáticos con Culqi (2-3 semanas)
- Integración Culqi
- Webhooks con verificación HMAC
- Historial de transacciones del moderador

### v3 — Escala (según demanda)
- Yape Business (cobros directos)
- Múltiples moderadores por evento
- App nativa con React Native compartiendo `src/core/`

---

## Bitácora de cierres

> Anotar fecha y commit cada vez que se cierra una subfase.

| Fecha | Subfase | Commit | Notas |
|-------|---------|--------|-------|
| _Pendiente — primera entrada al cerrar F1.1_ | — | — | — |

---

## Métricas a observar durante el desarrollo

- **Velocidad real vs estimada:** anotar tiempo real por subfase en la bitácora para calibrar estimaciones futuras.
- **% de subfases que requirieron volver a empezar:** si > 20%, replantear granularidad.
- **Cobertura de tests:** debe mantenerse o subir, nunca bajar de fase a fase en `core/`.
- **Tamaño del bundle:** medirlo en cada `pnpm build`. Meta v1.0: bundle inicial (sin Tesseract) < 250 KB gzipped.

---

_Última actualización: 2026-05-14_
