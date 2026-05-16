import { describe, it, expect } from 'vitest'
import { consolidarCandidatos } from './post-process'
import type { CeldaDetectada, GrillaDetectada } from './types'

function celda(
  fila: number,
  columna: number,
  candidatos: CeldaDetectada['candidatos'] = [],
): CeldaDetectada {
  return { fila, columna, candidatos }
}

function grillaVacia(): GrillaDetectada {
  const celdas: CeldaDetectada[] = []
  for (let fila = 0; fila < 5; fila++) {
    for (let columna = 0; columna < 5; columna++) {
      if (fila === 2 && columna === 2) continue
      celdas.push(celda(fila, columna))
    }
  }
  return { celdas }
}

describe('consolidarCandidatos', () => {
  it('retorna null en cada casilla cuando no hay candidatos', () => {
    const resultado = consolidarCandidatos(grillaVacia())
    expect(resultado.B[0]).toBeNull()
    expect(resultado.O[4]).toBeNull()
  })

  it('la columna N siempre tiene "FREE" en fila 2', () => {
    expect(consolidarCandidatos(grillaVacia()).N[2]).toBe('FREE')
  })

  it('retorna el número cuando hay un único candidato', () => {
    const g = grillaVacia()
    g.celdas
      .find((c) => c.fila === 0 && c.columna === 0)!
      .candidatos.push({
        numero: 5,
        confianza: 'alta',
      })
    expect(consolidarCandidatos(g).B[0]).toBe(5)
  })

  it('selecciona el candidato de mayor confianza cuando hay varios', () => {
    const g = grillaVacia()
    const c = g.celdas.find((c) => c.fila === 0 && c.columna === 0)!
    c.candidatos.push({ numero: 5, confianza: 'baja' })
    c.candidatos.push({ numero: 8, confianza: 'alta' })
    expect(consolidarCandidatos(g).B[0]).toBe(8)
  })

  it('"media" gana sobre "baja"', () => {
    const g = grillaVacia()
    const c = g.celdas.find((c) => c.fila === 0 && c.columna === 0)!
    c.candidatos.push({ numero: 3, confianza: 'media' })
    c.candidatos.push({ numero: 9, confianza: 'baja' })
    expect(consolidarCandidatos(g).B[0]).toBe(3)
  })

  it('N tiene null en filas 0, 1, 3, 4 cuando no hay candidatos', () => {
    const resultado = consolidarCandidatos(grillaVacia())
    expect(resultado.N[0]).toBeNull()
    expect(resultado.N[1]).toBeNull()
    expect(resultado.N[3]).toBeNull()
    expect(resultado.N[4]).toBeNull()
  })

  it('grilla con 24 candidatos válidos produce NumerosCartonParcial sin nulls excepto FREE', () => {
    const g = grillaVacia()
    // Asigna un número válido a cada celda.
    const filaMap: Record<number, number[]> = {
      0: [1, 16, 31, 46, 61],
      1: [2, 17, 32, 47, 62],
      2: [3, 18, 33, 48, 63], // (2,2) FREE — no se asigna, no existe la celda
      3: [4, 19, 34, 49, 64],
      4: [5, 20, 35, 50, 65],
    }
    for (const celda of g.celdas) {
      const n = filaMap[celda.fila][celda.columna]
      celda.candidatos.push({ numero: n, confianza: 'alta' })
    }
    const resultado = consolidarCandidatos(g)
    expect(resultado.B).toEqual([1, 2, 3, 4, 5])
    expect(resultado.I).toEqual([16, 17, 18, 19, 20])
    expect(resultado.N).toEqual([31, 32, 'FREE', 34, 35])
    expect(resultado.G).toEqual([46, 47, 48, 49, 50])
    expect(resultado.O).toEqual([61, 62, 63, 64, 65])
  })

  it('celdas vacías quedan en null aunque otras estén llenas', () => {
    const g = grillaVacia()
    g.celdas
      .find((c) => c.fila === 0 && c.columna === 0)!
      .candidatos.push({
        numero: 7,
        confianza: 'alta',
      })
    const resultado = consolidarCandidatos(g)
    expect(resultado.B[0]).toBe(7)
    expect(resultado.B[1]).toBeNull()
    expect(resultado.B[2]).toBeNull()
  })
})
