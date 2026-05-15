import type { NumerosCarton, SerieBingo } from '@/core/cartones'

interface CartonGridProps {
  numeros: NumerosCarton
  casillasMarcadas?: Set<string>
}

const SERIES: SerieBingo[] = ['B', 'I', 'N', 'G', 'O']

export default function CartonGrid({ numeros, casillasMarcadas }: CartonGridProps) {
  return (
    <div className="inline-block w-full">
      {/* Encabezados B-I-N-G-O */}
      <div className="mb-0.5 grid grid-cols-5 gap-0.5">
        {SERIES.map((serie) => (
          <div
            key={serie}
            className="flex items-center justify-center rounded bg-blue-600 py-1 text-sm font-bold text-white"
          >
            {serie}
          </div>
        ))}
      </div>

      {/* Celdas 5×5 — iteramos por fila */}
      <div className="grid grid-cols-5 gap-0.5">
        {Array.from({ length: 5 }, (_, fila) =>
          SERIES.map((serie, col) => {
            const valor = numeros[serie][fila]
            const marcada = casillasMarcadas?.has(`${fila},${col}`) ?? false
            const esFree = valor === 'FREE'

            return (
              <div
                key={`${serie}-${fila}`}
                className={[
                  'flex items-center justify-center rounded py-2 text-sm font-semibold',
                  esFree
                    ? 'bg-yellow-400 text-yellow-900'
                    : marcada
                      ? 'bg-green-200 font-bold text-green-900'
                      : 'bg-gray-100 text-gray-800',
                ].join(' ')}
              >
                {esFree ? 'FREE' : valor}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
