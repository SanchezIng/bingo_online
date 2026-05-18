import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ErrorEvent } from '@sentry/react'

const sentryInit = vi.fn()
vi.mock('@sentry/react', () => ({
  init: (config: unknown) => sentryInit(config),
}))

import { beforeSend, redactarSensibles, initSentry } from './sentry'

function evento(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    type: undefined,
    ...overrides,
  } as ErrorEvent
}

describe('redactarSensibles', () => {
  it('reescribe claves sensibles a [REDACTED]', () => {
    const data: Record<string, unknown> = {
      cartones: [1, 2, 3],
      otro: 'valor',
    }
    redactarSensibles(data)
    expect(data.cartones).toBe('[REDACTED]')
    expect(data.otro).toBe('valor')
  })

  it('redacta recursivamente dentro de objetos', () => {
    const data = { contexto: { numeros: [10, 20], nombre: 'Ana' } }
    redactarSensibles(data)
    expect(data.contexto.numeros).toBe('[REDACTED]')
    expect(data.contexto.nombre).toBe('Ana')
  })

  it('redacta dentro de arrays de objetos', () => {
    const data = { items: [{ foto: 'base64...', titulo: 't' }] }
    redactarSensibles(data)
    expect(data.items[0].foto).toBe('[REDACTED]')
    expect(data.items[0].titulo).toBe('t')
  })

  it('no falla con primitivos o null', () => {
    expect(() => redactarSensibles(null)).not.toThrow()
    expect(() => redactarSensibles(undefined)).not.toThrow()
    expect(() => redactarSensibles(42)).not.toThrow()
    expect(() => redactarSensibles('texto')).not.toThrow()
  })
})

describe('beforeSend', () => {
  it('descarta el evento si event.extra tiene clave sensible al tope', () => {
    const ev = evento({ extra: { cartones: ['a', 'b'] } })
    expect(beforeSend(ev)).toBeNull()
  })

  it('descarta el evento si event.contexts tiene clave sensible al tope', () => {
    const ev = evento({
      contexts: { foto: { url: 'x' } } as ErrorEvent['contexts'],
    })
    expect(beforeSend(ev)).toBeNull()
  })

  it('redacta (no descarta) cuando la clave aparece anidada en extra', () => {
    const ev = evento({
      extra: { sesion: { numeros: [1, 2], iniciada: '...' } },
    })
    const result = beforeSend(ev)
    expect(result).not.toBeNull()
    const sesion = (result!.extra as Record<string, Record<string, unknown>>).sesion
    expect(sesion.numeros).toBe('[REDACTED]')
    expect(sesion.iniciada).toBe('...')
  })

  it('redacta dentro de breadcrumbs.data', () => {
    const ev = evento({
      breadcrumbs: [
        {
          category: 'state',
          data: { cartones: [{ id: 'x' }] },
          message: 'guardó estado',
        },
      ],
    })
    const result = beforeSend(ev)
    expect(result).not.toBeNull()
    expect(result!.breadcrumbs![0].data!.cartones).toBe('[REDACTED]')
  })

  it('redacta menciones en breadcrumb.message', () => {
    const ev = evento({
      breadcrumbs: [{ category: 'log', message: 'estado actualizado cartones=[3,4,5] ok' }],
    })
    const result = beforeSend(ev)
    expect(result!.breadcrumbs![0].message).toBe('estado actualizado cartones=[REDACTED] ok')
  })

  it('deja pasar eventos sin datos sensibles', () => {
    const ev = evento({ extra: { user: 'anon', page: '/jugar' } })
    const result = beforeSend(ev)
    expect(result).toBe(ev)
    expect((result!.extra as Record<string, unknown>).user).toBe('anon')
  })

  it('considera todas las claves de la lista negra', () => {
    const claves = [
      'carton',
      'cartones',
      'numeros',
      'numerosSorteados',
      'ocrImage',
      'foto',
      'fotoOCR',
    ]
    for (const clave of claves) {
      const ev = evento({ extra: { [clave]: 'algo' } })
      expect(beforeSend(ev), `clave: ${clave}`).toBeNull()
    }
  })
})

describe('initSentry', () => {
  beforeEach(() => {
    sentryInit.mockClear()
    vi.unstubAllEnvs()
  })

  it('no inicializa si no hay DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    vi.stubEnv('VITE_APP_ENV', 'production')
    expect(initSentry()).toBe(false)
    expect(sentryInit).not.toHaveBeenCalled()
  })

  it('no inicializa en development aunque haya DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://abc@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', 'development')
    expect(initSentry()).toBe(false)
    expect(sentryInit).not.toHaveBeenCalled()
  })

  it('inicializa con la config esperada en production', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://abc@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', 'production')
    expect(initSentry()).toBe(true)
    expect(sentryInit).toHaveBeenCalledTimes(1)
    const config = sentryInit.mock.calls[0][0]
    expect(config.dsn).toBe('https://abc@o0.ingest.sentry.io/0')
    expect(config.environment).toBe('production')
    expect(config.sendDefaultPii).toBe(false)
    expect(config.tracesSampleRate).toBe(0.1)
    expect(typeof config.beforeSend).toBe('function')
  })

  it('inicializa en preview', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://abc@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', 'preview')
    expect(initSentry()).toBe(true)
    expect(sentryInit.mock.calls[0][0].environment).toBe('preview')
  })
})
