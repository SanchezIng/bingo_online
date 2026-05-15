# Bingo Digital 🎯

Una **Progressive Web App** (PWA) para marcar cartones de bingo presencial desde el celular. Digitaliza tus cartones físicos (manualmente o con la cámara), marca los números cantados desde un teclado táctil grande, y ve en tiempo real qué cartón está más cerca de ganar.

> **Estado actual:** v1.0 en desarrollo (modo presencial). El modo virtual (eventos remotos con backend) llega en v2. Ver [ROADMAP.md](./ROADMAP.md).

---

## ✨ Características principales (v1.0)

- 📋 **Cartones digitales** — crea cartones manualmente o tomando una foto (OCR)
- 🎨 **Patrones libres** — dibuja tu propio patrón ganador en una grilla táctil (L, X, diagonal, lo que quieras)
- 🔢 **Marcador rápido** — teclado numérico grande optimizado para usar durante un bingo en vivo
- 🏆 **Ranking dinámico** — los cartones se reordenan automáticamente por proximidad al patrón ganador
- 📱 **PWA instalable** — funciona offline tras la primera carga, se instala como app
- 🔒 **Privacidad total** — todos tus datos viven en tu dispositivo. Las fotos del OCR jamás se suben a un servidor.

---

## 📸 Capturas

_Pendiente — se añaden al cerrar F7._

---

## 🛠️ Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5 (strict)
- **Estilos:** Tailwind CSS 3
- **Estado:** Zustand 4
- **Validación:** Zod
- **OCR:** Tesseract.js 5 (procesamiento 100% en el navegador)
- **PWA:** Workbox via vite-plugin-pwa
- **Tests:** Vitest + React Testing Library
- **Hosting:** Vercel
- **Observabilidad:** Sentry + Vercel Analytics
- **Package manager:** **pnpm 11+** con configuración endurecida — ver [ADR-0002](./docs/adr/0002-pnpm-sobre-npm.md)

Sin backend en v1. Todo persiste en `localStorage` del navegador.

---

## ⚙️ Requisitos previos

- **Node.js 22 LTS** (necesario para pnpm 11)
- **pnpm 11+** — instalación: `npm install -g pnpm@latest` (o vía [corepack](https://nodejs.org/api/corepack.html))
- **Git**

Verifica las versiones:

```bash
node --version    # debe ser v22.x
pnpm --version    # debe ser 11.x o superior
```

---

## 🚀 Instalación local

```bash
git clone https://github.com/TU-USUARIO/bingo-digital.git
cd bingo-digital

# Instalar dependencias (respeta el lockfile exactamente)
pnpm install --frozen-lockfile

# Copiar variables de entorno
cp .env.example .env
# Editar .env si quieres habilitar Sentry localmente (opcional)

# Instalar git hooks de Husky
pnpm prepare

# Arrancar el servidor de desarrollo
pnpm dev
```

La app estará en `http://localhost:5173`.

---

## 📂 Estructura del proyecto

```
bingo-digital/
├── src/
│   ├── core/                  # Lógica de dominio pura (sin React)
│   │   ├── cartones/          # Modelo, validación, generador
│   │   ├── motor-juego/       # Patrones, ranking, victoria
│   │   ├── ocr/               # Tesseract.js, post-procesamiento
│   │   └── almacenamiento/    # localStorage abstraído
│   ├── modo-presencial/       # UI del modo presencial
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   ├── shared/                # Componentes UI reutilizables
│   ├── lib/                   # Sentry, stores Zustand, router
│   └── main.tsx               # Entry point
├── public/                    # Assets estáticos
├── docs/                      # Documentación técnica
│   ├── especificaciones.md
│   ├── guia_desarrollo.md
│   ├── glosario.md
│   ├── threat-model.md
│   └── adr/                   # Architecture Decision Records
├── progreso/                  # Estado de desarrollo
├── .github/workflows/         # CI/CD
└── CLAUDE.md                  # Contexto para Claude Code
```

> **Nota:** la estructura **crece por fase**. Las carpetas `src/core/*`, `src/modo-presencial/`, etc. se crean a medida que el desarrollo avanza. Ver [guia_desarrollo.md](./docs/guia_desarrollo.md).

---

## 🧪 Cómo correr los tests

```bash
pnpm test               # modo watch (re-corre al guardar)
pnpm test:run           # corrida única (para CI)
pnpm test:coverage      # con reporte de cobertura
```

Cobertura objetivo: **≥80% en `src/core/motor-juego/`**, ≥60% global en la lógica de negocio.

---

## 🧹 Calidad de código

```bash
pnpm lint               # ESLint (reporta)
pnpm lint:fix           # ESLint con auto-fix
pnpm format             # Prettier (escribe)
pnpm format:check       # Prettier (solo verifica)
pnpm typecheck          # tsc --noEmit
```

Estos comandos se ejecutan automáticamente en:
- **Pre-commit** (vía Husky + lint-staged)
- **CI** (en cada push y PR)

---

## 🔒 Seguridad

Este proyecto adopta defensas explícitas contra ataques de cadena de suministro en el ecosistema npm tras los incidentes de 2025-2026 (Shai-Hulud, PackageGate, etc.). Decisiones documentadas en [ADR-0002](./docs/adr/0002-pnpm-sobre-npm.md).

Resumen:
- **pnpm** con `minimumReleaseAge: 1440` (cooldown de 24 h en cada paquete nuevo)
- **pnpm** con `strictDepBuilds: true` y `blockExoticSubdeps: true`
- **gitleaks** en pre-commit hook
- `pnpm audit --audit-level=high` en CI
- Headers de seguridad estrictos en `vercel.json` (CSP, HSTS, X-Frame-Options, etc.)
- Sentry configurado con `sendDefaultPii: false` y `beforeSend` que filtra contenido de cartones

Ver [docs/especificaciones.md sección 5](./docs/especificaciones.md) y [docs/threat-model.md](./docs/threat-model.md).

---

## 🚢 Cómo deployar

El deploy es **automático** vía Vercel:

- Cada push a `main` → deploy a producción
- Cada PR → preview URL único
- Rollback: botón en el dashboard de Vercel

Deploy manual (raro, solo si el automático falla):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm dlx vercel --prod
```

---

## 🤝 Cómo contribuir

Este proyecto está en desarrollo personal (autor único + Claude Code como copiloto). Pero si quieres contribuir:

1. Usar **Conventional Commits** (`feat:`, `fix:`, `docs:`, etc.). Commitlint lo valida.
2. Tests verdes obligatorios (CI lo verifica).
3. Pre-commit hooks deben pasar (no usar `--no-verify`).
4. Un commit = un cambio cohesivo.
5. Lee [CLAUDE.md](./CLAUDE.md) para entender las convenciones del proyecto.

---

## 🗺️ Roadmap

- **v1.0** — Modo presencial completo (en desarrollo, este repo)
- **v1.5** — Mejoras de UX: modo oscuro, sonidos, export a PDF
- **v2.0** — Modo virtual con Supabase: eventos remotos, magic link, pagos manuales con comprobante
- **v2.5** — Pagos automáticos con Culqi
- **v3.0** — Yape Business, multi-moderador, app nativa con React Native

Detalles en [ROADMAP.md](./ROADMAP.md).

---

## 📄 Licencia

MIT (a confirmar al cerrar v1.0).

---

## 👤 Autor

Proyecto desarrollado por un autor único usando **Claude Code** como copiloto de desarrollo. El kit de documentación inicial fue generado con la skill `project-kickstart`.

---

## 🙏 Agradecimientos

- [Tesseract.js](https://tesseract.projectnaptha.com/) — OCR client-side
- [Vite](https://vitejs.dev/) — el bundler que hace todo rápido
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS que no estorba
- [Zustand](https://github.com/pmndrs/zustand) — estado global sin boilerplate
- [Anthropic](https://www.anthropic.com/) — por Claude y Claude Code
