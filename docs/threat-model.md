# Modelo de Amenazas — Bingo Digital

> Threat model en formato ligero. v1 tiene **superficie de ataque pequeña** (PWA sin backend). v2 ampliará este documento sustancialmente con la introducción de Supabase, autenticación, pagos y datos personales.

**Versión:** v1.0
**Última revisión:** 2026-05-14

---

## 1. Activos a proteger

### En v1 (modo presencial, sin backend)

| Activo                          | Tipo                                                 | Sensibilidad                                                             | Donde vive                                                |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| Cartones del usuario            | Dato personal pequeño (preferencia personal, no PII) | Baja                                                                     | `localStorage` del navegador                              |
| Patrones del usuario            | Configuración personal                               | Baja                                                                     | `localStorage`                                            |
| Fotos del cartón físico (OCR)   | Imagen subida por el usuario                         | Media (potencialmente identifica al jugador si la foto incluye contexto) | Procesada en memoria, **jamás persistida ni transmitida** |
| Integridad del código de la app | Código JavaScript servido a usuarios                 | Media                                                                    | Repo + Vercel build pipeline                              |
| Cadena de suministro npm        | Paquetes que se instalan al hacer build              | Alta                                                                     | `pnpm-lock.yaml` + registro de npm                        |
| DSN de Sentry                   | URL pública del proyecto Sentry                      | Baja (público por diseño)                                                | `.env` → bundle del cliente                               |
| Token de Sentry para CI         | Permite subir sourcemaps                             | Alta                                                                     | GitHub Secrets                                            |

### En v2 (modo virtual, con Supabase) — preview

| Activo                                                     | Tipo                                         | Sensibilidad | Donde vivirá                                            |
| ---------------------------------------------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------- |
| Email del usuario                                          | PII                                          | Alta         | Supabase Auth                                           |
| Eventos del moderador                                      | Datos de negocio                             | Media        | Postgres                                                |
| Comprobantes de pago subidos                               | Imágenes que pueden contener datos bancarios | **Crítica**  | Supabase Storage                                        |
| Tokens de sesión (Supabase JWT)                            | Credencial activa                            | Crítica      | Cookies HttpOnly + localStorage en cliente              |
| IPs de acceso                                              | Dato personal indirecto                      | Media        | Logs de Supabase Auth                                   |
| Llaves secretas (Supabase service_role, Culqi private_key) | Credenciales de servidor                     | **Crítica**  | Solo en variables de entorno de Vercel (Edge Functions) |

---

## 2. Actores

### Legítimos

- **Jugador presencial (v1):** persona que usa la app en su celular durante un bingo físico. No tiene cuenta, no comparte datos.
- **Moderador virtual (v2):** persona que crea eventos online y vende cartones.
- **Jugador virtual (v2):** persona que compra cartones para un evento.
- **Mantenedor del proyecto:** el autor, con acceso a GitHub, Vercel, Sentry, (futuro) Supabase, Culqi.

### Maliciosos

- **Atacantes externos anónimos:** buscan vulnerabilidades comunes en apps web (XSS, CSP bypass, secrets en bundle, dependencias vulnerables).
- **Atacantes de cadena de suministro:** publican paquetes npm maliciosos esperando que devs los instalen. Documentado en `docs/adr/0002-pnpm-sobre-npm.md`.
- **Atacantes con motivación financiera (v2+):** intentarán falsificar transacciones de pago o forzar declaración de ganador falso.
- **Insiders curiosos (futuro):** si crece el equipo, devs con acceso a la BD podrían fisgonear datos de usuarios. **No aplica en v1 con un solo dev.**
- **Bots/scrapers:** automatizados, intentan registrar masivamente, hacer requests, romper el rate limiting.

---

## 3. Top amenazas (v1)

La superficie de v1 es muy pequeña al no haber backend. Se documentan las amenazas reales que aplican.

### A1 — Compromiso de cadena de suministro (npm)

- **Vector:** un paquete (directo o transitivo) se publica con código malicioso al registro de npm. El próximo `pnpm install` lo trae al proyecto. El malware ejecuta en build (postinstall) o se incluye en el bundle servido a usuarios.
- **Impacto:** ejecución de código arbitrario en la máquina del autor (robo de tokens, credenciales) y/o en navegadores de usuarios finales (exfiltración de localStorage, redirección a phishing).
- **Probabilidad:** **media** (ataques documentados en 2025-2026 — Shai-Hulud, Mini Shai-Hulud, PackageGate).
- **Mitigaciones aplicadas:**
  - ✅ pnpm con `minimumReleaseAge: 1440` (cooldown 24h, ver ADR-0002).
  - ✅ `strictDepBuilds: true` (no se ejecutan scripts arbitrarios al instalar).
  - ✅ `blockExoticSubdeps: true` (no se aceptan deps de URLs no estándar).
  - ✅ `pnpm audit --audit-level=high` en CI.
  - ✅ `--frozen-lockfile` en CI.
  - ✅ gitleaks en pre-commit (evita commitear tokens accidentalmente).
  - ✅ Revisión manual antes de cada nueva dependencia.
- **Prioridad:** **Alta**

### A2 — XSS via input de usuario

- **Vector:** el usuario ingresa contenido malicioso en un input (ej: nombre de patrón con `<script>`). Si no se escapa correctamente, ejecuta en el navegador del usuario que vea ese contenido.
- **Impacto:** en v1, **bajo** (no hay multi-usuario; el usuario solo se hace daño a sí mismo). Pero igual debe prevenirse por higiene.
- **Probabilidad:** baja (React escapa por defecto).
- **Mitigaciones aplicadas:**
  - ✅ React 18 escapa todo HTML por defecto en JSX.
  - ✅ **Prohibido** `dangerouslySetInnerHTML` en v1.
  - ✅ Validación Zod limita longitud y caracteres de nombres de patrón.
  - ✅ CSP en `vercel.json` bloquea scripts inline y externos no autorizados.
- **Prioridad:** **Baja** (por arquitectura, no por descuido)

### A3 — localStorage tampering

- **Vector:** un usuario malicioso modifica directamente los valores en `localStorage` desde DevTools, inyectando datos malformados que crashearían la app.
- **Impacto:** la app crashea para ese usuario, posiblemente revelando un stack trace que da información sobre la implementación. En v1, solo se hace daño a sí mismo.
- **Probabilidad:** muy baja (requiere conocimiento técnico + voluntad de romper tu propia app).
- **Mitigaciones aplicadas:**
  - ✅ Validación Zod al leer `localStorage`. Si los datos no son válidos, se ignoran y se notifica via console.warn.
  - ✅ Manejo de errores: la app no muestra stack traces al usuario en producción.
- **Prioridad:** **Baja**

### A4 — OCR procesa imagen maliciosa

- **Vector:** el usuario sube una imagen especialmente construida que explota una vulnerabilidad en Tesseract.js o en el decoder de imágenes del navegador.
- **Impacto:** posible crash del worker, en el peor caso ejecución de código en el contexto del worker (que está sandboxed).
- **Probabilidad:** muy baja. Las imágenes pasan por el decoder nativo del navegador antes de llegar a Tesseract; los decoders modernos son hardened.
- **Mitigaciones aplicadas:**
  - ✅ Tesseract.js corre como Web Worker (sandboxed; sin acceso al DOM).
  - ✅ CSP con `worker-src 'self' blob:` limita workers a self.
  - ✅ Validación del tipo MIME del archivo antes de procesar.
- **Prioridad:** **Baja**

### A5 — Sentry exfiltración accidental de datos

- **Vector:** un bug captura datos del usuario (números del cartón, foto de OCR) y los envía a Sentry sin querer. Los datos podrían quedar en logs de Sentry indefinidamente.
- **Impacto:** datos del usuario expuestos en el dashboard de Sentry (accesible al autor + a Sentry como proveedor).
- **Probabilidad:** baja-media (es fácil meter datos en `Sentry.captureException(error, { extra: { carton } })`).
- **Mitigaciones aplicadas:**
  - ✅ `sendDefaultPii: false` en init de Sentry.
  - ✅ `beforeSend(event)` que filtra eventos cuyo payload contenga claves: `carton`, `cartones`, `numeros`, `ocrImage`, `foto`.
  - ✅ Documentado en CLAUDE.md sección "Logging".
- **Prioridad:** **Media** (por la facilidad de cometer este error)

### A6 — Vercel deploy comprometido

- **Vector:** token de Vercel filtrado permite a un atacante hacer deploys arbitrarios.
- **Impacto:** servir código malicioso bajo el dominio `bingo-digital.vercel.app`.
- **Probabilidad:** muy baja (el token solo vive en GitHub Actions secrets y en Vercel mismo).
- **Mitigaciones aplicadas:**
  - ✅ GitHub Secrets con scope mínimo.
  - ✅ Deploy automático desde repo (no se necesita token local).
  - ✅ Vercel guarda historial de deploys → rollback rápido si algo se nota.
- **Prioridad:** **Baja** (pero alto impacto si ocurriera)

---

## 4. Mitigaciones generales aplicadas

### Defensa en profundidad — Capas de protección activas

- ✅ **HTTPS forzado** + HSTS (Vercel + `vercel.json`)
- ✅ **Headers de seguridad** completos: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. Detalles en `docs/especificaciones.md` RNF-SEC-A05-1.
- ✅ **CSP estricta:** `default-src 'self'`; scripts solo desde self + Sentry + Vercel Analytics; sin `unsafe-inline` para scripts.
- ✅ **Validación de input con Zod** en todos los puntos de entrada.
- ✅ **Pre-commit hooks:** ESLint, Prettier, gitleaks, typecheck (lint-staged).
- ✅ **CI completo:** lint + typecheck + test + build + audit en cada push.
- ✅ **Sourcemaps de producción no servidos** públicamente; subidos a Sentry para debug del autor.
- ✅ **Source maps con `hidden: true`** en Vite build.
- ✅ **Dependencias auditadas** (`pnpm audit`) + cooldown de 24h.
- ✅ **Sentry filtrando contenido sensible** vía `beforeSend`.
- ✅ **Vercel Analytics sin cookies** ni tracking individual.

### Privacidad por diseño

- ✅ **Datos locales por default:** todo en localStorage; ningún backend.
- ✅ **OCR client-side:** las fotos jamás salen del dispositivo.
- ✅ **Sin tracking de usuario:** Vercel Analytics agrega métricas, no individuos.
- ✅ **Logs sin PII ni contenido del usuario.**

---

## 5. Mitigaciones pendientes (riesgo aceptado por ahora)

### En v1 (riesgo aceptado deliberadamente)

| Pendiente                                      | Razón de aceptación                                                                                                                                                                                                                                                                                     | Plan                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Subresource Integrity (SRI) en assets externos | Worker + core de Tesseract.js auto-hospedados desde `node_modules` vía `vite-plugin-static-copy` (servidos desde mismo origen). El modelo `eng.traineddata` se descarga de `cdn.jsdelivr.net` en runtime (~10 MB) y se permite en `connect-src` de CSP. No es código ejecutable; solo datos del modelo. | Activar SRI si en el futuro cargamos scripts adicionales desde CDN.          |
| WAF (Web Application Firewall)                 | Vercel tiene protección básica. WAF dedicado es overkill para esta superficie.                                                                                                                                                                                                                          | Considerar en v2 (con backend y pagos).                                      |
| Bug bounty / responsible disclosure            | Proyecto personal pequeño.                                                                                                                                                                                                                                                                              | Si crece la base de usuarios, abrir `SECURITY.md` con dirección de contacto. |

### Para v2 (obligatorio al introducir Supabase)

- ⏳ Rate limiting en endpoints de Supabase Edge Functions
- ⏳ Validación HMAC de webhooks de Culqi
- ⏳ RLS estricto en todas las tablas de Postgres
- ⏳ MFA para el moderador (admin)
- ⏳ Notificaciones de login desde IP nueva (Supabase Auth)
- ⏳ Test de restore de backup documentado
- ⏳ Política de retención de comprobantes de pago (eliminación automática a los 30 días)
- ⏳ Threat model ampliado: amenazas A7-A20 específicas del modo virtual
- ⏳ Política de privacidad pública conforme a Ley 29733
- ⏳ Auditoría externa antes del lanzamiento de v2.5 (cuando entren pagos automáticos)

---

## 6. Proceso de actualización de este documento

- **Cada release importante (v1.5, v2.0, v2.5):** revisar y ampliar la sección "Top amenazas".
- **Cuando se añada un nuevo activo:** documentarlo en sección 1.
- **Cuando se incorpore un nuevo actor:** documentarlo en sección 2.
- **Cuando aparezca un incidente público en el ecosistema** (otro Shai-Hulud, vulnerabilidad de React, etc.): evaluar si afecta y actualizar mitigaciones.

---

## 7. Referencias

- OWASP Top 10 (2025): https://owasp.org/Top10/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- Mozilla Web Security Cheat Sheet: https://infosec.mozilla.org/guidelines/web_security
- `docs/especificaciones.md` sección 5
- `docs/adr/0002-pnpm-sobre-npm.md`
- `CLAUDE.md` sección "🔒 SEGURIDAD INVIOLABLE"
