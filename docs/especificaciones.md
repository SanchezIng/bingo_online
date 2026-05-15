# Especificaciones Técnicas — Bingo Digital

> **Documento de referencia técnica.** Define qué se construye, cómo y bajo qué restricciones. Es el contrato entre el desarrollador (tú + Claude Code) y el proyecto. Si surge una duda sobre alcance, este documento es la fuente de verdad.

**Versión actual:** v1.0 (modo presencial, sin backend)
**Fecha:** 2026-05-14
**Estado:** Aprobado para desarrollo

---

## 1. INTRODUCCIÓN Y PROPÓSITO

Bingo Digital es una **Progressive Web App** (PWA) que digitaliza la experiencia del bingo presencial. El producto a largo plazo cubre dos modos (presencial y virtual), pero **esta especificación se enfoca en v1**, que entrega solo el modo presencial.

El modo presencial está pensado para escenarios reales y comunes en Perú y Latinoamérica: una casa de bingo, una parroquia, un evento comunitario, donde una persona canta los números y los jugadores marcan en cartones físicos. La app no reemplaza al moderador humano; **acompaña al jugador** dándole una forma cómoda de llevar varios cartones, no perderse ningún número, y saber en todo momento qué cartón está más cerca de ganar.

Al ser v1 sin backend:

- No hay registro de usuarios ni cuentas.
- No hay pagos ni transacciones.
- Todos los datos del usuario viven en el dispositivo (`localStorage`).
- La app funciona offline después de la primera carga (PWA).
- Las fotos del OCR se procesan localmente y nunca se suben a un servidor.

Este alcance acotado es una decisión deliberada (ver `docs/adr/0001-alcance-v1-sin-backend.md`). Permite validar la parte diferenciadora del producto (OCR + patrones libres + ranking dinámico) antes de invertir en backend, autenticación, pagos y tiempo real.

---

## 2. ROLES Y USUARIOS DEL SISTEMA

### 2.1 Definición de Roles

En v1 hay un único rol funcional:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Jugador presencial** | Persona que está en un bingo físico y usa la app en su celular | Crear/editar/borrar sus cartones, crear/editar patrones, ingresar números sorteados, ver ranking, ver historial. Todo restringido a su propio dispositivo. |

En v2 aparecerán: **Moderador virtual** (crea y gestiona eventos) y **Jugador virtual** (compra cartones online y juega remoto). Pero **no son parte de v1**.

### 2.2 Gestión de Usuarios

- **Sin cuenta de usuario.** No hay registro, login, ni recuperación de contraseña.
- **Identidad por dispositivo.** Los datos viven en `localStorage` del navegador. Si el usuario limpia su navegador o cambia de dispositivo, pierde sus cartones (esto se documenta en la UI con una nota suave; ver RF-06).
- **Export/import de cartones** (RF-08) como vía de respaldo manual.

### 2.3 Concurrencia

- **N/A.** Un dispositivo = un jugador. No hay servidor compartido en v1.

---

## 3. REQUISITOS FUNCIONALES

### 3.1 Módulo Cartones

- **RF-01.** El usuario puede **crear un cartón manualmente** ingresando los 25 números (5 por columna B, I, N, G, O). La casilla central es libre (free space) y queda marcada por defecto.
- **RF-02.** El usuario puede **crear un cartón vía OCR**: toma o sube una foto del cartón físico, Tesseract.js detecta los números en el navegador, y la app muestra una vista previa **editable casilla por casilla** con indicador de confianza (alto/medio/bajo) antes de confirmar.
- **RF-03.** El usuario puede **editar un cartón** existente (modificar números mal capturados).
- **RF-04.** El usuario puede **borrar un cartón** con confirmación explícita ("¿Seguro que quieres borrar este cartón? Esta acción no se puede deshacer").
- **RF-05.** El usuario puede **listar todos sus cartones** y verlos en la vista de juego.
- **RF-06.** El sistema **valida** que los números de un cartón respeten las reglas del bingo estándar (B: 1-15, I: 16-30, N: 31-45 con centro libre, G: 46-60, O: 61-75; sin duplicados dentro del cartón).
- **RF-07.** El sistema permite **generar un cartón aleatorio válido** (útil para pruebas y para usuarios sin cartón físico).
- **RF-08.** El usuario puede **exportar un cartón a JSON** (copiar al portapapeles o descargar) e **importarlo** de vuelta (pegar o subir archivo).

### 3.2 Módulo Motor de Juego

- **RF-09.** El usuario puede **definir patrones ganadores** dibujándolos en una grilla 5x5 (canvas táctil con dedo o mouse). Cada patrón tiene nombre (ej: "L", "Diagonal", "X"). La casilla central siempre cuenta como marcada.
- **RF-10.** El usuario puede **listar, editar y borrar** sus patrones guardados.
- **RF-11.** El sistema soporta **tres condiciones de victoria configurables** por sesión:
  - **Primeros N marcados** (configurable: 5, 10, o cualquier número de casillas marcadas)
  - **Patrón específico** dibujado libremente
  - **Cartón lleno** (24 casillas marcadas, excluyendo el centro libre)
- **RF-12.** Cuando el usuario ingresa un número sorteado, el sistema **resalta esa casilla en todos los cartones donde aparezca**, simultáneamente.
- **RF-13.** El sistema **calcula el ranking de cartones** por proximidad al patrón activo: el cartón al que le faltan menos casillas para completar el patrón aparece primero.
- **RF-14.** El sistema **detecta y anuncia** cuando un cartón completa el patrón activo (mensaje de "¡BINGO!" con confeti o efecto visual).
- **RF-15.** El sistema **detecta cartones a 1 o 2 casillas del patrón** y los marca visualmente ("CASI" / "MUY CERCA").
- **RF-16.** El sistema **valida estrictamente**: solo se resalta una casilla si el número está en ese cartón Y aporta al patrón activo (no marcar números que no son parte del patrón activo).

### 3.3 Módulo OCR

- **RF-17.** El usuario puede **abrir la cámara** desde la app (atributo `capture` del input file) para fotografiar el cartón.
- **RF-18.** El usuario puede **subir una foto existente** desde la galería.
- **RF-19.** Tesseract.js procesa la imagen **en el navegador**. La imagen jamás se envía a un servidor.
- **RF-20.** El sistema **detecta números** y los ubica en la grilla 5x5, mostrando una vista previa con cada número en su casilla aproximada.
- **RF-21.** Por cada casilla detectada, el sistema muestra un **indicador de confianza** (alto/medio/bajo) basado en el score de Tesseract.
- **RF-22.** El usuario puede **corregir cada casilla manualmente** antes de confirmar.
- **RF-23.** Si la confianza global es muy baja (< 30%), el sistema sugiere **reintentar con mejor luz** antes de aceptar el resultado.

### 3.4 Módulo Marcador de Juego

- **RF-24.** El usuario ingresa el **número sorteado** mediante un teclado numérico grande y accesible (apto para uso rápido durante un bingo).
- **RF-25.** El sistema **valida** que el número esté en rango 1-75 y no haya sido sorteado ya en esta sesión.
- **RF-26.** El sistema mantiene un **historial visual** de números sorteados en la sesión, mostrado en orden y agrupado por serie (B, I, N, G, O).
- **RF-27.** El usuario puede **deshacer el último número sorteado** (en caso de error de tipeo).
- **RF-28.** El usuario puede **reiniciar la sesión** (borra el historial de números sorteados, mantiene los cartones y patrones).

### 3.5 Módulo Almacenamiento

- **RF-29.** Los cartones, patrones e historial de sesión persisten en `localStorage` del navegador.
- **RF-30.** El esquema de `localStorage` está **versionado** (clave `bingo:schema_version`) para permitir migraciones futuras sin perder datos.
- **RF-31.** El usuario puede **exportar todo su estado** (cartones + patrones) como JSON, y **reimportarlo** en otro dispositivo o tras limpiar el navegador.
- **RF-32.** Al detectar `localStorage` lleno o no disponible, el sistema muestra un mensaje claro al usuario (no falla silenciosamente).

### 3.6 Módulo PWA

- **RF-33.** La app es **instalable** desde Chrome (Android) y Safari (iOS) mediante el botón "Añadir a pantalla de inicio".
- **RF-34.** Tras la primera carga, la app **funciona offline** completamente.
- **RF-35.** El service worker se actualiza automáticamente cuando hay nueva versión, con prompt al usuario ("Hay una nueva versión disponible, ¿recargar?").

---

## 4. REQUISITOS NO FUNCIONALES

| ID | Categoría | Descripción |
|----|-----------|-------------|
| RNF-01 | Rendimiento | Marcar un número en 10 cartones simultáneamente debe completarse en < 100 ms. |
| RNF-02 | Rendimiento | El cálculo del ranking dinámico de hasta 20 cartones debe completarse en < 200 ms. |
| RNF-03 | Rendimiento | First Contentful Paint (FCP) en móvil 4G ≤ 2.5 s. Lighthouse Performance ≥ 90. |
| RNF-04 | Disponibilidad | Tras la primera carga, la app funciona 100% offline. No depende de red para jugar. |
| RNF-05 | Compatibilidad | Soporta Chrome Android 120+, Safari iOS 16+, Edge 120+, Firefox 120+ (móvil y escritorio). |
| RNF-06 | Mantenibilidad | Ningún archivo de código supera ~300 líneas. Naming consistente (ver CLAUDE.md). |
| RNF-07 | Mantenibilidad | Cobertura de tests en `core/motor-juego/` ≥ 80%. Cobertura global ≥ 60% en lógica de negocio. |
| RNF-08 | Mantenibilidad | Conventional Commits obligatorio. Pre-commit hooks (linter, formatter, gitleaks). |
| RNF-09 | Usabilidad | UI legible a 50 cm de distancia (bingos son ruidosos y rápidos). Tamaño mínimo de tap-target: 44x44 px. |
| RNF-10 | Usabilidad | Lighthouse Accessibility ≥ 90. Contraste WCAG AA mínimo. |
| RNF-11 | Privacidad | Las fotos del OCR NUNCA salen del dispositivo. Tesseract.js procesa local. |
| RNF-12 | Privacidad | Sentry configurado con `sendDefaultPii: false` y `beforeSend` que filtra contenido de cartones. |
| RNF-13 | Observabilidad | Errores de producción capturados en Sentry. Métricas de uso (páginas vistas, eventos clave) en Vercel Analytics. |
| RNF-14 | PWA | Lighthouse PWA score = 100. Instalable. Offline-ready. |

---

## 5. SEGURIDAD

Esta sección lista las reglas concretas (RNF-SEC-XX) que se aplican en v1. Dado que **no hay backend** en v1, muchas reglas clásicas de OWASP no aplican todavía; se documentan las que sí, y se deja constancia de las que se activarán en v2.

### 5.1 OWASP Top 10 — Reglas aplicadas en v1

#### A02 — Cryptographic Failures

- **RNF-SEC-A02-1.** Las fotos del OCR se procesan en el navegador y nunca se envían por red. (Implementación: Tesseract.js se carga como worker en el cliente.)
- **RNF-SEC-A02-2.** HTTPS obligatorio en producción (Vercel lo aplica por defecto, con HSTS).
- **RNF-SEC-A02-3.** No hay secretos sensibles en v1. El DSN de Sentry es **público por diseño** y puede vivir en el bundle.

#### A03 — Injection

- **RNF-SEC-A03-1.** Validación estricta de inputs con **Zod**:
  - Números de cartón: enteros 1-75 según serie correspondiente.
  - Nombres de patrón: máx 30 caracteres, sin HTML.
  - JSON de import: schema explícito; rechaza si no coincide.
- **RNF-SEC-A03-2.** React escapa HTML por defecto en JSX. **NO usar** `dangerouslySetInnerHTML` en v1.
- **RNF-SEC-A03-3.** No usar `eval()` ni `new Function()` con input del usuario.

#### A05 — Security Misconfiguration

- **RNF-SEC-A05-1.** Headers de seguridad en `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' https://*.sentry.io https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.sentry.io https://vitals.vercel-insights.com; worker-src 'self' blob:; manifest-src 'self'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(self), microphone=()` (cámara para OCR, micrófono explícitamente denegado)
- **RNF-SEC-A05-2.** Stack traces y errores detallados **NUNCA** expuestos al usuario en producción. Sentry los captura silenciosamente; el usuario ve un mensaje genérico "Algo salió mal, recarga la página".
- **RNF-SEC-A05-3.** Source maps de producción se suben a Sentry **pero no se sirven públicamente**. Vercel los excluye del output con `sourcemap: 'hidden'` en Vite.

#### A06 — Vulnerable & Outdated Components

- **RNF-SEC-A06-1.** `pnpm audit --audit-level=high` ejecutado en CI en cada push.
- **RNF-SEC-A06-2.** `pnpm` configurado con `minimumReleaseAge: 1440` (24h cooldown — bloquea ataques de zero-day como Shai-Hulud 2025-2026).
- **RNF-SEC-A06-3.** `pnpm` configurado con `strictDepBuilds: true` (ningún script de install corre sin allowlist explícita).
- **RNF-SEC-A06-4.** `pnpm` configurado con `blockExoticSubdeps: true` (sub-dependencias solo desde registros verificados).
- **RNF-SEC-A06-5.** `pnpm-lock.yaml` comiteado al repo. CI usa `pnpm install --frozen-lockfile`.
- **RNF-SEC-A06-6.** Dependabot configurado con cooldown de 7 días para minor/patch (cooldown adicional al de pnpm).
- **RNF-SEC-A06-7.** Antes de añadir una librería nueva: revisar mantenimiento, downloads, vulnerabilidades, peso. Documentado en el checklist de cada fase.

#### A09 — Security Logging & Monitoring Failures

- **RNF-SEC-A09-1.** Errores de cliente capturados en **Sentry** con DSN público.
- **RNF-SEC-A09-2.** Sentry configurado con `sendDefaultPii: false` y un `beforeSend` que descarta cualquier evento cuyo payload contenga claves: `carton`, `cartones`, `numeros`, `ocrImage`, `foto`.
- **RNF-SEC-A09-3.** Niveles de log usados correctamente: ERROR para crashes, WARN para fallbacks recuperables, INFO para eventos de uso, DEBUG solo en dev.
- **RNF-SEC-A09-4.** Vercel Analytics activado **sin cookies** y sin tracking de usuario individual (configuración por defecto privacy-first).

### 5.2 Secrets Management

- **RNF-SEC-SEC-1.** `.env` SIEMPRE en `.gitignore` desde el primer commit.
- **RNF-SEC-SEC-2.** `.env.example` con todas las variables y valores dummy (nunca valores reales).
- **RNF-SEC-SEC-3.** Pre-commit hook con **gitleaks** ejecutándose antes de cada commit.
- **RNF-SEC-SEC-4.** En v1 no hay secretos reales. El DSN de Sentry es público (es así por diseño en Sentry frontend SDK).
- **RNF-SEC-SEC-5.** En v2, las llaves de Supabase service_role y Culqi secret_key vivirán solo en variables de entorno de Vercel (no `VITE_` prefix, accesibles solo en Edge Functions).

### 5.3 Dependency Security

Ver RNF-SEC-A06-X arriba. Resumen accionable:

- ✅ pnpm 11+ con configuración endurecida (cooldown 24h, strictDepBuilds, blockExoticSubdeps).
- ✅ Lockfile comiteado, `--frozen-lockfile` en CI.
- ✅ Auditoría automática en CI.
- ✅ Dependabot con cooldown adicional para PRs automáticos.
- ✅ Revisión manual antes de cada nueva dependencia.

### 5.4 Logging Seguro

#### Qué NO loggear NUNCA

- Contenido completo de un cartón (números específicos del usuario)
- Imágenes del OCR (ni como base64, ni como referencia)
- Historial de números sorteados de una sesión real (es dato del usuario)
- Cualquier dato que en v2 sea PII (emails, nombres, IPs, etc.)

#### Cómo enmascarar (preparación para v2)

- Email: `j***@example.com`
- DNI / documento: `12***789`
- IDs internos: solo primeros 8 caracteres del UUID

#### Logging estructurado

JSON estructurado para Sentry. Formato:

```json
{
  "timestamp": "2026-05-14T10:30:00Z",
  "level": "INFO",
  "event": "carton_creado",
  "metadata": { "fuente": "manual" }
}
```

> **Importante:** la `metadata` NUNCA incluye los números del cartón. Solo metadatos: cantidad de cartones del usuario, fuente (manual/ocr), confianza promedio del OCR.

### 5.5 Hardening específico (Web app / PWA)

- **HTTPS forzado** (Vercel + HSTS).
- **Headers de seguridad** completos (ver RNF-SEC-A05-1).
- **Sin CORS configurado en v1** (no hay endpoints propios; el SDK de Sentry y Vercel manejan los suyos).
- **Validación de input con Zod** en todos los puntos de entrada de datos (forms, imports, OCR results).
- **Service Worker** con scope limitado a `/` y caching estricto (no cachea fuentes externas no controladas).

### 5.6 Threat Modeling

Documento separado: ver `docs/threat-model.md`. En v1 es ligero (superficie pequeña). En v2 se ampliará obligatoriamente.

### 5.7 Backup y Recovery

- **v1 (sin backend):** la responsabilidad de backup es del usuario, vía la funcionalidad de export/import (RF-31). El sistema se lo recuerda con un banner suave en la página de configuración: "Tus cartones se guardan solo en este dispositivo. Recomendamos exportar un respaldo después de crear varios cartones."
- **v2:** Supabase incluye backups automáticos diarios con retención de 7 días en plan free, 30 días en plan pro. Test de restore se documentará en `docs/runbooks/restore-supabase.md` cuando llegue v2.

### 5.8 Reglas OWASP NO aplicadas en v1 (justificación)

| Regla | Razón de NO aplicación en v1 | Cuándo se activa |
|-------|-------------------------------|------------------|
| A01 — Broken Access Control | No hay servidor ni recursos protegidos. Cada dispositivo es su propio dominio. | v2: RLS en Supabase + verificación de roles en Edge Functions. |
| A04 — Insecure Design | No hay diseño de auth, pagos, ni multi-usuario. | v2: threat modeling de flujos críticos (pago, validación de ganador). |
| A07 — Identification & Auth Failures | No hay autenticación en v1. | v2: magic link de Supabase Auth. |
| A08 — Software & Data Integrity Failures | No hay actualizaciones firmadas (es una web app, se sirve fresh desde Vercel). | v2: verificación HMAC de webhooks de Culqi. |
| A10 — SSRF | No hay servidor que haga requests salientes. | v2: validación de URLs en Edge Functions si aplica. |

---

## 6. RESTRICCIONES Y EXCLUSIONES

### 6.1 Restricciones del proyecto

- **Tiempo:** v1 estimada en 3-4 semanas a ritmo moderado (un desarrollador aprendiendo con Claude Code).
- **Presupuesto:** $0 USD en v1. Plan free de Vercel, GitHub, Sentry (5k errores/mes) y Vercel Analytics.
- **Equipo:** 1 desarrollador (tú) + Claude Code como copiloto.
- **Hardware objetivo:** smartphone Android medio-bajo (4 GB RAM, navegador Chrome). Si funciona ahí, funciona en todo.
- **Legales:** ninguna restricción en v1 al no recoger datos personales (la Ley 29733 de Perú no se activa porque no hay tratamiento de datos personales en servidor).

### 6.2 Exclusiones (fuera del alcance de v1)

Lista explícita de lo que **NO** se hace en v1:

- ❌ Backend, base de datos, servidores
- ❌ Cuentas de usuario, login, recuperación de contraseña
- ❌ Modo virtual (eventos remotos en tiempo real)
- ❌ Pagos (manuales o automáticos)
- ❌ Sincronización entre dispositivos (un cartón en mi celular ≠ accesible desde otro)
- ❌ Notificaciones push
- ❌ Sonidos, vibración háptica (planeado para v1.5 o v2)
- ❌ Modo oscuro (planeado para v1.5)
- ❌ Múltiples moderadores, multi-jugador
- ❌ Estadísticas históricas (más allá de la sesión actual)
- ❌ Internacionalización (solo español Perú/Latam en v1)
- ❌ App nativa iOS/Android (es PWA pura)

---

## 7. ARQUITECTURA Y MODELO DE DATOS

### 7.1 Visión General

Arquitectura **modular monolítica del frontend**, organizada por dominios (no por capas técnicas). Esto facilita que en v2 se añada un dominio nuevo (modo virtual) sin tocar los existentes.

```
src/
├── core/                  ← lógica de dominio, pura, testeable, sin React
│   ├── cartones/          ← creación, validación, tipos
│   ├── motor-juego/       ← patrones, ranking, condición de victoria
│   ├── ocr/               ← Tesseract.js, post-procesamiento
│   └── almacenamiento/    ← interfaz única con localStorage
│
├── modo-presencial/       ← UI específica del modo presencial
│   ├── pages/             ← rutas de React Router
│   ├── components/        ← componentes de este modo
│   └── hooks/             ← hooks específicos del modo
│
├── shared/                ← componentes UI reutilizables (Button, Modal, etc.)
│   ├── components/
│   └── hooks/
│
├── lib/                   ← configuración de librerías externas (Sentry, Zustand stores)
│
└── main.tsx               ← entry point
```

### 7.2 Reglas de Arquitectura

1. **`core/*` es puro.** Sin React, sin hooks, sin DOM. Solo funciones y tipos. Esto lo hace testeable con Vitest sin jsdom.
2. **`core/*` no se importa entre sí** salvo a través de tipos en `core/types.ts`. Si `motor-juego` necesita un cartón, lo recibe como argumento, no importa de `cartones/`.
3. **localStorage solo se accede desde `core/almacenamiento/`.** Componentes y hooks llaman a funciones de almacenamiento; nunca tocan `window.localStorage` directamente.
4. **Los componentes UI no contienen lógica de negocio.** Si surge un cálculo no trivial, se mueve a `core/*` o a un hook.
5. **Cada módulo `core/*` exporta un `index.ts`** que define la API pública. Lo que no esté en `index.ts` es interno.

### 7.3 Modelo de Datos

Aunque en v1 no hay base de datos, los **tipos TypeScript** son el modelo. Definidos en `core/cartones/types.ts` y `core/motor-juego/types.ts`.

```typescript
// core/cartones/types.ts

export type SerieBingo = 'B' | 'I' | 'N' | 'G' | 'O';

export type NumerosCarton = {
  B: [number, number, number, number, number];
  I: [number, number, number, number, number];
  N: [number, number, 'FREE', number, number];  // centro libre
  G: [number, number, number, number, number];
  O: [number, number, number, number, number];
};

export type Carton = {
  id: string;          // UUID v4
  serie: string;       // identificador legible (opcional)
  numeros: NumerosCarton;
  creadoEn: string;    // ISO 8601
  fuente: 'manual' | 'ocr' | 'aleatorio' | 'importado';
};

// core/motor-juego/types.ts

export type CondicionVictoria =
  | { tipo: 'n_marcados'; valor: number }
  | { tipo: 'patron'; patronId: string }
  | { tipo: 'cartonLleno' };

export type Patron = {
  id: string;
  nombre: string;
  // grilla 5x5: true si la casilla forma parte del patrón
  // [fila][columna], la casilla [2][2] (centro) siempre es true (free space)
  grilla: boolean[][];
  creadoEn: string;
};

export type EstadoSesion = {
  numerosSorteados: number[];  // en orden cronológico
  iniciadaEn: string;
  condicionActiva: CondicionVictoria;
};
```

### 7.4 Esquema de localStorage

Todas las claves usan prefijo `bingo:` para evitar colisiones con otras apps en el mismo dominio.

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `bingo:schema_version` | `string` | Versión del esquema (ej: `"1.0"`). Permite migraciones futuras. |
| `bingo:cartones` | `Carton[]` (JSON) | Lista completa de cartones del usuario. |
| `bingo:patrones` | `Patron[]` (JSON) | Lista de patrones guardados. |
| `bingo:sesion_actual` | `EstadoSesion` (JSON) | Estado de la sesión de juego activa. |
| `bingo:preferencias` | `Preferencias` (JSON) | Preferencias del usuario (ej: condición de victoria por defecto). |

**Migraciones:** al arrancar, `core/almacenamiento/migrate.ts` lee `bingo:schema_version` y aplica migraciones si la versión actual del código es mayor. En v1 no hay migraciones todavía (es la versión inicial). En v1.5+ se documentará cada migración.

### 7.5 Esquema de integración (API y comunicación)

- **v1:** sin API propia. Solo se comunica con Sentry (errores) y Vercel Analytics (métricas anónimas), ambos vía sus SDKs oficiales.
- **v2:** se añadirá Supabase Client + WebSocket Realtime + Storage REST.

---

## 8. ESPECIFICACIONES TÉCNICAS DETALLADAS

### 8.1 Stack

| Componente | Versión objetivo | Justificación |
|------------|------------------|---------------|
| Node.js | 22 LTS | Requerido por pnpm 11. LTS hasta abril 2027. |
| pnpm | 11+ | Seguridad supply chain (ver ADR-0002). |
| React | 18.x | Estable, ecosistema maduro. React 19 evaluado en v1.5. |
| Vite | 5.x | Build rápido, soporte PWA vía `vite-plugin-pwa`. |
| TypeScript | 5.x con `strict: true` | Tipos estrictos = menos bugs en runtime. |
| Tailwind CSS | 3.x | Utility-first, sin CSS-in-JS. Mobile-first incorporado. |
| Zustand | 4.x | Estado global liviano, sin boilerplate (vs Redux). |
| Tesseract.js | 5.x | OCR client-side, sin servidor. Web Worker incorporado. |
| Workbox (via vite-plugin-pwa) | última estable | Generación automática del service worker. |
| Vitest | 1.x+ | Mismo runtime de Vite, rápido, sin config extra. |
| React Testing Library | 14.x | Tests centrados en comportamiento del usuario. |
| ESLint | 9.x con flat config | Estándar JS/TS. |
| Prettier | 3.x | Formateo automático, sin debate de estilo. |
| Husky | 9.x | Hooks de git fáciles de configurar. |
| lint-staged | 15.x | Corre linter solo en archivos modificados. |
| gitleaks | 8.x | Detector de secretos. |
| Sentry (`@sentry/react`) | última estable | Tracking de errores en producción. |
| `@vercel/analytics` | última estable | Métricas anónimas sin cookies. |

### 8.2 Testing Strategy

- **Unit tests** (Vitest, runtime Node sin DOM):
  - `core/cartones/`: validación de cartones, generación aleatoria, serialización.
  - `core/motor-juego/`: cálculo de proximidad al patrón, condición de victoria, ranking.
  - `core/almacenamiento/`: con mock de localStorage.
  - **Cobertura objetivo:** ≥ 80% en `core/motor-juego/`, ≥ 60% global en `core/*`.

- **Integration tests** (Vitest + React Testing Library + jsdom):
  - Componentes clave: `EditorPatrones`, `MarcadorNumero`, `RankingCartones`, vista de juego completa.
  - **Cobertura objetivo:** los 3 flujos principales (crear cartón manual, marcar número, declarar victoria).

- **E2E tests:** NO se incluyen en v1. Se evaluarán en v1.5 (con Playwright) si el proyecto crece.

- **CI:** GitHub Actions corre `pnpm lint && pnpm typecheck && pnpm test:run && pnpm build && pnpm audit --audit-level=high` en cada push y PR.

### 8.3 Convenciones de desarrollo

- Conventional Commits obligatorio
- Pre-commit hooks: ESLint, Prettier, gitleaks, typecheck (sobre archivos modificados con lint-staged)
- Archivos < 300 líneas
- Naming consistente (ver CLAUDE.md sección "Convenciones de Código")
- Branching: trunk-based simple. Trabajamos en `main` con commits frecuentes. Tags `v0.1.0` al cerrar cada fase importante; `v1.0.0` al cerrar F8.

### 8.4 Performance — Decisiones técnicas

- **Render del ranking:** memoización con `useMemo` del cálculo de proximidad. Solo recalcula cuando cambia `numerosSorteados`.
- **Render de cartones:** `React.memo` en el componente `Carton` con comparación por `id` + `casillasMarcadas.length`.
- **OCR:** se ejecuta en un Web Worker (lo hace Tesseract.js por defecto). El UI no se bloquea durante el procesamiento (que puede tardar 3-10 segundos).
- **Lazy loading:** la página de OCR y Tesseract.js se cargan con `lazy()` + `Suspense`. Esto evita que el bundle inicial cargue ~2 MB de modelos de Tesseract si el usuario solo crea cartones manuales.

---

## 9. INFRAESTRUCTURA Y DESPLIEGUE

### 9.1 Hardware

- **Cliente:** smartphone Android (4 GB RAM mínimo) o iPhone (iOS 16+). PWA instalada o navegador.
- **Servidor:** ninguno en v1. Vercel sirve el frontend estático.

### 9.2 Variables de entorno

Ver `.env.example` para la lista completa.

```env
# Sentry (público por diseño)
VITE_SENTRY_DSN=https://xxxxx@oXXX.ingest.sentry.io/XXX

# Entorno
VITE_APP_ENV=development
```

### 9.3 Pipeline de despliegue

- **Push a `main`** → GitHub Actions ejecuta CI (lint + test + build + audit).
- **Si CI pasa** → Vercel deploya automáticamente desde la integración GitHub ↔ Vercel.
- **Preview deploys:** cada PR genera un preview URL único en Vercel (útil para revisar antes de mergear).
- **Production:** solo desde `main`, después de que CI pase.
- **Rollback:** Vercel guarda historial de deploys. Botón "Rollback" en su dashboard revierte en < 30 segundos.

### 9.4 Comandos de despliegue manual (raros, solo si automático falla)

```bash
# Build local
pnpm install --frozen-lockfile
pnpm build

# Deploy via Vercel CLI (requiere `pnpm dlx vercel login` previo)
pnpm dlx vercel --prod
```

---

## 10. EVALUACIÓN Y VALIDACIÓN

### 10.1 Métricas de éxito

| Métrica | Meta | Método de medición |
|---------|------|---------------------|
| Lighthouse Performance (móvil) | ≥ 90 | Lighthouse CI en cada PR (configuración en F1.1) |
| Lighthouse PWA | 100 | Lighthouse CI |
| Lighthouse Accessibility | ≥ 90 | Lighthouse CI |
| Tiempo de marcado en 10 cartones | < 100 ms | Test de performance manual en F4.1 |
| Precisión OCR (foto nítida, luz buena) | ≥ 70% acierto por casilla | Suite de 10 fotos de prueba en F5.3 |
| Cobertura `core/motor-juego/` | ≥ 80% | `pnpm test:coverage` en F3.3 |
| Funciona offline tras primera carga | Sí (binario) | Test manual en F6.1 |
| Instalable como PWA | Sí (binario) | Test manual en F6.1 |

### 10.2 Casos de prueba (validación funcional)

**Camino feliz mínimo:**

1. Usuario abre la app → ve pantalla de inicio.
2. Crea un cartón manualmente con 25 números válidos.
3. Crea un patrón "L" dibujándolo en el editor.
4. Configura condición de victoria = patrón "L".
5. Ingresa 5 números sorteados; la app marca correctamente las casillas.
6. Ingresa el último número que completa la "L"; aparece mensaje "¡BINGO!".

**Camino OCR:**

1. Usuario abre "Crear cartón con foto".
2. Sube una foto de prueba (cartón nítido).
3. Tesseract detecta y muestra vista previa con indicadores de confianza.
4. Usuario corrige 2 casillas mal detectadas.
5. Confirma → cartón aparece en su lista.

**Camino persistencia:**

1. Usuario crea 3 cartones y 2 patrones.
2. Recarga la página.
3. Los cartones y patrones siguen ahí.
4. Exporta su estado a JSON.
5. Limpia localStorage manualmente desde DevTools.
6. Importa el JSON exportado.
7. Todo vuelve.

**Camino offline:**

1. Usuario abre la app (online) → todo carga.
2. Pone el celular en modo avión.
3. Crea cartones, marca números, todo funciona.
4. Sale del modo avión → no se pierde nada.

### 10.3 Criterios mínimos de aprobación para release v1.0

- [ ] Las 35 RF implementadas y verificadas con tests manuales según 10.2
- [ ] Todas las RNF cumplidas y medidas
- [ ] CI verde en `main`
- [ ] Lighthouse: Performance ≥ 90, PWA = 100, Accessibility ≥ 90
- [ ] Cobertura de `core/motor-juego/` ≥ 80%
- [ ] Despliegue exitoso en Vercel con dominio `bingo-digital.vercel.app`
- [ ] Sentry recibe el primer evento de prueba correctamente
- [ ] Vercel Analytics activo
- [ ] `docs/` y `README.md` actualizados
- [ ] Tag `v1.0.0` creado en git

---

## 11. CUMPLIMIENTO REGULATORIO

### 11.1 Aplicabilidad en v1

**En v1 no aplica regulación específica** porque:

- No hay tratamiento de datos personales en servidor (no hay servidor).
- No hay base de datos centralizada.
- Las fotos del OCR se procesan localmente.
- No se generan cookies ni se hace tracking de usuarios individuales.
- Vercel Analytics está configurado sin cookies y agrega métricas anónimas (no requiere consentimiento).

Por eso, en v1 NO se incluye banner de privacidad ni página de política de privacidad. Esto es coherente con el principio de **minimización de datos**: lo mejor para la privacidad es no recoger nada.

### 11.2 Preparación para v2 — Ley 29733 (Perú)

Cuando llegue v2 (cuentas, eventos virtuales, pagos), aplicará la **Ley 29733 — Ley de Protección de Datos Personales del Perú** (jurisdicción aplicable por estar dirigida al mercado peruano).

Datos personales que se manejarán en v2:

- Email del moderador y jugadores (para magic link)
- Nombre opcional
- Comprobantes de pago subidos por jugadores (pueden contener datos bancarios visibles)
- IP de acceso (para Supabase Auth y rate limiting)

Derechos del titular a implementar en v2:

- [ ] Acceso (ver mis datos en perfil)
- [ ] Rectificación (editar nombre/email)
- [ ] Supresión / Olvido (borrar mi cuenta + datos asociados)
- [ ] Portabilidad (exportar mis eventos/cartones)
- [ ] Oposición al tratamiento

Plazos a respetar en v2:

- Respuesta a solicitud de derechos: 20 días hábiles (Ley 29733 Art. 24)
- Notificación de brecha de seguridad: lo antes posible al titular afectado y a la APDP (Autoridad Nacional de Protección de Datos Personales)
- Retención de comprobantes de pago: 30 días después de finalizado el evento, luego eliminación automática (Storage de Supabase)

En v2 será obligatorio:

- [ ] Página `/privacidad` con política completa
- [ ] Página `/terminos` con términos de servicio
- [ ] Banner de consentimiento si se añaden cookies o trackers no esenciales (Vercel Analytics actual es exento)
- [ ] Registro de actividades de tratamiento (interno)
- [ ] Designación de responsable de tratamiento (probablemente el moderador-empresa para sus eventos)

### 11.3 Referencias

- Ley 29733: https://www.gob.pe/institucion/minjus/normas-legales/243470-29733
- APDP Perú: https://www.gob.pe/institucion/minjus/temas/proteccion-de-datos-personales

---

_Última actualización: 2026-05-14_
_Versión del documento: 1.0_
_Generado por project-kickstart v2.0_
