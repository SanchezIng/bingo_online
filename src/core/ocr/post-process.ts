import type { NumerosCartonParcial } from '@/core/cartones/types'
import type { ResultadoOCRBruto, GrillaDetectada, CeldaDetectada } from './types'

const RANGOS_COLUMNA: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
]

function mapearConfianza(confianzaTesseract: number): 'alta' | 'media' | 'baja' {
  if (confianzaTesseract >= 80) return 'alta'
  if (confianzaTesseract >= 50) return 'media'
  return 'baja'
}

export function estructurarEnGrilla(
  resultado: ResultadoOCRBruto,
  dimensionesImagen: { w: number; h: number },
): GrillaDetectada {
  const { w, h } = dimensionesImagen
  const celdaW = w / 5
  const celdaH = h / 5

  const celdaMap = new Map<string, CeldaDetectada>()
  for (let fila = 0; fila < 5; fila++) {
    for (let columna = 0; columna < 5; columna++) {
      if (fila === 2 && columna === 2) continue
      celdaMap.set(`${fila},${columna}`, { fila, columna, candidatos: [] })
    }
  }

  for (const bloque of resultado.bloques) {
    const numero = parseInt(bloque.texto.trim(), 10)
    if (isNaN(numero)) continue

    const cx = (bloque.bbox.x0 + bloque.bbox.x1) / 2
    const cy = (bloque.bbox.y0 + bloque.bbox.y1) / 2

    const columna = Math.min(Math.floor(cx / celdaW), 4)
    const fila = Math.min(Math.floor(cy / celdaH), 4)

    if (fila === 2 && columna === 2) continue

    const celda = celdaMap.get(`${fila},${columna}`)
    if (!celda) continue

    let confianza = mapearConfianza(bloque.confianza)
    const [min, max] = RANGOS_COLUMNA[columna]
    if (numero < min || numero > max) {
      confianza = 'baja'
    }

    celda.candidatos.push({ numero, confianza })
  }

  return { celdas: Array.from(celdaMap.values()) }
}

const ORDEN_CONFIANZA: Record<'alta' | 'media' | 'baja', number> = {
  alta: 2,
  media: 1,
  baja: 0,
}

export function consolidarCandidatos(grilla: GrillaDetectada): NumerosCartonParcial {
  const lookup = new Map<string, CeldaDetectada>()
  for (const celda of grilla.celdas) {
    lookup.set(`${celda.fila},${celda.columna}`, celda)
  }

  function mejorNumero(fila: number, columna: number): number | null {
    const celda = lookup.get(`${fila},${columna}`)
    if (!celda || celda.candidatos.length === 0) return null
    return celda.candidatos.reduce((prev, curr) =>
      ORDEN_CONFIANZA[curr.confianza] > ORDEN_CONFIANZA[prev.confianza] ? curr : prev,
    ).numero
  }

  function columnaSimple(
    c: number,
  ): [number | null, number | null, number | null, number | null, number | null] {
    return [
      mejorNumero(0, c),
      mejorNumero(1, c),
      mejorNumero(2, c),
      mejorNumero(3, c),
      mejorNumero(4, c),
    ]
  }

  return {
    B: columnaSimple(0),
    I: columnaSimple(1),
    N: [mejorNumero(0, 2), mejorNumero(1, 2), 'FREE', mejorNumero(3, 2), mejorNumero(4, 2)],
    G: columnaSimple(3),
    O: columnaSimple(4),
  }
}
