import type { CondicionVictoria, Patron } from './types'

/**
 * Dado el conjunto de casillas marcadas de un cartón y una condición de
 * victoria, retorna si ganó y cuántas casillas faltan para ganar.
 *
 * - `faltan = 0` implica `ganado = true`.
 * - Si el patrón requerido no existe, retorna `{ ganado: false, faltan: Infinity }`.
 */
export function evaluarCondicion(
  casillasMarcadas: Set<string>,
  condicion: CondicionVictoria,
  patrones?: Patron[],
): { ganado: boolean; faltan: number } {
  switch (condicion.tipo) {
    case 'n_marcados': {
      const faltan = Math.max(0, condicion.valor - casillasMarcadas.size)
      return { ganado: faltan === 0, faltan }
    }

    case 'patron': {
      const patron = patrones?.find((p) => p.id === condicion.patronId)
      if (!patron) return { ganado: false, faltan: Infinity }

      let totalEnPatron = 0
      let marcadasEnPatron = 0
      for (let fila = 0; fila < 5; fila++) {
        for (let col = 0; col < 5; col++) {
          if (patron.grilla[fila]?.[col]) {
            totalEnPatron++
            if (casillasMarcadas.has(`${fila},${col}`)) marcadasEnPatron++
          }
        }
      }

      const faltan = totalEnPatron - marcadasEnPatron
      return { ganado: faltan === 0, faltan }
    }

    case 'cartonLleno': {
      // 25 casillas totales; FREE siempre está en marcadas
      const faltan = Math.max(0, 25 - casillasMarcadas.size)
      return { ganado: faltan === 0, faltan }
    }
  }
}
