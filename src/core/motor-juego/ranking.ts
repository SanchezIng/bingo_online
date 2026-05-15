import type { Carton } from '@/core/cartones/types'
import type { CondicionVictoria, Patron, RankingEntry } from './types'
import { casillasMarcadasDeCartonConNumeros } from './marcado'
import { evaluarCondicion } from './victoria'

/**
 * Calcula el ranking de cartones dado el estado actual del sorteo.
 * Orden: primero los ganadores, luego por `faltan` ascendente (menor distancia primero).
 */
export function calcularRanking(
  cartones: Carton[],
  numerosSorteados: number[],
  condicion: CondicionVictoria,
  patrones: Patron[],
): RankingEntry[] {
  const entries: RankingEntry[] = cartones.map((carton) => {
    const marcadas = casillasMarcadasDeCartonConNumeros(carton, numerosSorteados)
    const { ganado, faltan } = evaluarCondicion(marcadas, condicion, patrones)
    return { cartonId: carton.id, faltan, ganado }
  })

  return entries.sort((a, b) => {
    if (a.ganado && !b.ganado) return -1
    if (!a.ganado && b.ganado) return 1
    return a.faltan - b.faltan
  })
}
