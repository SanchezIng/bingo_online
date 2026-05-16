import { useState } from 'react'
import { useSesionStore } from '@/lib/stores/sesion'
import { usePatronesStore } from '@/lib/stores/patrones'
import ModalSeleccionarCondicion from './ModalSeleccionarCondicion'

function MiniPatron({ grilla }: { grilla: boolean[][] }) {
  return (
    <div className="grid grid-cols-5 gap-0.5">
      {grilla.flatMap((fila, fIdx) =>
        fila.map((activa, cIdx) => {
          const esFree = fIdx === 2 && cIdx === 2
          return (
            <div
              key={`${fIdx}-${cIdx}`}
              aria-hidden="true"
              className={[
                'h-5 w-5 rounded-sm',
                esFree ? 'bg-yellow-400' : activa ? 'bg-blue-500' : 'bg-gray-200',
              ].join(' ')}
            />
          )
        }),
      )}
    </div>
  )
}

export default function PanelPatronFlotante() {
  const { condicionVictoria } = useSesionStore()
  const { patrones } = usePatronesStore()
  const [colapsado, setColapsado] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)

  const patronActual =
    condicionVictoria.tipo === 'patron'
      ? patrones.find((p) => p.id === condicionVictoria.patronId)
      : null

  if (colapsado) {
    return (
      <>
        <button
          onClick={() => setColapsado(false)}
          aria-label="Mostrar panel de patrón"
          className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white shadow-lg hover:bg-blue-700"
        >
          🎯
        </button>
        {modalAbierto && (
          <ModalSeleccionarCondicion
            modo="cambiar"
            condicionInicial={condicionVictoria}
            onClose={() => setModalAbierto(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <aside
        aria-label="Panel del patrón actual"
        className="fixed bottom-4 right-4 z-30 w-60 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Patrón actual
          </p>
          <button
            onClick={() => setColapsado(true)}
            aria-label="Colapsar panel"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <span aria-hidden="true">−</span>
          </button>
        </div>

        <div className="mb-3 flex flex-col items-center gap-2">
          {patronActual ? (
            <>
              <MiniPatron grilla={patronActual.grilla} />
              <p className="text-center text-sm font-medium text-gray-800">{patronActual.nombre}</p>
            </>
          ) : condicionVictoria.tipo === 'cartonLleno' ? (
            <p className="py-3 text-center text-sm font-medium text-gray-800">🎯 Cartón lleno</p>
          ) : condicionVictoria.tipo === 'n_marcados' ? (
            <p className="py-3 text-center text-sm font-medium text-gray-800">
              {condicionVictoria.valor} casillas marcadas
            </p>
          ) : (
            <p className="py-3 text-center text-sm font-medium text-amber-600">
              Patrón no encontrado
            </p>
          )}
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="w-full rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Cambiar patrón
        </button>
      </aside>

      {modalAbierto && (
        <ModalSeleccionarCondicion
          modo="cambiar"
          condicionInicial={condicionVictoria}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </>
  )
}
