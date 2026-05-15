import { useMemo, useState } from 'react'
import type { NumerosCarton, NumerosCartonParcial, SerieBingo } from '@/core/cartones'
import { validarNumerosCarton } from '@/core/cartones'
import type { CandidatoOCR, GrillaDetectada } from '@/core/ocr'

interface RevisionOCRProps {
  grilla: GrillaDetectada
  numerosBase: NumerosCartonParcial
  onGuardar: (numeros: NumerosCarton) => void
  onVolver: () => void
}

type NivelConfianza = 'alta' | 'media' | 'baja'

const SERIES: SerieBingo[] = ['B', 'I', 'N', 'G', 'O']

const RANGOS: Record<SerieBingo, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
}

const COLUMNA_DE_SERIE: Record<SerieBingo, number> = { B: 0, I: 1, N: 2, G: 3, O: 4 }

const PESO_CONFIANZA: Record<NivelConfianza, number> = { alta: 2, media: 1, baja: 0 }

const ETIQUETA_CONFIANZA: Record<NivelConfianza, string> = {
  alta: 'Confianza alta',
  media: 'Confianza media',
  baja: 'Confianza baja',
}

function claseBorde(conf: NivelConfianza | null): string {
  if (conf === 'alta') return 'border-green-500'
  if (conf === 'media') return 'border-amber-500'
  if (conf === 'baja') return 'border-red-500'
  return 'border-dashed border-gray-300'
}

export default function RevisionOCR({
  grilla,
  numerosBase,
  onGuardar,
  onVolver,
}: RevisionOCRProps) {
  const [valores, setValores] = useState<NumerosCartonParcial>(numerosBase)
  const [errores, setErrores] = useState<string[]>([])

  const confianzaMap = useMemo(() => {
    const m = new Map<string, NivelConfianza | null>()
    for (const celda of grilla.celdas) {
      let mejor: CandidatoOCR | null = null
      for (const c of celda.candidatos) {
        if (!mejor || PESO_CONFIANZA[c.confianza] > PESO_CONFIANZA[mejor.confianza]) {
          mejor = c
        }
      }
      m.set(`${celda.fila},${celda.columna}`, mejor ? mejor.confianza : null)
    }
    return m
  }, [grilla])

  function handleChange(serie: SerieBingo, fila: number, raw: string) {
    const parsed = raw === '' ? null : parseInt(raw, 10)
    const valor = raw === '' || isNaN(parsed as number) ? null : (parsed as number)

    setValores((prev) => {
      const col = [...prev[serie]] as (typeof prev)[typeof serie]
      // any-justified: las tuplas tipadas necesitan asignación por índice con cast
      ;(col as (number | null | 'FREE')[])[fila] = valor
      return { ...prev, [serie]: col }
    })
    setErrores([])
  }

  const enRango = SERIES.every((s) => {
    const [min, max] = RANGOS[s]
    return valores[s].every((v, i) => {
      if (s === 'N' && i === 2) return true
      return typeof v === 'number' && v >= min && v <= max
    })
  })

  function handleGuardar() {
    const result = validarNumerosCarton(valores)
    if (!result.ok) {
      setErrores(result.errors)
      return
    }
    setErrores([])
    onGuardar(result.value)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-600">
        Revisa cada número antes de guardar. Verde = alta confianza · ámbar = media · rojo = baja ·
        gris punteado = sin detección.
      </p>

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
                    aria-label="Casilla FREE"
                  >
                    FREE
                  </div>
                )
              }

              const [min, max] = RANGOS[serie]
              const val = valores[serie][fila]
              const valorStr =
                val === null || val === undefined || val === 'FREE' ? '' : String(val)
              const conf = confianzaMap.get(`${fila},${COLUMNA_DE_SERIE[serie]}`) ?? null
              const tituloConfianza = conf ? ETIQUETA_CONFIANZA[conf] : 'Sin detección OCR'

              return (
                <input
                  key={`${serie}-${fila}`}
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  value={valorStr}
                  onChange={(e) => handleChange(serie, fila, e.target.value)}
                  title={tituloConfianza}
                  aria-label={`${serie} fila ${fila + 1}`}
                  data-confianza={conf ?? 'ninguna'}
                  className={[
                    'min-h-[44px] w-full rounded border-2 px-1 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500',
                    claseBorde(conf),
                  ].join(' ')}
                />
              )
            })}
          </div>
        ))}
      </div>

      {errores.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errores.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Volver a tomar foto
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={!enRango}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar cartón
        </button>
      </div>
    </div>
  )
}
