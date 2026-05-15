import { memo } from 'react'
import type { Carton } from '@/core/cartones'
import type { RankingEntry } from '@/core/motor-juego'
import { casillasMarcadasDeCartonConNumeros } from '@/core/motor-juego'
import CartonGrid from './CartonGrid'

interface CartonRankeadoProps {
  carton: Carton
  posicion: number
  entrada: RankingEntry
  numerosSorteados: number[]
}

function badgeInfo(faltan: number, ganado: boolean): { label: string; clase: string } | null {
  if (ganado) return { label: '🏆 ¡BINGO!', clase: 'bg-yellow-400 text-yellow-900' }
  if (faltan <= 2) return { label: '🔥 MUY CERCA', clase: 'bg-red-100 text-red-700' }
  if (faltan <= 5) return { label: '🎯 CASI', clase: 'bg-orange-100 text-orange-700' }
  return null
}

function textoFaltan(faltan: number, ganado: boolean): string | null {
  if (ganado) return null
  if (faltan === Infinity) return 'Patrón no encontrado'
  return `Faltan ${faltan} casilla${faltan !== 1 ? 's' : ''}`
}

const CartonRankeado = memo(function CartonRankeado({
  carton,
  posicion,
  entrada,
  numerosSorteados,
}: CartonRankeadoProps) {
  const marcadas = casillasMarcadasDeCartonConNumeros(carton, numerosSorteados)
  const badge = badgeInfo(entrada.faltan, entrada.ganado)
  const texto = textoFaltan(entrada.faltan, entrada.ganado)

  return (
    <div className="rounded-lg border border-gray-200 p-3 transition-all duration-300">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">#{posicion}</span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge.clase}`}>
            {badge.label}
          </span>
        )}
      </div>
      {carton.serie && (
        <p className="mb-1 text-xs font-medium text-gray-500">Serie {carton.serie}</p>
      )}
      <CartonGrid numeros={carton.numeros} casillasMarcadas={marcadas} />
      {texto && <p className="mt-1 text-right text-xs text-gray-400">{texto}</p>}
    </div>
  )
})

export default CartonRankeado
