# ADR-0002: pnpm 11+ con configuración endurecida en vez de npm

**Fecha:** 2026-05-14
**Estado:** Aceptado

---

## Contexto

Al decidir el gestor de paquetes para Bingo Digital, el autor preguntó explícitamente: **"¿npm fue vulnerado? ¿debería usar pnpm?"**

La pregunta surge en un momento crítico para el ecosistema JavaScript. Durante 2025 y 2026, npm sufrió múltiples ataques masivos de cadena de suministro (supply chain attacks) que comprometieron paquetes ampliamente usados.

### Ataques relevantes investigados

- **Shai-Hulud (septiembre 2025):** más de 500 paquetes de npm comprometidos. El malware se autopropagaba modificando el código de paquetes que el desarrollador publicaba, robando tokens de npm y secretos del entorno.
- **Shai-Hulud 2.0 (noviembre 2025):** 796 paquetes afectados con un volumen acumulado de ~132 millones de descargas mensuales. Esta variante incluía persistencia más sofisticada y exfiltración a servidores controlados.
- **Mini Shai-Hulud (mayo 2026):** versión más reciente que se extendió también a PyPI, demostrando que el patrón se está replicando entre ecosistemas.
- **PackageGate (enero 2026):** un investigador reportó a npm un vector de abuso significativo; npm cerró el reporte como *"works as expected"*, sin desplegar mitigaciones. Esto fue percibido como un fallo de respuesta del registro oficial.

El patrón común de estos ataques: **una versión nueva de un paquete comprometido se publica al registro y los desarrolladores que usan `npm install` (sin lockfile o con `npm update`) descargan automáticamente el código malicioso minutos u horas después de la publicación**, antes de que la comunidad detecte el problema.

### Mitigación clave: cooldown de publicación

La defensa más efectiva contra estos ataques zero-day es **no instalar versiones recién publicadas**. Si un paquete malicioso se publica a las 10:00, la comunidad de seguridad típicamente lo detecta entre 30 minutos y 12 horas después. Esperar 24 horas antes de aceptar cualquier versión nueva reduce drásticamente la ventana de exposición.

- **pnpm** soporta esto nativamente desde v9 mediante la opción `minimumReleaseAge` (en `pnpm-workspace.yaml`).
- **npm** no tiene esta opción built-in. Se puede aproximar con scripts personalizados o herramientas externas (como `socket.dev`), pero requiere setup adicional y no está en el camino feliz.
- **yarn** (Classic ni Berry) tampoco la tiene built-in.

### Configuración endurecida adicional disponible en pnpm

- `strictDepBuilds: true` — bloquea ejecución de scripts `postinstall` salvo allowlist explícita. Mitiga ataques que dependen de ejecutar código durante la instalación.
- `blockExoticSubdeps: true` — bloquea sub-dependencias instaladas desde URLs no estándar (git, tarballs externos), un vector común de inyección.
- `allowBuilds` — lista explícita de paquetes que SÍ pueden ejecutar scripts de build (esbuild, swc, etc.). Todo lo demás se bloquea.

---

## Decisión

**Adoptar pnpm 11+ con la siguiente configuración endurecida en `pnpm-workspace.yaml`:**

```yaml
minimumReleaseAge: 1440      # 24 horas en minutos
blockExoticSubdeps: true
strictDepBuilds: true
allowBuilds:
  - esbuild
  - "@swc/core"
  # Añadir aquí cualquier otra dep que legítimamente necesite scripts de build.
  # Cada adición DEBE ser justificada en el PR que la introduce.
```

Adicionalmente:

- **Requerir Node 22 LTS** (pnpm 11 lo necesita).
- **Comitear `pnpm-lock.yaml`** al repo.
- **CI usa `pnpm install --frozen-lockfile`** sin excepciones. Nunca `pnpm install` a secas en CI.
- **Prohibir `npm` y `yarn` en el repo.** Si aparece `package-lock.json` o `yarn.lock`, es un error: borrarlos.
- **gitleaks en pre-commit** como capa complementaria (no relacionada con cooldown, pero contra accidentes de credenciales).
- **`pnpm audit --audit-level=high`** en CI para detectar vulnerabilidades conocidas en deps existentes.
- **Dependabot configurado con cooldown adicional** de 7 días para minor/patch (refuerzo del cooldown nativo de pnpm).

---

## Alternativas consideradas

### Opción A: npm con configuración por defecto

- ✅ Pros: ecosistema más conocido por el autor; viene con Node.
- ❌ Contras: sin cooldown nativo; sin strictDepBuilds; expuesto a ataques zero-day; el incidente PackageGate sugiere que el registro oficial no está priorizando estas mitigaciones.

### Opción B: npm con scripts personalizados o socket.dev

- ✅ Pros: aprovecha herramientas existentes.
- ❌ Contras: el cooldown se aproxima con herramientas externas (mayor superficie); el autor está aprendiendo y no debe gastar energía en mantener esa fontanería.

### Opción C: yarn Berry (v4+)

- ✅ Pros: tiene su propio sistema de hardening (PnP, zero-installs, checksums estrictos).
- ❌ Contras: PnP puede causar fricción con herramientas que asumen `node_modules/` (Vite, Vitest, ESLint en algunos casos); curva de aprendizaje adicional para el autor que ya tiene mucho en su plato; comunidad y ecosistema más pequeños que pnpm.

### Opción D (elegida): pnpm 11+ con configuración endurecida

- ✅ Pros:
  - `minimumReleaseAge` built-in elimina la ventana de zero-day más obvia
  - `strictDepBuilds` + `blockExoticSubdeps` añaden defensa en profundidad
  - Mantiene compatibilidad total con `node_modules/` (Vite/Vitest funcionan sin trucos)
  - Más rápido que npm en instalación e instalación más eficiente en disco (hard links)
  - Comunidad activa y respuesta rápida a CVEs
  - Documentación clara de la configuración de seguridad

- ❌ Contras:
  - Curva pequeña: el autor debe aprender a usar `pnpm` en vez de `npm`. Mitigación: los comandos son casi idénticos (`pnpm add`, `pnpm install`, etc.) y se documenta en CLAUDE.md.
  - Algunas instrucciones de instalación de librerías asumen npm. Mitigación: traducir `npm install X` → `pnpm add X` es trivial.

---

## Consecuencias

### Positivas

- Ventana de exposición a ataques zero-day en npm se reduce de "minutos" a "24+ horas", durante las cuales la comunidad de seguridad típicamente identifica y reporta el problema.
- Los scripts maliciosos en `postinstall` quedan bloqueados por default.
- El lockfile + `--frozen-lockfile` en CI garantiza que producción usa exactamente los paquetes verificados localmente.
- Instalación más rápida y consumo de disco menor (pnpm usa hard links a un store global).

### Negativas

- Si una librería legítima publica una versión y el autor la necesita inmediatamente (ej: fix urgente de seguridad), tendrá que esperar 24 h o bajar `minimumReleaseAge` puntualmente. Mitigación: la opción se puede sobrescribir vía variable de entorno `PNPM_MINIMUM_RELEASE_AGE=0` por una invocación, **siempre documentando el motivo en el commit**.
- Cada nueva dependencia que requiera scripts de build (caso raro) hay que añadirla a `allowBuilds`. Es una fricción pequeña pero deliberada — fuerza a pensar antes de añadir deps con scripts.
- El autor debe instalar pnpm globalmente (no viene con Node). Mitigación: `npm install -g pnpm@latest` o vía corepack (incluido en Node 22).

### Riesgos

- **Riesgo: la configuración no se respeta en local.** Si el autor usa `npm install` por costumbre, la protección se pierde. Mitigación: añadir un script de prepare que falle si no se está usando pnpm; documentar prominentemente en CLAUDE.md y README.
- **Riesgo: pnpm tiene su propio bug crítico en el futuro.** Mitigación: la configuración endurecida no depende del comportamiento "interno" de pnpm; son features estables documentadas. Si pnpm tuviera un fallo, se evaluaría migrar — pero esto aplica a cualquier herramienta.

---

## Auditoría manual antes de añadir cualquier dependencia nueva

Como parte de la disciplina, antes de hacer `pnpm add X` se verifica:

1. ¿Está activamente mantenida? (último commit < 12 meses)
2. ¿Cuántas descargas semanales tiene? (proxy de uso real)
3. ¿Cuántos contribuidores únicos? (proxy de bus factor)
4. ¿Tiene vulnerabilidades conocidas en GitHub Advisory o `pnpm audit`?
5. ¿Cuántas sub-dependencias arrastra? (cada una es superficie nueva)
6. ¿Existe una alternativa más ligera o algo en la stdlib que ya cubra el caso?

Este checklist se incluye en la **Definition of Done** de cualquier subfase que añada dependencias (ver `docs/guia_desarrollo.md`).

---

## Referencias

- pnpm — opciones de seguridad: https://pnpm.io/settings
- `minimumReleaseAge`: https://pnpm.io/settings#minimumreleaseage
- OWASP — Software Supply Chain Security: https://owasp.org/www-project-software-component-verification-standard/
- `docs/especificaciones.md` sección 5.1 A06
- `CLAUDE.md` sección "Dependencias"
