import * as Sentry from '@sentry/react'
import type { ErrorEvent } from '@sentry/react'

// Claves cuyo contenido refleja datos privados del usuario (cartones, fotos,
// historial de sorteados). NUNCA deben salir del dispositivo.
export const CLAVES_SENSIBLES = [
  'carton',
  'cartones',
  'numeros',
  'numerosSorteados',
  'ocrImage',
  'foto',
  'fotoOCR',
] as const

const CLAVES_SET = new Set<string>(CLAVES_SENSIBLES)
const REDACTED = '[REDACTED]'

// True si el objeto plano tiene alguna clave sensible como propiedad directa.
function tieneClaveSensibleAlTope(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  return Object.keys(obj as Record<string, unknown>).some((k) => CLAVES_SET.has(k))
}

// Reescribe in-place cualquier clave sensible a REDACTED, recursivamente.
export function redactarSensibles(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    for (const item of obj) redactarSensibles(item)
    return
  }
  const target = obj as Record<string, unknown>
  for (const key of Object.keys(target)) {
    if (CLAVES_SET.has(key)) {
      target[key] = REDACTED
    } else {
      redactarSensibles(target[key])
    }
  }
}

// Redacta menciones tipo `cartones=[...]` o `numeros: 42` dentro de un string
// de breadcrumb message. No es defensa perfecta, pero evita filtraciones
// obvias en logs informales.
function redactarMensajeBreadcrumb(mensaje: string): string {
  let out = mensaje
  for (const clave of CLAVES_SENSIBLES) {
    const re = new RegExp(`(${clave})\\s*[:=]\\s*\\S+`, 'gi')
    out = out.replace(re, `$1=${REDACTED}`)
  }
  return out
}

// beforeSend de Sentry: descarta o redacta antes de enviar.
//   - Si una clave sensible aparece como propiedad TOP-LEVEL de
//     event.extra o event.contexts → descarta el evento entero.
//     (Aparición top-level ≈ uso explícito, mejor no enviar nada.)
//   - Si aparece anidada (breadcrumbs.data, dentro de un objeto) → redacta
//     a "[REDACTED]" para conservar el stack trace del error.
export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  if (tieneClaveSensibleAlTope(event.extra) || tieneClaveSensibleAlTope(event.contexts)) {
    return null
  }
  redactarSensibles(event.extra)
  redactarSensibles(event.contexts)
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      redactarSensibles(bc.data)
      if (typeof bc.message === 'string') {
        bc.message = redactarMensajeBreadcrumb(bc.message)
      }
    }
  }
  return event
}

// Inicializa Sentry. Retorna true si se activó.
//   - Solo se activa con VITE_SENTRY_DSN definido y VITE_APP_ENV !== 'development'.
//   - En dev local sin DSN → no-op silencioso (evita ruido en consola).
export function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const env = import.meta.env.VITE_APP_ENV
  if (!dsn || env === 'development') return false
  Sentry.init({
    dsn,
    environment: env || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend,
  })
  return true
}
