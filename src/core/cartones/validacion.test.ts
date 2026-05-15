import { describe, it, expect } from 'vitest'
import { validarNumerosCarton, validarCartonCompleto } from './index'
import type { NumerosCarton } from './index'

const cartonValido: NumerosCarton = {
  B: [1, 5, 10, 12, 15],
  I: [16, 20, 25, 28, 30],
  N: [31, 35, 'FREE', 40, 45],
  G: [46, 50, 55, 58, 60],
  O: [61, 65, 70, 72, 75],
}

describe('validarNumerosCarton', () => {
  it('acepta un cartón válido', () => {
    const resultado = validarNumerosCarton(cartonValido)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.value.N[2]).toBe('FREE')
    }
  })

  it('rechaza número B fuera de rango (0)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, B: [0, 5, 10, 12, 15] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número B fuera de rango (16)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, B: [16, 5, 10, 12, 15] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número I fuera de rango (15)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, I: [15, 20, 25, 28, 30] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número I fuera de rango (31)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, I: [31, 20, 25, 28, 30] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número N fuera de rango (30)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, N: [30, 35, 'FREE', 40, 45] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número N fuera de rango (46)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, N: [31, 35, 'FREE', 46, 45] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número G fuera de rango (45)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, G: [45, 50, 55, 58, 60] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número G fuera de rango (61)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, G: [61, 50, 55, 58, 60] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número O fuera de rango (60)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, O: [60, 65, 70, 72, 75] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza número O fuera de rango (76)', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, O: [76, 65, 70, 72, 75] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza centro N que no sea FREE', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, N: [31, 35, 38, 40, 45] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza duplicados dentro de la misma columna B', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, B: [5, 5, 10, 12, 15] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza duplicados entre columnas distintas', () => {
    const resultado = validarNumerosCarton({
      ...cartonValido,
      B: [1, 5, 10, 12, 15],
      I: [1, 20, 25, 28, 30],
    })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza input que no es un objeto', () => {
    expect(validarNumerosCarton(null).ok).toBe(false)
    expect(validarNumerosCarton(undefined).ok).toBe(false)
    expect(validarNumerosCarton('texto').ok).toBe(false)
    expect(validarNumerosCarton(42).ok).toBe(false)
  })

  it('rechaza columna con longitud incorrecta', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, B: [1, 5, 10, 12] })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza cuando falta una columna', () => {
    const sinB = { I: cartonValido.I, N: cartonValido.N, G: cartonValido.G, O: cartonValido.O }
    const resultado = validarNumerosCarton(sinB)
    expect(resultado.ok).toBe(false)
  })

  it('rechaza números decimales', () => {
    const resultado = validarNumerosCarton({ ...cartonValido, B: [1.5, 5, 10, 12, 15] })
    expect(resultado.ok).toBe(false)
  })

  it('retorna errores como array de strings cuando falla', () => {
    const resultado = validarNumerosCarton(null)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(Array.isArray(resultado.errors)).toBe(true)
      expect(resultado.errors.length).toBeGreaterThan(0)
    }
  })
})

describe('validarCartonCompleto', () => {
  const cartonCompletoValido = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    serie: 'A1',
    numeros: cartonValido,
    creadoEn: '2026-05-14T12:00:00.000Z',
    fuente: 'manual' as const,
  }

  it('acepta un cartón completo válido', () => {
    const resultado = validarCartonCompleto(cartonCompletoValido)
    expect(resultado.ok).toBe(true)
  })

  it('rechaza id que no es UUID', () => {
    const resultado = validarCartonCompleto({ ...cartonCompletoValido, id: 'no-uuid' })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza creadoEn con formato incorrecto', () => {
    const resultado = validarCartonCompleto({ ...cartonCompletoValido, creadoEn: '14-05-2026' })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza fuente inválida', () => {
    const resultado = validarCartonCompleto({ ...cartonCompletoValido, fuente: 'otro' })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza duplicados incluso si el resto del cartón es válido', () => {
    const resultado = validarCartonCompleto({
      ...cartonCompletoValido,
      numeros: { ...cartonValido, B: [5, 5, 10, 12, 15] },
    })
    expect(resultado.ok).toBe(false)
  })

  it('acepta todas las fuentes válidas', () => {
    const fuentes = ['manual', 'ocr', 'aleatorio', 'importado'] as const
    for (const fuente of fuentes) {
      const resultado = validarCartonCompleto({ ...cartonCompletoValido, fuente })
      expect(resultado.ok).toBe(true)
    }
  })
})
