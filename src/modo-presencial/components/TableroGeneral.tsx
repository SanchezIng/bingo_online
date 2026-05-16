import { useSesionStore } from '@/lib/stores/sesion'

const SERIES = ['B', 'I', 'N', 'G', 'O'] as const

// Números en orden fila×columna para un grid de 5 columnas
// Fila 0: [1,16,31,46,61], Fila 1: [2,17,32,47,62], ..., Fila 14: [15,30,45,60,75]
const NUMEROS_TABLERO = Array.from({ length: 75 }, (_, i) => {
  const col = i % 5
  const row = Math.floor(i / 5)
  return col * 15 + row + 1
})

export default function TableroGeneral() {
  const { numerosSorteados, agregarNumeroSorteado } = useSesionStore()
  const sorteadosSet = new Set(numerosSorteados)

  return (
    <section aria-label="Tablero general de números" className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Tablero general
      </h2>

      <div className="grid grid-cols-5 gap-1">
        {SERIES.map((s) => (
          <div
            key={s}
            className="flex items-center justify-center rounded bg-blue-600 py-1.5 text-sm font-bold text-white"
          >
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {NUMEROS_TABLERO.map((n) => {
          const sorteado = sorteadosSet.has(n)
          return (
            <button
              key={n}
              onClick={() => agregarNumeroSorteado(n)}
              disabled={sorteado}
              aria-label={`Número ${n}${sorteado ? ' (sorteado)' : ''}`}
              aria-pressed={sorteado}
              className={[
                'flex min-h-[44px] items-center justify-center rounded text-sm font-bold transition-colors',
                sorteado
                  ? 'cursor-default bg-green-500 text-white shadow-inner ring-2 ring-green-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-blue-100 active:bg-blue-200',
              ].join(' ')}
            >
              {n}
            </button>
          )
        })}
      </div>
    </section>
  )
}
