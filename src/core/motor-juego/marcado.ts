import type { Carton } from '@/core/cartones/types'

const SERIES = ['B', 'I', 'N', 'G', 'O'] as const

/**
 * Retorna el conjunto de coordenadas "fila,columna" (0-indexed) marcadas en el
 * cartón dados los números ya sorteados. La casilla FREE (2,2) siempre se incluye.
 */
export function casillasMarcadasDeCartonConNumeros(
  carton: Carton,
  numerosSorteados: number[],
): Set<string> {
  const sorteados = new Set(numerosSorteados)
  const marcadas = new Set<string>()

  SERIES.forEach((serie, col) => {
    carton.numeros[serie].forEach((valor, fila) => {
      if (valor === 'FREE' || sorteados.has(valor as number)) {
        marcadas.add(`${fila},${col}`)
      }
    })
  })

  return marcadas
}
