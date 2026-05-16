import type { NumerosCartonParcial } from '@/core/cartones/types'
import type { CeldaDetectada, GrillaDetectada } from './types'

const ORDEN_CONFIANZA: Record<'alta' | 'media' | 'baja', number> = {
  alta: 2,
  media: 1,
  baja: 0,
}

/**
 * Selecciona el candidato de mayor confianza por celda y produce un
 * `NumerosCartonParcial` listo para presentar al usuario en la UI de revisión.
 * Sin candidatos → null en esa casilla. La celda (2,2) siempre es 'FREE'.
 */
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
