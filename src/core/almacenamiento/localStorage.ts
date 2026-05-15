import type { Carton, Result } from '@/core/cartones'
import { validarCartonCompleto } from '@/core/cartones'

const KEYS = {
  cartones: 'bingo:cartones',
  patrones: 'bingo:patrones',
  sesion: 'bingo:sesion',
} as const

function escribir<T>(clave: string, valor: T): Result<void, string> {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return { ok: true, value: undefined }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, errors: 'Almacenamiento lleno. Elimina cartones para continuar.' }
    }
    return {
      ok: false,
      errors: 'No se pudo guardar. Verifica que el almacenamiento esté disponible.',
    }
  }
}

export function leerCartones(): Carton[] {
  try {
    const raw = localStorage.getItem(KEYS.cartones)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const cartones: Carton[] = []
    for (const item of parsed) {
      const result = validarCartonCompleto(item)
      if (result.ok) {
        cartones.push(result.value)
      } else {
        console.warn('[almacenamiento] cartón inválido ignorado', result.errors)
      }
    }
    return cartones
  } catch {
    console.warn('[almacenamiento] error al leer cartones, retornando lista vacía')
    return []
  }
}

export function guardarCartones(cartones: Carton[]): Result<void, string> {
  return escribir(KEYS.cartones, cartones)
}

// Patrones: tipo provisional hasta F3.1 cuando se defina Patron
export function leerPatrones(): unknown[] {
  try {
    const raw = localStorage.getItem(KEYS.patrones)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function guardarPatrones(patrones: unknown[]): Result<void, string> {
  return escribir(KEYS.patrones, patrones)
}

// Sesion: tipo provisional hasta F3.3 cuando se defina el store de sesión
export function leerSesion(): unknown | null {
  try {
    const raw = localStorage.getItem(KEYS.sesion)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function guardarSesion(sesion: unknown): Result<void, string> {
  return escribir(KEYS.sesion, sesion)
}

export function exportarTodo(): string {
  return JSON.stringify({
    version: '1.0',
    cartones: leerCartones(),
    patrones: leerPatrones(),
    sesion: leerSesion(),
    exportadoEn: new Date().toISOString(),
  })
}

export function importarTodo(json: string): Result<void, string> {
  try {
    const datos = JSON.parse(json) as Record<string, unknown>
    if (Array.isArray(datos.cartones)) {
      const result = guardarCartones(
        (datos.cartones as unknown[]).flatMap((item) => {
          const r = validarCartonCompleto(item)
          return r.ok ? [r.value] : []
        }),
      )
      if (!result.ok) return result
    }
    if (Array.isArray(datos.patrones)) {
      const result = guardarPatrones(datos.patrones)
      if (!result.ok) return result
    }
    return { ok: true, value: undefined }
  } catch {
    return { ok: false, errors: 'El archivo de importación no es válido.' }
  }
}
