import { describe, it, expect } from 'vitest'
import type { Carton } from '@/core/cartones/types'
import type { Patron } from './index'
import { calcularRanking } from './index'

// Cartones con números en rangos válidos de bingo
// Cartón A: números bajos del rango estándar
const cartonA: Carton = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  serie: 'A',
  numeros: {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 34, 35],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

// Cartón B: números del extremo superior
const cartonB: Carton = {
  id: 'a3f5c8b2-1d4e-4f7a-9b3c-2e5d8f1a6b9d',
  serie: 'B',
  numeros: {
    B: [6, 7, 8, 9, 10],
    I: [21, 22, 23, 24, 25],
    N: [36, 37, 'FREE', 39, 40],
    G: [51, 52, 53, 54, 55],
    O: [66, 67, 68, 69, 70],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

// Cartón C
const cartonC: Carton = {
  id: 'b8e2f1a5-3c6d-4e9f-8a2b-5d7c9e1f3a4b',
  serie: 'C',
  numeros: {
    B: [11, 12, 13, 14, 15],
    I: [26, 27, 28, 29, 30],
    N: [41, 42, 'FREE', 44, 45],
    G: [56, 57, 58, 59, 60],
    O: [71, 72, 73, 74, 75],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

// Cartón D — mismo rango que A para probar empates
const cartonD: Carton = {
  id: 'c1d2e3f4-5678-4abc-9def-0e2345678901',
  serie: 'D',
  numeros: {
    B: [1, 2, 3, 4, 5], // comparte con A
    I: [21, 22, 23, 24, 25],
    N: [31, 32, 'FREE', 34, 35],
    G: [56, 57, 58, 59, 60],
    O: [71, 72, 73, 74, 75],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

const sinPatrones: Patron[] = []

describe('calcularRanking', () => {
  it('con lista de cartones vacía retorna []', () => {
    const resultado = calcularRanking([], [], { tipo: 'cartonLleno' }, sinPatrones)
    expect(resultado).toEqual([])
  })

  it('retorna una entrada por cartón', () => {
    const resultado = calcularRanking(
      [cartonA, cartonB, cartonC],
      [],
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado).toHaveLength(3)
  })

  it('cada entrada tiene cartonId, faltan y ganado', () => {
    const resultado = calcularRanking([cartonA], [], { tipo: 'cartonLleno' }, sinPatrones)
    expect(resultado[0]).toMatchObject({ cartonId: cartonA.id, ganado: false })
    expect(typeof resultado[0].faltan).toBe('number')
  })

  it('con condición cartonLleno y 0 sorteados: todos tienen faltan=24', () => {
    const resultado = calcularRanking(
      [cartonA, cartonB, cartonC],
      [],
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado.every((e) => e.faltan === 24)).toBe(true)
  })

  it('cartón con más números sorteados tiene menor faltan y aparece primero', () => {
    // A tiene B[0-4]=1-5, sorteamos 1,2,3,4,5 → 5 extra + FREE = 6 marcadas → faltan=19
    // B no tiene ninguno de esos → faltan=24
    const resultado = calcularRanking(
      [cartonB, cartonA],
      [1, 2, 3, 4, 5],
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado[0].cartonId).toBe(cartonA.id)
    expect(resultado[0].faltan).toBeLessThan(resultado[1].faltan)
  })

  it('cartón ganador aparece primero aunque haya otro con faltan=0', () => {
    // Sorteamos todos los números del cartón A → ganado=true
    const todosA = [
      1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 34, 35, 46, 47, 48, 49, 50, 61, 62, 63, 64, 65,
    ]
    const resultado = calcularRanking(
      [cartonB, cartonC, cartonA],
      todosA,
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado[0].cartonId).toBe(cartonA.id)
    expect(resultado[0].ganado).toBe(true)
  })

  it('los ganadores van primero, los demás ordenados por faltan asc', () => {
    const todosA = [
      1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 34, 35, 46, 47, 48, 49, 50, 61, 62, 63, 64, 65,
    ]
    // A gana; B tiene 0 sorteados (faltan=24); C tiene 0 sorteados (faltan=24)
    const resultado = calcularRanking(
      [cartonB, cartonC, cartonA],
      todosA,
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado[0].ganado).toBe(true)
    expect(resultado.slice(1).every((e) => !e.ganado)).toBe(true)
  })

  it('con condición n_marcados: ordena por faltan asc', () => {
    // Sorteamos solo 1 y 2 (ambos en A): A tiene FREE+1+2=3 marcadas, B tiene solo FREE=1
    const resultado = calcularRanking(
      [cartonB, cartonA],
      [1, 2],
      { tipo: 'n_marcados', valor: 5 },
      sinPatrones,
    )
    // A: 3 marcadas → faltan=2; B: 1 marcada → faltan=4
    expect(resultado[0].cartonId).toBe(cartonA.id)
    expect(resultado[0].faltan).toBe(2)
    expect(resultado[1].faltan).toBe(4)
  })

  it('con empate en faltan, el orden es estable (preserva el orden original)', () => {
    // Ninguno sorteado: todos faltan=24
    const resultado = calcularRanking(
      [cartonA, cartonB, cartonC],
      [],
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    // Al ser todos iguales, el orden original debe mantenerse
    expect(resultado[0].cartonId).toBe(cartonA.id)
    expect(resultado[1].cartonId).toBe(cartonB.id)
    expect(resultado[2].cartonId).toBe(cartonC.id)
  })

  it('dos cartones ganadores: se ordenan entre sí por faltan (cubre rama a.ganado=true vs b.ganado=true)', () => {
    // Con n_marcados=1 y FREE siempre marcada, TODOS los cartones ganan
    // A y B ganan con faltan=0; el ranking los ordena por faltan (0,0) → orden original estable
    const resultado = calcularRanking(
      [cartonA, cartonB],
      [],
      { tipo: 'n_marcados', valor: 1 },
      sinPatrones,
    )
    expect(resultado[0].ganado).toBe(true)
    expect(resultado[1].ganado).toBe(true)
    expect(resultado[0].cartonId).toBe(cartonA.id)
    expect(resultado[1].cartonId).toBe(cartonB.id)
  })

  it('cinco cartones, verificar orden completo por faltan', () => {
    // sorteados: 1 (en A y D), 6 (en B), 7 (en B), 21 (en B y D)
    // A: tiene 1 → 1 match + FREE = 2 marcadas → faltan=23
    // B: tiene 6,7,21 → 3 matches + FREE = 4 marcadas → faltan=21
    // C: ninguno → 0 matches + FREE = 1 marcada → faltan=24
    // D: tiene 1,21 → 2 matches + FREE = 3 marcadas → faltan=22
    const sorteados = [1, 6, 7, 21]
    const resultado = calcularRanking(
      [cartonA, cartonB, cartonC, cartonD],
      sorteados,
      { tipo: 'cartonLleno' },
      sinPatrones,
    )
    expect(resultado[0].faltan).toBe(21) // B gana
    expect(resultado[resultado.length - 1].faltan).toBe(24) // C es último
  })
})
