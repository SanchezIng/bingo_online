import { useSesionStore } from '@/lib/stores/sesion'

const SERIES = ['B', 'I', 'N', 'G', 'O'] as const

function serieDe(n: number): string {
  return SERIES[Math.floor((n - 1) / 15)]
}

export default function UltimoNumeroDisplay() {
  const { numerosSorteados, deshacerUltimoNumero } = useSesionStore()
  const ultimo = numerosSorteados[numerosSorteados.length - 1]

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <div
        className="flex-1 rounded-xl bg-blue-600 px-6 py-4 text-center shadow-sm"
        role="status"
        aria-live="polite"
        aria-label="Último número sorteado"
      >
        {ultimo !== undefined ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">
              Último número
            </p>
            <p className="mt-1 text-5xl font-black leading-none text-white sm:text-6xl">
              {serieDe(ultimo)}-{ultimo}
            </p>
          </>
        ) : (
          <p className="py-2 text-sm text-blue-200">Sin números sorteados</p>
        )}
      </div>

      <button
        onClick={deshacerUltimoNumero}
        disabled={ultimo === undefined}
        className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-default disabled:opacity-40 sm:w-40"
      >
        ↩ Deshacer último
      </button>
    </div>
  )
}
