import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leerCartones, guardarCartones, exportarTodo, importarTodo } from './index'
import type { Carton } from '@/core/cartones'

const cartonEjemplo: Carton = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  serie: 'A',
  numeros: {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 33, 34],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

describe('leerCartones', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna array vacío cuando no hay datos', () => {
    expect(leerCartones()).toEqual([])
  })

  it('retorna array vacío cuando la clave no existe', () => {
    localStorage.removeItem('bingo:cartones')
    expect(leerCartones()).toEqual([])
  })

  it('lee cartones guardados correctamente', () => {
    localStorage.setItem('bingo:cartones', JSON.stringify([cartonEjemplo]))
    const result = leerCartones()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('ignora cartones inválidos y retorna los válidos', () => {
    const invalido = { id: 'x', numeros: { B: [999, 999, 999, 999, 999] } }
    localStorage.setItem('bingo:cartones', JSON.stringify([cartonEjemplo, invalido]))
    const result = leerCartones()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('retorna array vacío cuando el JSON es corrupto', () => {
    localStorage.setItem('bingo:cartones', '{corrupto!!!}')
    expect(leerCartones()).toEqual([])
  })

  it('retorna array vacío cuando el JSON no es un array', () => {
    localStorage.setItem('bingo:cartones', JSON.stringify({ foo: 'bar' }))
    expect(leerCartones()).toEqual([])
  })
})

describe('guardarCartones', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('guarda cartones y los puede leer de vuelta', () => {
    const result = guardarCartones([cartonEjemplo])
    expect(result.ok).toBe(true)
    const leidos = leerCartones()
    expect(leidos).toHaveLength(1)
    expect(leidos[0].id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('guarda lista vacía sin error', () => {
    const result = guardarCartones([])
    expect(result.ok).toBe(true)
    expect(leerCartones()).toEqual([])
  })

  it('retorna error cuando localStorage lanza QuotaExceededError', () => {
    const error = new DOMException('QuotaExceededError', 'QuotaExceededError')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw error
    })
    const result = guardarCartones([cartonEjemplo])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('lleno')
    }
  })

  it('retorna error genérico cuando localStorage lanza otro error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('acceso denegado')
    })
    const result = guardarCartones([cartonEjemplo])
    expect(result.ok).toBe(false)
  })
})

describe('exportarTodo / importarTodo', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exportar e importar hace roundtrip correcto', () => {
    guardarCartones([cartonEjemplo])
    const json = exportarTodo()
    localStorage.clear()

    const result = importarTodo(json)
    expect(result.ok).toBe(true)
    const cartones = leerCartones()
    expect(cartones).toHaveLength(1)
    expect(cartones[0].id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('retorna error cuando el JSON de importación es inválido', () => {
    const result = importarTodo('{corrupto!!!}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toBeTruthy()
    }
  })

  it('importarTodo ignora cartones inválidos dentro del JSON', () => {
    const jsonConInvalido = JSON.stringify({
      version: '1.0',
      cartones: [cartonEjemplo, { id: 'x' }],
      patrones: [],
    })
    const result = importarTodo(jsonConInvalido)
    expect(result.ok).toBe(true)
    expect(leerCartones()).toHaveLength(1)
  })
})
