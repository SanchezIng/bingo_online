import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { procesarImagenOCR, estructurarEnGrilla, consolidarCandidatos } from '@/core/ocr'
import type { GrillaDetectada, OcrError } from '@/core/ocr'
import { crearCartonDesdeNumeros } from '@/core/cartones'
import type { NumerosCarton, NumerosCartonParcial } from '@/core/cartones'
import { useCartonesStore } from '@/lib/stores/cartones'
import RevisionOCR from '@/modo-presencial/components/RevisionOCR'

type Etapa = 'seleccion' | 'procesando' | 'revision' | 'error'

const DIMENSIONES_FALLBACK = { w: 500, h: 500 }

export default function CrearCartonOCR() {
  const navigate = useNavigate()
  const { agregarCarton } = useCartonesStore()

  const [etapa, setEtapa] = useState<Etapa>('seleccion')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [grillaDetectada, setGrillaDetectada] = useState<GrillaDetectada | null>(null)
  const [numerosBase, setNumerosBase] = useState<NumerosCartonParcial | null>(null)
  const [confianzaPromedio, setConfianzaPromedio] = useState<number | null>(null)
  const [error, setError] = useState<OcrError | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevUrlRef = useRef<string | null>(null)
  const dimensionesRef = useRef<{ w: number; h: number } | null>(null)

  function resetEstado() {
    setPreviewUrl(null)
    setProgreso(0)
    setGrillaDetectada(null)
    setNumerosBase(null)
    setConfianzaPromedio(null)
    setError(null)
    dimensionesRef.current = null
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    dimensionesRef.current = null

    setPreviewUrl(url)
    setEtapa('seleccion')
    setError(null)
    setProgreso(0)
    setGrillaDetectada(null)
    setNumerosBase(null)
    setConfianzaPromedio(null)
  }

  function handleImagenCargada(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      dimensionesRef.current = { w: img.naturalWidth, h: img.naturalHeight }
    }
  }

  async function handleProcesar() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setEtapa('procesando')
    setProgreso(0)

    const result = await procesarImagenOCR(file, setProgreso)

    if (!result.ok) {
      setError(result.errors)
      setEtapa('error')
      return
    }

    const dims = dimensionesRef.current ?? DIMENSIONES_FALLBACK
    const grilla = estructurarEnGrilla(result.value, dims)
    const numeros = consolidarCandidatos(grilla)

    const bloques = result.value.bloques
    const promedio =
      bloques.length > 0 ? bloques.reduce((s, b) => s + b.confianza, 0) / bloques.length : 0

    setGrillaDetectada(grilla)
    setNumerosBase(numeros)
    setConfianzaPromedio(promedio)
    setEtapa('revision')
  }

  function handleReintentar() {
    setEtapa('seleccion')
    resetEstado()
  }

  function handleGuardarCarton(numeros: NumerosCarton) {
    const result = crearCartonDesdeNumeros(numeros, { fuente: 'ocr' })
    if (!result.ok) {
      setError({
        tipo: 'procesamiento_fallido',
        mensaje: 'No se pudo guardar el cartón: ' + result.errors.join(', '),
      })
      setEtapa('error')
      return
    }
    agregarCarton(result.value)
    navigate('/cartones', { state: { mensaje: 'Cartón creado por OCR.' } })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/cartones" className="text-sm text-gray-500 hover:text-gray-700">
          ← Mis cartones
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Crear cartón con foto</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {etapa === 'seleccion' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Foto del cartón</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleArchivoSeleccionado}
                aria-label="Seleccionar foto del cartón"
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
            </label>

            {previewUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Vista previa del cartón"
                  className="h-48 w-full object-contain"
                  onLoad={handleImagenCargada}
                />
              </div>
            )}

            {previewUrl && (
              <button
                onClick={handleProcesar}
                className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 active:bg-blue-800"
              >
                Procesar OCR
              </button>
            )}
          </div>
        )}

        {etapa === 'procesando' && (
          <div className="space-y-4 py-4 text-center">
            {previewUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Vista previa del cartón"
                  className="h-48 w-full object-contain opacity-50"
                />
              </div>
            )}
            <p className="text-sm font-medium text-gray-700">Procesando imagen…</p>
            <div
              role="progressbar"
              aria-valuenow={progreso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso OCR"
              className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progreso}%</p>
            <p className="text-xs text-gray-400">
              Las fotos permanecen en tu dispositivo. Nunca salen a servidores externos.
            </p>
          </div>
        )}

        {etapa === 'revision' && grillaDetectada && numerosBase && (
          <div className="space-y-4">
            {confianzaPromedio !== null && confianzaPromedio < 30 && (
              <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium">Confianza baja en la detección</p>
                <p className="mt-1 text-xs">
                  Promedio {confianzaPromedio.toFixed(0)}%. Considera tomar otra foto con mejor luz
                  o enfoque para mejorar el resultado.
                </p>
              </div>
            )}
            <RevisionOCR
              grilla={grillaDetectada}
              numerosBase={numerosBase}
              onGuardar={handleGuardarCarton}
              onVolver={handleReintentar}
            />
          </div>
        )}

        {etapa === 'error' && error && (
          <div className="space-y-4">
            <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">No se pudo procesar la imagen</p>
              <p className="mt-1">{error.mensaje}</p>
              {error.tipo === 'sin_texto' && (
                <p className="mt-2 text-xs">
                  Intenta con mejor iluminación, enfoca la cámara en los números y asegúrate de que
                  el cartón esté plano.
                </p>
              )}
            </div>
            <button
              onClick={handleReintentar}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Volver a intentar
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        El procesamiento OCR ocurre 100% en tu dispositivo.
        <br />
        Tus fotos nunca se envían a ningún servidor.
      </p>
    </div>
  )
}
