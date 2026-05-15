import { describe, it, expect } from 'vitest'
import type { Patron } from './index'
import { evaluarCondicion } from './index'

// Helpers para construir sets de casillas marcadas
const soloFree = (): Set<string> => new Set(['2,2'])

const conCasillas = (...coords: string[]): Set<string> => new Set(['2,2', ...coords])

const todasMarcadas = (): Set<string> => {
  const s = new Set<string>()
  for (let f = 0; f < 5; f++) for (let c = 0; c < 5; c++) s.add(`${f},${c}`)
  return s
}

// Patrón "fila superior" (5 casillas en fila 0)
const patronFilaSuperior: Patron = {
  id: 'a3f5c8b2-1d4e-4f7a-9b3c-2e5d8f1a6b9d',
  nombre: 'Fila Superior',
  grilla: [
    [true, true, true, true, true],
    [false, false, false, false, false],
    [false, false, true, false, false], // FREE, pero no es parte del patrón
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
  creadoEn: '2026-01-01T00:00:00.000Z',
}

// Patrón "X" — incluye el FREE en centro y las 4 diagonales
const patronX: Patron = {
  id: 'b8e2f1a5-3c6d-4e9f-8a2b-5d7c9e1f3a4b',
  nombre: 'X',
  grilla: [
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, false, true, false, false],
    [false, true, false, true, false],
    [true, false, false, false, true],
  ],
  creadoEn: '2026-01-01T00:00:00.000Z',
}

describe('evaluarCondicion — tipo n_marcados', () => {
  it('con solo FREE marcada y condicion.valor=5: faltan=4, no ganado', () => {
    const resultado = evaluarCondicion(soloFree(), { tipo: 'n_marcados', valor: 5 })
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(4)
  })

  it('cuando marcadas === valor: ganado=true, faltan=0', () => {
    const marcadas = conCasillas('0,0', '1,0', '3,0', '4,0') // 4 + FREE = 5
    const resultado = evaluarCondicion(marcadas, { tipo: 'n_marcados', valor: 5 })
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })

  it('cuando marcadas > valor: ganado=true, faltan=0 (no negativo)', () => {
    const marcadas = conCasillas('0,0', '1,0', '3,0', '4,0', '0,1') // 6 marcadas
    const resultado = evaluarCondicion(marcadas, { tipo: 'n_marcados', valor: 3 })
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })

  it('con condicion.valor=1 y solo FREE: ganado=true (FREE cuenta)', () => {
    const resultado = evaluarCondicion(soloFree(), { tipo: 'n_marcados', valor: 1 })
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })

  it('con lista vacía de patrones (omitida): no afecta n_marcados', () => {
    const resultado = evaluarCondicion(soloFree(), { tipo: 'n_marcados', valor: 2 })
    expect(resultado.faltan).toBe(1)
  })
})

describe('evaluarCondicion — tipo patron', () => {
  it('ninguna casilla del patrón marcada (excepto FREE que no está en el patrón): faltan = total del patrón', () => {
    // patronFilaSuperior tiene 5 casillas en fila 0; FREE no está
    const resultado = evaluarCondicion(
      soloFree(),
      { tipo: 'patron', patronId: patronFilaSuperior.id },
      [patronFilaSuperior],
    )
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(5)
  })

  it('algunas casillas del patrón marcadas', () => {
    // marcamos 3 de los 5 de fila superior: (0,0), (0,1), (0,2)
    const marcadas = conCasillas('0,0', '0,1', '0,2')
    const resultado = evaluarCondicion(
      marcadas,
      { tipo: 'patron', patronId: patronFilaSuperior.id },
      [patronFilaSuperior],
    )
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(2)
  })

  it('todas las casillas del patrón marcadas: ganado=true, faltan=0', () => {
    const marcadas = conCasillas('0,0', '0,1', '0,2', '0,3', '0,4')
    const resultado = evaluarCondicion(
      marcadas,
      { tipo: 'patron', patronId: patronFilaSuperior.id },
      [patronFilaSuperior],
    )
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })

  it('patrón X: FREE ya en marcadas cuenta como casilla del patrón', () => {
    // patronX tiene 9 casillas (4 esquinas + 4 posiciones diagonales interiores + centro)
    // con solo FREE marcada (centro = 2,2): faltan = 8
    const resultado = evaluarCondicion(soloFree(), { tipo: 'patron', patronId: patronX.id }, [
      patronX,
    ])
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(8)
  })

  it('patrón X completo marcado: ganado=true', () => {
    const marcadas = new Set(['0,0', '0,4', '1,1', '1,3', '2,2', '3,1', '3,3', '4,0', '4,4'])
    const resultado = evaluarCondicion(marcadas, { tipo: 'patron', patronId: patronX.id }, [
      patronX,
    ])
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })

  it('patrón no encontrado: ganado=false, faltan=Infinity', () => {
    const resultado = evaluarCondicion(
      soloFree(),
      { tipo: 'patron', patronId: 'c1d2e3f4-5678-4abc-9def-012345678901' },
      [patronFilaSuperior],
    )
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(Infinity)
  })

  it('sin array de patrones (undefined): ganado=false, faltan=Infinity', () => {
    const resultado = evaluarCondicion(soloFree(), {
      tipo: 'patron',
      patronId: patronFilaSuperior.id,
    })
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(Infinity)
  })

  it('array de patrones vacío: ganado=false, faltan=Infinity', () => {
    const resultado = evaluarCondicion(
      soloFree(),
      { tipo: 'patron', patronId: patronFilaSuperior.id },
      [],
    )
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(Infinity)
  })
})

describe('evaluarCondicion — tipo cartonLleno', () => {
  it('con solo FREE marcada: faltan=24', () => {
    const resultado = evaluarCondicion(soloFree(), { tipo: 'cartonLleno' })
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(24)
  })

  it('con 10 casillas marcadas (incluyendo FREE): faltan=15', () => {
    const marcadas = conCasillas('0,0', '0,1', '0,2', '0,3', '0,4', '1,0', '1,1', '1,2', '1,3')
    expect(marcadas.size).toBe(10)
    const resultado = evaluarCondicion(marcadas, { tipo: 'cartonLleno' })
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(15)
  })

  it('con 24 casillas marcadas: faltan=1', () => {
    const todas = todasMarcadas()
    todas.delete('4,4')
    expect(todas.size).toBe(24)
    const resultado = evaluarCondicion(todas, { tipo: 'cartonLleno' })
    expect(resultado.ganado).toBe(false)
    expect(resultado.faltan).toBe(1)
  })

  it('con las 25 casillas marcadas: ganado=true, faltan=0', () => {
    const resultado = evaluarCondicion(todasMarcadas(), { tipo: 'cartonLleno' })
    expect(resultado.ganado).toBe(true)
    expect(resultado.faltan).toBe(0)
  })
})
