# Glosario — Bingo Digital

> Términos del dominio del bingo y términos técnicos del proyecto. Mantén esta lista actualizada conforme aparezcan términos nuevos.

---

## Términos del dominio (bingo)

### Cartón
**Definición:** El tablero de bingo. Una grilla 5x5 con 25 casillas (24 números + 1 casilla libre central).
**Contexto en el sistema:** Tipo `Carton` en `src/core/cartones/types.ts`. Cada cartón tiene un UUID, una `serie` opcional (identificador legible para el usuario), un objeto `numeros` con las 5 columnas, y metadata (`creadoEn`, `fuente`).
**Ejemplo:** "Tengo 3 cartones para esta partida."

### Serie del bingo (B-I-N-G-O)
**Definición:** Cada columna del cartón corresponde a una letra de la palabra BINGO y tiene un rango específico de números:
- **B** → 1-15
- **I** → 16-30
- **N** → 31-45 (con casilla central libre)
- **G** → 46-60
- **O** → 61-75

**Contexto en el sistema:** Tipo `SerieBingo = 'B' | 'I' | 'N' | 'G' | 'O'`. Se usa para validar números (`validarNumerosCarton`) y para organizar el teclado y el historial.

### Casilla libre / Free space
**Definición:** La casilla central del cartón (fila 2, columna 2 = serie N). Siempre cuenta como "marcada" desde el inicio.
**Contexto en el sistema:** En `NumerosCarton.N[2]` el valor es la constante `'FREE'` (no un número). En la lógica de marcado, la coordenada `"2,2"` siempre está en el `Set` de casillas marcadas.

### Número sorteado / cantado
**Definición:** Un número del 1 al 75 que el moderador del bingo anuncia en voz alta durante la partida.
**Contexto en el sistema:** En la app, el usuario ingresa el número desde el teclado numérico. Se añade a `EstadoSesion.numerosSorteados`.
**Ejemplo:** "Cantaron el B-7" → el usuario tappea el 7 en la columna B del teclado.

### Patrón ganador / patrón de victoria
**Definición:** La forma específica que debe completarse en el cartón para ganar. Puede ser una línea horizontal, vertical, diagonal, una "L", una "X", el cartón lleno, o cualquier forma definida por la casa.
**Contexto en el sistema:** Tipo `Patron`. Representado como una matriz `boolean[5][5]` donde `true` significa que esa casilla forma parte del patrón. La casilla central siempre es `true` (free space).
**Ejemplo:** Patrón "Diagonal principal" = casillas `[0,0]`, `[1,1]`, `[2,2]`, `[3,3]`, `[4,4]`.

### Condición de victoria
**Definición:** La regla configurable que define cuándo un cartón gana en una sesión específica. Tres tipos soportados:
1. **N marcados** — el primer cartón en alcanzar N casillas marcadas gana (ej: primeros 5).
2. **Patrón específico** — el primer cartón en completar un patrón dibujado gana.
3. **Cartón lleno** — el primer cartón en marcar las 24 casillas (excluyendo el FREE) gana.

**Contexto en el sistema:** Tipo `CondicionVictoria` (unión discriminada por `tipo`). Se establece en `ConfiguracionJuego` antes de jugar.

### BINGO! (la palabra)
**Definición:** El grito que da el jugador cuando completa el patrón ganador.
**Contexto en el sistema:** Cuando el motor detecta que un cartón cumple la condición activa (`faltan === 0`), la app muestra un badge "🏆 ¡BINGO!" sobre ese cartón.

### CASI / MUY CERCA
**Definición:** Términos del producto (no del bingo tradicional) para alertar al jugador de cartones cercanos a ganar.
**Contexto en el sistema:**
- "🔥 MUY CERCA" cuando `faltan` ∈ {1, 2}
- "🎯 CASI" cuando `faltan` ∈ {3, 4, 5}

### Ranking dinámico
**Definición:** Lista de los cartones del usuario ordenada por proximidad al patrón ganador, recalculada en tiempo real con cada número sorteado.
**Contexto en el sistema:** Función `calcularRanking` en `src/core/motor-juego/ranking.ts`. Selector `rankingComputed` en el store de sesión.

### Sesión de juego
**Definición:** Una partida de bingo en curso. Incluye los números sorteados hasta ahora, la condición activa, y la fecha de inicio.
**Contexto en el sistema:** Tipo `EstadoSesion`. Persiste en `localStorage` bajo `bingo:sesion_actual` para no perderse al recargar accidentalmente.

### Modo presencial
**Definición:** El modo de uso en v1: el jugador está físicamente en un bingo, alguien canta los números en voz alta, el jugador los ingresa en la app para marcar sus cartones digitalizados.
**Contexto en el sistema:** Todo `src/modo-presencial/`. UI optimizada para uso en celular durante un evento ruidoso y rápido.

### Modo virtual
**Definición:** El modo futuro (v2): eventos remotos, donde un moderador transmite los números desde su panel y los jugadores reciben actualizaciones en tiempo real desde sus dispositivos.
**Contexto en el sistema:** **NO existe en v1**. Se planea como `src/modo-virtual/` en v2, con Supabase Realtime.

---

## Términos técnicos del proyecto

### PWA (Progressive Web App)
**Definición:** Aplicación web que se instala en el dispositivo como una app nativa, funciona offline y se ve a pantalla completa.
**Dónde aparece:** Configuración en `vite.config.ts` (plugin `vite-plugin-pwa`), manifest en `public/manifest.webmanifest`, service worker generado por Workbox.

### Service Worker
**Definición:** Script que corre en segundo plano en el navegador, intercepta peticiones de red y permite que la app funcione offline.
**Dónde aparece:** Generado automáticamente por `vite-plugin-pwa` durante `pnpm build`. No se escribe manualmente.

### OCR (Optical Character Recognition)
**Definición:** Tecnología que convierte texto en imágenes (foto del cartón) en datos legibles (los 24 números).
**Dónde aparece:** `src/core/ocr/` usando **Tesseract.js**. Corre 100% en el navegador (Web Worker); las imágenes jamás salen del dispositivo.

### Tesseract.js
**Definición:** Port a JavaScript del motor de OCR Tesseract de Google. Funciona en el navegador como Web Worker.
**Dónde aparece:** `src/core/ocr/tesseract.ts`. Pesa ~2 MB (modelos + worker), por eso se carga con `lazy()` para no inflar el bundle inicial.

### localStorage
**Definición:** API del navegador para almacenamiento persistente clave-valor (5-10 MB por origen). Los datos sobreviven a cerrar el navegador, pero se borran si el usuario limpia datos del sitio o cambia de dispositivo.
**Dónde aparece:** Encapsulado en `src/core/almacenamiento/`. **Ningún otro módulo debe tocar `window.localStorage` directamente.**

### Schema versioning
**Definición:** Versionado del formato de datos en localStorage para permitir migraciones futuras sin perder datos del usuario.
**Dónde aparece:** Constante `SCHEMA_VERSION` y función `migrarSiHaceFalta()` en `src/core/almacenamiento/schema.ts`. Clave `bingo:schema_version` en localStorage.

### Zustand
**Definición:** Biblioteca minimalista de manejo de estado global para React. Más simple que Redux, sin boilerplate.
**Dónde aparece:** `src/lib/stores/`. Un store por dominio: `cartones.ts`, `patrones.ts`, `sesion.ts`.

### Zod
**Definición:** Biblioteca de validación de esquemas para TypeScript con inferencia de tipos.
**Dónde aparece:** `src/core/cartones/validacion.ts` y todos los puntos de entrada de datos (formularios, imports, resultados de OCR).

### Result pattern
**Definición:** Patrón funcional para manejar operaciones que pueden fallar, sin lanzar excepciones. Retorna `{ ok: true, value: T }` o `{ ok: false, errors: E }`.
**Dónde aparece:** Funciones de validación y de almacenamiento. Hace explícitos los errores en el sistema de tipos.

### Conventional Commits
**Definición:** Convención estándar para mensajes de commit (`feat:`, `fix:`, `docs:`, etc.) que permite generar changelogs automáticos y versionado semántico.
**Dónde aparece:** Validado por `commitlint` en el hook `commit-msg`.

### Husky
**Definición:** Herramienta que facilita configurar git hooks (pre-commit, commit-msg, pre-push).
**Dónde aparece:** Carpeta `.husky/` con los scripts. Se instalan corriendo `pnpm prepare` después de `pnpm install`.

### lint-staged
**Definición:** Corre linters solo sobre los archivos modificados antes de commit, no sobre todo el repo.
**Dónde aparece:** Configurado en `package.json` bajo la clave `"lint-staged"`. Lo invoca el hook pre-commit.

### gitleaks
**Definición:** Escáner de secretos hardcodeados en código (API keys, tokens, passwords). Bloquea el commit si los detecta.
**Dónde aparece:** Hook pre-commit. Configurado vía `.pre-commit-config.yaml` o ejecutado directamente.

### Sentry
**Definición:** Plataforma de tracking de errores en producción. Captura excepciones del cliente con stack traces.
**Dónde aparece:** `src/lib/sentry.ts`. Configurado con `sendDefaultPii: false` y un `beforeSend` que filtra contenido de cartones.

### DSN (Data Source Name de Sentry)
**Definición:** URL pública del proyecto en Sentry. Identifica a qué proyecto enviar errores. **No es secreta** — está pensada para vivir en el bundle del frontend.
**Dónde aparece:** Variable de entorno `VITE_SENTRY_DSN`. El prefijo `VITE_` la expone al cliente (Vite solo expone las variables con ese prefijo).

### Vercel Analytics
**Definición:** Servicio de métricas de uso (páginas vistas, web vitals) integrado a Vercel. Por defecto **sin cookies**, agregado y anónimo.
**Dónde aparece:** Paquete `@vercel/analytics`, componente `<Analytics />` en `App.tsx`.

### Edge Function (futuro v2)
**Definición:** Función serverless que corre cerca del usuario (Vercel Edge Network o Supabase Edge). Útil para validaciones críticas (ej: confirmar ganador del bingo virtual).
**Dónde aparecerá:** v2 — `supabase/functions/` o `api/` en Vercel.

### Row Level Security (RLS) (futuro v2)
**Definición:** Mecanismo de Postgres (y Supabase) que aplica reglas de acceso a nivel de fila. Cada query es filtrada automáticamente según el usuario que la hace.
**Dónde aparecerá:** v2 — políticas RLS en migraciones de Supabase.

---

## Acrónimos

| Acrónimo | Significado | Contexto |
|----------|-------------|----------|
| PWA | Progressive Web App | El tipo de aplicación que es Bingo Digital |
| OCR | Optical Character Recognition | Lectura de los números del cartón desde una foto |
| RF | Requisito Funcional | Cada feature en `docs/especificaciones.md` sección 3 |
| RNF | Requisito No Funcional | Performance, seguridad, etc. en sección 4 |
| RNF-SEC | RNF de Seguridad | Reglas OWASP y de hardening en sección 5 |
| DoD | Definition of Done | Checklist al cerrar cada subfase |
| ADR | Architecture Decision Record | Documentos en `docs/adr/` que registran decisiones técnicas |
| OWASP | Open Worldwide Application Security Project | Marco de referencia de seguridad |
| CSP | Content Security Policy | Header HTTP que limita qué recursos puede cargar la página |
| HSTS | HTTP Strict Transport Security | Header HTTP que fuerza HTTPS |
| WCAG | Web Content Accessibility Guidelines | Estándar de accesibilidad web (apuntamos a nivel AA) |
| CI | Continuous Integration | GitHub Actions que corre tests en cada push |
| CD | Continuous Deployment | Deploy automático a Vercel desde `main` |
| FCP | First Contentful Paint | Métrica de performance: cuándo aparece el primer texto |
| TTI | Time To Interactive | Métrica de performance: cuándo la app responde a clicks |
| PII | Personally Identifiable Information | Datos personales. En v1 no manejamos PII en servidor. |
| HMAC | Hash-based Message Authentication Code | Validación de webhooks (relevante en v2.5 con Culqi) |
| RLS | Row Level Security | Política de acceso por fila en Postgres (v2) |
| LTS | Long Term Support | Node.js 22 LTS = soporte hasta abril 2027 |
| APDP | Autoridad Nacional de Protección de Datos Personales | Regulador peruano (relevante en v2) |

---

## Términos del dominio externo (regulación)

Estos términos se vuelven relevantes en **v2**, cuando se introduzca tratamiento de datos personales en servidor. Se listan aquí para que el equipo (tú + Claude Code) los tenga en mente al planificar v2.

### Ley 29733
**Definición:** Ley de Protección de Datos Personales del Perú. Equivalente local del GDPR europeo, con diferencias en plazos y autoridad reguladora.
**Aplica cuando:** se traten datos personales identificables de residentes en Perú. **En v1 no aplica** porque no hay servidor ni base de datos.

### Banco de datos personales
**Definición:** Conjunto organizado de datos personales (en la Ley 29733). Si se va a explotar comercialmente, debe inscribirse ante la APDP.
**Aplica cuando:** v2 con cuentas de usuarios y eventos pagos.

### Consentimiento informado
**Definición:** Autorización explícita y libre del titular para tratar sus datos personales, con información clara de para qué se usarán.
**Aplica cuando:** v2 — magic link de registro debería incluir consentimiento explícito.

### Derecho ARCO
**Definición:** Acrónimo de los derechos del titular: Acceso, Rectificación, Cancelación, Oposición. La Ley 29733 los garantiza con plazo de respuesta de 20 días hábiles.
**Aplica cuando:** v2 — la app deberá tener un flujo para que el usuario ejerza estos derechos (ver/editar/borrar sus datos).

---

_Última actualización: 2026-05-14_
