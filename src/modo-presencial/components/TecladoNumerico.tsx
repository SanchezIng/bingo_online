import { useSesionStore } from '@/lib/stores/sesion'

const SERIES = ['B', 'I', 'N', 'G', 'O'] as const

function serieDe(n: number): string {
  return SERIES[Math.floor((n - 1) / 15)]
}

// Números en orden fila×columna para un grid de 5 columnas
// Fila 0: [1,16,31,46,61], Fila 1: [2,17,32,47,62], ..., Fila 14: [15,30,45,60,75]
const NUMEROS_TECLADO = Array.from({ length: 75 }, (_, i) => {
  const col = i % 5
  const row = Math.floor(i / 5)
  return col * 15 + row + 1
})

export default function TecladoNumerico() {
  const { numerosSorteados, agregarNumeroSorteado, deshacerUltimoNumero } = useSesionStore()
  const ultimo = numerosSorteados[numerosSorteados.length - 1]

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-blue-600 px-4 py-3 text-center">
        {ultimo !== undefined ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-200">
              Último número
            </p>
            <p className="mt-1 text-4xl font-black text-white">
              {serieDe(ultimo)}-{ultimo}
            </p>
          </>
        ) : (
          <p className="text-sm text-blue-200">Sin números sorteados</p>
        )}
      </div>

      <button
        onClick={deshacerUltimoNumero}
        disabled={ultimo === undefined}
        className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:cursor-default disabled:opacity-40"
      >
        ↩ Deshacer último
      </button>

      <div className="grid grid-cols-5 gap-1">
        {SERIES.map((s) => (
          <div
            key={s}
            className="flex items-center justify-center rounded bg-blue-600 py-1 text-xs font-bold text-white"
          >
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {NUMEROS_TECLADO.map((n) => {
          const sorteado = numerosSorteados.includes(n)
          return (
            <button
              key={n}
              onClick={() => agregarNumeroSorteado(n)}
              disabled={sorteado}
              aria-label={`Número ${n}`}
              className={[
                'flex min-h-[60px] items-center justify-center rounded text-sm font-semibold transition-colors',
                sorteado
                  ? 'cursor-default bg-green-400 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-blue-100 active:bg-blue-200',
              ].join(' ')}
            >
              {sorteado ? '✓' : n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
