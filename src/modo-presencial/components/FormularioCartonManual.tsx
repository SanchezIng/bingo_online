import { useState } from 'react'
import type { SerieBingo, NumerosCarton, NumerosCartonParcial } from '@/core/cartones'
import { cartonVacioPlantilla, crearCartonAleatorio, validarNumerosCarton } from '@/core/cartones'

interface FormularioCartonManualProps {
  onGuardar: (numeros: NumerosCarton) => void
}

const SERIES: SerieBingo[] = ['B', 'I', 'N', 'G', 'O']

const RANGOS: Record<SerieBingo, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
}

export default function FormularioCartonManual({ onGuardar }: FormularioCartonManualProps) {
  const [valores, setValores] = useState<NumerosCartonParcial>(cartonVacioPlantilla)
  const [errores, setErrores] = useState<string[]>([])

  function handleChange(serie: SerieBingo, fila: number, raw: string) {
    const num = raw === '' ? null : parseInt(raw, 10)
    const valorFinal = raw === '' || isNaN(num as number) ? null : (num as number)

    setValores((prev) => {
      const col = [...prev[serie]] as (typeof prev)[typeof serie]
      // any-justified: las tuplas tipadas necesitan asignación por índice con cast
      ;(col as (number | null | 'FREE')[])[fila] = valorFinal
      return { ...prev, [serie]: col }
    })
    setErrores([])
  }

  function handleLlenarAleatorio() {
    const carton = crearCartonAleatorio()
    // NumerosCarton satisface NumerosCartonParcial (no tiene nulls)
    setValores(carton.numeros as unknown as NumerosCartonParcial)
    setErrores([])
  }

  function handleGuardar() {
    const result = validarNumerosCarton(valores)
    if (!result.ok) {
      setErrores(result.errors)
      return
    }
    onGuardar(result.value)
    setValores(cartonVacioPlantilla())
    setErrores([])
  }

  const todasRellenas = SERIES.every((serie) =>
    valores[serie].every((v, i) => (serie === 'N' && i === 2 ? true : v !== null)),
  )

  return (
    <div className="space-y-4">
      {/* Grilla de inputs */}
      <div className="grid grid-cols-5 gap-1.5">
        {SERIES.map((serie) => (
          <div key={serie} className="space-y-1.5">
            <div className="flex items-center justify-center rounded bg-blue-600 py-2 text-sm font-bold text-white">
              {serie}
            </div>
            {Array.from({ length: 5 }, (_, fila) => {
              if (serie === 'N' && fila === 2) {
                return (
                  <div
                    key={`${serie}-${fila}`}
                    className="flex min-h-[44px] items-center justify-center rounded bg-yellow-400 text-sm font-bold text-yellow-900"
                  >
                    FREE
                  </div>
                )
              }

              const [min, max] = RANGOS[serie]
              const val = valores[serie][fila]

              return (
                <input
                  key={`${serie}-${fila}`}
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  value={val === null || val === undefined ? '' : String(val)}
                  onChange={(e) => handleChange(serie, fila, e.target.value)}
                  placeholder={`${min}–${max}`}
                  aria-label={`${serie} fila ${fila + 1}`}
                  className="min-h-[44px] w-full rounded border border-gray-300 px-1 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Mensajes de error */}
      {errores.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errores.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleLlenarAleatorio}
          className="flex-1 rounded-lg border border-blue-600 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100"
        >
          Llenar aleatoriamente
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={!todasRellenas}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar cartón
        </button>
      </div>
    </div>
  )
}
