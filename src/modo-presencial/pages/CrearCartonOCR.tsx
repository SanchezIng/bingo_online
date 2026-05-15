import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { procesarImagenOCR } from '@/core/ocr'
import type { ResultadoOCRBruto, OcrError } from '@/core/ocr'

type Etapa = 'seleccion' | 'procesando' | 'resultado' | 'error'

export default function CrearCartonOCR() {
  const [etapa, setEtapa] = useState<Etapa>('seleccion')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoOCRBruto | null>(null)
  const [error, setError] = useState<OcrError | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevUrlRef = useRef<string | null>(null)

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url

    setPreviewUrl(url)
    setEtapa('seleccion')
    setResultado(null)
    setError(null)
    setProgreso(0)
  }

  async function handleProcesar() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setEtapa('procesando')
    setProgreso(0)

    const result = await procesarImagenOCR(file, setProgreso)

    if (result.ok) {
      setResultado(result.value)
      setEtapa('resultado')
    } else {
      setError(result.errors)
      setEtapa('error')
    }
  }

  function handleReintentar() {
    setEtapa('seleccion')
    setPreviewUrl(null)
    setResultado(null)
    setError(null)
    setProgreso(0)
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        {/* Selección de imagen */}
        {(etapa === 'seleccion' || etapa === 'resultado' || etapa === 'error') && (
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
                />
              </div>
            )}

            {previewUrl && etapa === 'seleccion' && (
              <button
                onClick={handleProcesar}
                className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 active:bg-blue-800"
              >
                Procesar OCR
              </button>
            )}
          </div>
        )}

        {/* Procesando */}
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

        {/* Error */}
        {etapa === 'error' && error && (
          <div className="space-y-4">
            <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">No se pudo procesar la imagen</p>
              <p className="mt-1">{error.mensaje}</p>
              {error.tipo === 'sin_texto' && (
                <p className="mt-2 text-xs">
                  Intenta con mejor iluminación, enfoque la cámara en los números y asegúrate de que
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

        {/* Resultado bruto */}
        {etapa === 'resultado' && resultado && (
          <div className="space-y-4">
            <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Se detectaron {resultado.bloques.length} número(s). Revisa el resultado antes de
              continuar.
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Números detectados ({resultado.bloques.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {resultado.bloques.map((bloque, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-100 px-3 py-1 font-mono text-sm font-medium text-blue-800"
                    title={`Confianza: ${bloque.confianza.toFixed(0)}%`}
                  >
                    {bloque.texto}
                  </span>
                ))}
              </div>
            </div>

            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">Ver texto bruto</summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2">
                {resultado.texto}
              </pre>
            </details>

            <p className="text-xs text-gray-500">
              La siguiente fase (F5.2) permitirá mapear estos números a la grilla 5×5 y corregir
              errores antes de guardar el cartón.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleReintentar}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Volver a tomar foto
              </button>
              <Link
                to="/cartones/nuevo"
                className="flex-1 rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Ingresar manualmente
              </Link>
            </div>
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
