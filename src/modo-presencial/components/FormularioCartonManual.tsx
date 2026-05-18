import { useState } from 'react'
import type { SerieBingo, NumerosCarton, NumerosCartonParcial } from '@/core/cartones'
import { cartonVacioPlantilla, crearCartonAleatorio, validarNumerosCarton } from '@/core/cartones'

interface FormularioCartonManualProps {
  onGuardar: (numeros: NumerosCarton, serie: string) => void
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
  const [serie, setSerie] = useState('')

  function handleChange(serieBingo: SerieBingo, fila: number, raw: string) {
    const num = raw === '' ? null : parseInt(raw, 10)
    const valorFinal = raw === '' || isNaN(num as number) ? null : (num as number)

    setValores((prev) => {
      const col = [...prev[serieBingo]] as (typeof prev)[typeof serieBingo]
      // any-justified: las tuplas tipadas necesitan asignación por índice con cast
      ;(col as (number | null | 'FREE')[])[fila] = valorFinal
      return { ...prev, [serieBingo]: col }
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
    onGuardar(result.value, serie.trim())
    setValores(cartonVacioPlantilla())
    setSerie('')
    setErrores([])
  }

  const todasRellenas = SERIES.every((s) =>
    valores[s].every((v, i) => (s === 'N' && i === 2 ? true : v !== null)),
  )

  return (
    <div className="space-y-4">
      {/* Campo de serie */}
      <div>
        <label htmlFor="serie-carton" className="mb-1 block text-sm font-medium text-gray-700">
          Número de serie{' '}
          <span className="font-normal text-gray-400">(opcional — aparece en la casilla FREE)</span>
        </label>
        <input
          id="serie-carton"
          type="text"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          placeholder="Ej: 0234, A, Serie 1…"
          maxLength={20}
          className="min-h-[44px] w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Grilla de inputs */}
      <div className="grid grid-cols-5 gap-1.5">
        {SERIES.map((serieBingo) => (
          <div key={serieBingo} className="space-y-1.5">
            <div className="flex items-center justify-center rounded bg-blue-600 py-2 text-sm font-bold text-white">
              {serieBingo}
            </div>
            {Array.from({ length: 5 }, (_, fila) => {
              if (serieBingo === 'N' && fila === 2) {
                return (
                  <div
                    key={`${serieBingo}-${fila}`}
                    className="flex min-h-[44px] flex-col items-center justify-center rounded bg-yellow-400 text-sm font-bold text-yellow-900"
                  >
                    <span>FREE</span>
                    {serie.trim() && (
                      <span className="text-xs font-normal opacity-70">{serie.trim()}</span>
                    )}
                  </div>
                )
              }

              const [min, max] = RANGOS[serieBingo]
              const val = valores[serieBingo][fila]

              return (
                <input
                  key={`${serieBingo}-${fila}`}
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  value={val === null || val === undefined ? '' : String(val)}
                  onChange={(e) => handleChange(serieBingo, fila, e.target.value)}
                  placeholder={`${min}–${max}`}
                  aria-label={`${serieBingo} fila ${fila + 1}`}
                  aria-invalid={errores.length > 0 || undefined}
                  aria-describedby={errores.length > 0 ? 'errores-carton' : undefined}
                  className="min-h-[44px] w-full rounded border border-gray-300 px-1 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Mensajes de error */}
      {errores.length > 0 && (
        <ul
          id="errores-carton"
          role="alert"
          className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
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
