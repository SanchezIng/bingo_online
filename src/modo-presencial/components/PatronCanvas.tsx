import { useRef, useState } from 'react'
import { grillaInicial } from './patronUtils'

interface PatronCanvasProps {
  grilla: boolean[][]
  onChange: (grilla: boolean[][]) => void
}

function esLibre(fila: number, col: number): boolean {
  return fila === 2 && col === 2
}

export default function PatronCanvas({ grilla, onChange }: PatronCanvasProps) {
  const [modo, setModo] = useState<'dibujar' | 'borrar'>('dibujar')
  const isPointerDown = useRef(false)

  function setCelda(fila: number, col: number) {
    if (esLibre(fila, col)) return
    const nueva = grilla.map((frow, ri) =>
      frow.map((val, ci) => {
        if (ri === fila && ci === col) return modo === 'dibujar'
        return val
      }),
    )
    onChange(nueva)
  }

  function handlePointerDown(fila: number, col: number) {
    isPointerDown.current = true
    setCelda(fila, col)
  }

  function handlePointerEnter(fila: number, col: number) {
    if (!isPointerDown.current) return
    setCelda(fila, col)
  }

  function handlePointerUp() {
    isPointerDown.current = false
  }

  function limpiar() {
    onChange(grillaInicial())
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Controles */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo('dibujar')}
          className={[
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            modo === 'dibujar'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ].join(' ')}
        >
          ✏️ Dibujar
        </button>
        <button
          type="button"
          onClick={() => setModo('borrar')}
          className={[
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            modo === 'borrar'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ].join(' ')}
        >
          🗑️ Borrar
        </button>
        <button
          type="button"
          onClick={limpiar}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
        >
          Limpiar
        </button>
      </div>

      {/* Grilla */}
      <div
        className="grid select-none gap-1"
        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {grilla.map((frow, fila) =>
          frow.map((activa, col) => {
            const libre = esLibre(fila, col)
            let cellClass =
              'flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-xs font-bold transition select-none touch-none'
            if (libre) {
              cellClass += ' bg-yellow-400 text-yellow-900 cursor-default'
            } else if (activa) {
              cellClass += ' bg-blue-500 text-white'
            } else {
              cellClass += ' bg-gray-200 text-gray-400 hover:bg-gray-300'
            }

            return (
              <button
                key={`${fila}-${col}`}
                type="button"
                aria-label={
                  libre ? 'FREE (siempre activo)' : `Celda fila ${fila + 1} columna ${col + 1}`
                }
                aria-pressed={activa}
                disabled={libre}
                className={cellClass}
                onPointerDown={() => handlePointerDown(fila, col)}
                onPointerEnter={() => handlePointerEnter(fila, col)}
              >
                {libre ? 'FREE' : activa ? '●' : '○'}
              </button>
            )
          }),
        )}
      </div>

      <p className="text-center text-xs text-gray-500">
        Toca o arrastra para {modo === 'dibujar' ? 'activar' : 'desactivar'} casillas
      </p>
    </div>
  )
}
