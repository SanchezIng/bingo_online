import { describe, it, expect } from 'vitest'
import { estructurarEnGrilla, consolidarCandidatos } from './post-process'
import type { ResultadoOCRBruto, BloqueOCR } from './types'

// Imagen de 500×500 px → cada celda mide 100×100
const DIM = { w: 500, h: 500 }

// Crea un bloque OCR con centro en (cx, cy) y tamaño 40×40 px
function bloque(texto: string, confianza: number, cx: number, cy: number): BloqueOCR {
  return {
    texto,
    confianza,
    bbox: { x0: cx - 20, y0: cy - 20, x1: cx + 20, y1: cy + 20 },
  }
}

// Centro de una celda: col*100+50 para x, fila*100+50 para y
function centroX(col: number): number {
  return col * 100 + 50
}
function centroY(fila: number): number {
  return fila * 100 + 50
}

// ResultadoOCRBruto vacío
const RESULTADO_VACIO: ResultadoOCRBruto = { texto: '', bloques: [] }

// ─── estructurarEnGrilla ──────────────────────────────────────────────────────

describe('estructurarEnGrilla', () => {
  it('produce exactamente 24 celdas (5×5 menos la celda FREE)', () => {
    const { celdas } = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    expect(celdas).toHaveLength(24)
  })

  it('la celda FREE (fila=2, columna=2) nunca está en la salida', () => {
    const { celdas } = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    expect(celdas.find((c) => c.fila === 2 && c.columna === 2)).toBeUndefined()
  })

  it('todas las celdas tienen candidatos vacíos cuando no hay bloques', () => {
    const { celdas } = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    expect(celdas.every((c) => c.candidatos.length === 0)).toBe(true)
  })

  it('asigna bloque a la celda correcta por coordenadas de centro', () => {
    const resultado: ResultadoOCRBruto = {
      texto: '7',
      bloques: [bloque('7', 90, centroX(0), centroY(0))], // columna=0, fila=0 → B fila 0
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    const celda = celdas.find((c) => c.fila === 0 && c.columna === 0)!
    expect(celda.candidatos).toHaveLength(1)
    expect(celda.candidatos[0]).toEqual({ numero: 7, confianza: 'alta' })
  })

  it('mapea confianza Tesseract ≥80 a "alta"', () => {
    const resultado: ResultadoOCRBruto = {
      texto: '3',
      bloques: [bloque('3', 80, centroX(0), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    expect(celdas.find((c) => c.fila === 0 && c.columna === 0)!.candidatos[0].confianza).toBe(
      'alta',
    )
  })

  it('mapea confianza Tesseract 50-79 a "media"', () => {
    const resultado: ResultadoOCRBruto = {
      texto: '3',
      bloques: [bloque('3', 65, centroX(0), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    expect(celdas.find((c) => c.fila === 0 && c.columna === 0)!.candidatos[0].confianza).toBe(
      'media',
    )
  })

  it('mapea confianza Tesseract <50 a "baja"', () => {
    const resultado: ResultadoOCRBruto = {
      texto: '3',
      bloques: [bloque('3', 30, centroX(0), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    expect(celdas.find((c) => c.fila === 0 && c.columna === 0)!.candidatos[0].confianza).toBe(
      'baja',
    )
  })

  it('ignora bloques cuyo texto no es numérico', () => {
    const resultado: ResultadoOCRBruto = {
      texto: 'B',
      bloques: [bloque('B', 90, centroX(0), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    expect(celdas.find((c) => c.fila === 0 && c.columna === 0)!.candidatos).toHaveLength(0)
  })

  it('ignora bloques cuyo centro cae en la celda FREE (fila=2, columna=2)', () => {
    const resultado: ResultadoOCRBruto = {
      texto: '40',
      bloques: [bloque('40', 90, centroX(2), centroY(2))], // N-FREE
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    expect(celdas.find((c) => c.fila === 2 && c.columna === 2)).toBeUndefined()
    // Ninguna otra celda debe tener el 40
    expect(celdas.flatMap((c) => c.candidatos)).toHaveLength(0)
  })

  it('baja la confianza a "baja" cuando el número está fuera del rango de la columna', () => {
    // columna 0 (B) acepta 1-15; ponemos 50
    const resultado: ResultadoOCRBruto = {
      texto: '50',
      bloques: [bloque('50', 90, centroX(0), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    const candidato = celdas.find((c) => c.fila === 0 && c.columna === 0)!.candidatos[0]
    expect(candidato.numero).toBe(50)
    expect(candidato.confianza).toBe('baja')
  })

  it('número válido en su columna mantiene la confianza original mapeada', () => {
    // columna 4 (O) acepta 61-75; confianza Tesseract 75 → "media"
    const resultado: ResultadoOCRBruto = {
      texto: '70',
      bloques: [bloque('70', 75, centroX(4), centroY(1))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    const candidato = celdas.find((c) => c.fila === 1 && c.columna === 4)!.candidatos[0]
    expect(candidato.numero).toBe(70)
    expect(candidato.confianza).toBe('media')
  })

  it('dos bloques en la misma celda producen dos candidatos', () => {
    // Ambos con centro en (fila=0, col=1) → I
    const resultado: ResultadoOCRBruto = {
      texto: '18 20',
      bloques: [bloque('18', 90, centroX(1), centroY(0)), bloque('20', 55, centroX(1), centroY(0))],
    }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    const celda = celdas.find((c) => c.fila === 0 && c.columna === 1)!
    expect(celda.candidatos).toHaveLength(2)
    expect(celda.candidatos.map((c) => c.numero)).toContain(18)
    expect(celda.candidatos.map((c) => c.numero)).toContain(20)
  })

  it('valida rangos de todas las columnas B-I-N-G-O', () => {
    // Un número límite válido por columna (el máximo de cada rango)
    const bloques: BloqueOCR[] = [
      bloque('15', 90, centroX(0), centroY(0)), // B: 15 ✓
      bloque('30', 90, centroX(1), centroY(0)), // I: 30 ✓
      bloque('45', 90, centroX(2), centroY(0)), // N: 45 ✓
      bloque('60', 90, centroX(3), centroY(0)), // G: 60 ✓
      bloque('75', 90, centroX(4), centroY(0)), // O: 75 ✓
    ]
    const resultado: ResultadoOCRBruto = { texto: '', bloques }
    const { celdas } = estructurarEnGrilla(resultado, DIM)
    for (let col = 0; col < 5; col++) {
      const candidato = celdas.find((c) => c.fila === 0 && c.columna === col)!.candidatos[0]
      expect(candidato.confianza).not.toBe('baja') // sigue siendo 'alta' (90 → alta)
    }
  })
})

// ─── consolidarCandidatos ─────────────────────────────────────────────────────

describe('consolidarCandidatos', () => {
  it('retorna null en casilla sin candidatos', () => {
    const grilla = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.B[0]).toBeNull()
    expect(resultado.O[4]).toBeNull()
  })

  it('retorna el número cuando hay un único candidato', () => {
    const bruto: ResultadoOCRBruto = {
      texto: '5',
      bloques: [bloque('5', 90, centroX(0), centroY(0))], // B[0] = 5
    }
    const grilla = estructurarEnGrilla(bruto, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.B[0]).toBe(5)
  })

  it('selecciona el candidato de mayor confianza cuando hay varios en la misma celda', () => {
    // B[0]: candidatos 5 (baja) y 8 (alta) → debe elegir 8
    const bruto: ResultadoOCRBruto = {
      texto: '5 8',
      bloques: [
        bloque('5', 30, centroX(0), centroY(0)), // confianza → 'baja'
        bloque('8', 90, centroX(0), centroY(0)), // confianza → 'alta'
      ],
    }
    const grilla = estructurarEnGrilla(bruto, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.B[0]).toBe(8)
  })

  it('el candidato "media" gana sobre "baja"', () => {
    const bruto: ResultadoOCRBruto = {
      texto: '3 9',
      bloques: [
        bloque('3', 55, centroX(0), centroY(0)), // 'media'
        bloque('9', 20, centroX(0), centroY(0)), // 'baja'
      ],
    }
    const grilla = estructurarEnGrilla(bruto, DIM)
    expect(consolidarCandidatos(grilla).B[0]).toBe(3)
  })

  it('la columna N siempre tiene "FREE" en fila 2', () => {
    const grilla = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.N[2]).toBe('FREE')
  })

  it('N tiene null en filas 0, 1, 3, 4 cuando no hay candidatos', () => {
    const grilla = estructurarEnGrilla(RESULTADO_VACIO, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.N[0]).toBeNull()
    expect(resultado.N[1]).toBeNull()
    expect(resultado.N[3]).toBeNull()
    expect(resultado.N[4]).toBeNull()
  })

  it('cartón con 24 números válidos produce NumerosCartonParcial sin nulls (excepto FREE)', () => {
    // Un número por celda en cada columna con su rango correcto
    // B (col=0): 1,2,3,4,5 para filas 0-4
    // I (col=1): 16,17,18,19,20
    // N (col=2): 31,32 (filas 0,1), FREE, 41,42 (filas 3,4)
    // G (col=3): 46,47,48,49,50
    // O (col=4): 61,62,63,64,65
    const bloques: BloqueOCR[] = []
    ;[1, 2, 3, 4, 5].forEach((n, fila) =>
      bloques.push(bloque(String(n), 90, centroX(0), centroY(fila))),
    )
    ;[16, 17, 18, 19, 20].forEach((n, fila) =>
      bloques.push(bloque(String(n), 90, centroX(1), centroY(fila))),
    )
    ;[31, 32].forEach((n, fila) => bloques.push(bloque(String(n), 90, centroX(2), centroY(fila))))
    ;[41, 42].forEach((n, fila) =>
      bloques.push(bloque(String(n), 90, centroX(2), centroY(fila + 3))),
    )
    ;[46, 47, 48, 49, 50].forEach((n, fila) =>
      bloques.push(bloque(String(n), 90, centroX(3), centroY(fila))),
    )
    ;[61, 62, 63, 64, 65].forEach((n, fila) =>
      bloques.push(bloque(String(n), 90, centroX(4), centroY(fila))),
    )

    const bruto: ResultadoOCRBruto = { texto: '', bloques }
    const grilla = estructurarEnGrilla(bruto, DIM)
    const resultado = consolidarCandidatos(grilla)

    // Verifica que no hay nulls (excepto FREE que es string)
    const series = ['B', 'I', 'N', 'G', 'O'] as const
    for (const s of series) {
      for (let f = 0; f < 5; f++) {
        if (s === 'N' && f === 2) {
          expect(resultado.N[2]).toBe('FREE')
        } else {
          expect(resultado[s][f]).not.toBeNull()
        }
      }
    }
  })

  it('mantiene null en celdas sin detección aunque otras estén llenas', () => {
    // Solo detectamos B[0] = 7; el resto de B debe quedar null
    const bruto: ResultadoOCRBruto = {
      texto: '7',
      bloques: [bloque('7', 90, centroX(0), centroY(0))],
    }
    const grilla = estructurarEnGrilla(bruto, DIM)
    const resultado = consolidarCandidatos(grilla)
    expect(resultado.B[0]).toBe(7)
    expect(resultado.B[1]).toBeNull()
    expect(resultado.B[2]).toBeNull()
    expect(resultado.B[3]).toBeNull()
    expect(resultado.B[4]).toBeNull()
  })
})
