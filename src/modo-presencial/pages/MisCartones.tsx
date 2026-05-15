import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCartonesStore } from '@/lib/stores/cartones'
import CartonGrid from '@/modo-presencial/components/CartonGrid'

export default function MisCartones() {
  const { cartones, cargarCartones, eliminarCarton } = useCartonesStore()
  const location = useLocation()
  const mensaje = (location.state as { mensaje?: string } | null)?.mensaje
  const [confirmarId, setConfirmarId] = useState<string | null>(null)

  useEffect(() => {
    cargarCartones()
  }, [cargarCartones])

  function handleEliminar(id: string) {
    eliminarCarton(id)
    setConfirmarId(null)
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mis cartones</h1>
        <Link
          to="/cartones/nuevo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Crear cartón
        </Link>
      </div>

      {/* Mensaje de éxito tras crear */}
      {mensaje && (
        <div role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {cartones.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="mb-4 text-lg font-medium text-gray-700">Aún no has creado ningún cartón.</p>
          <p className="mb-6 text-sm text-gray-500">
            Crea tu primer cartón manualmente ingresando los números de tu cartón físico.
          </p>
          <Link
            to="/cartones/nuevo"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Crear primer cartón
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cartones.map((carton, idx) => (
            <div
              key={carton.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  {carton.serie ? `Serie: ${carton.serie}` : `Cartón #${idx + 1}`}
                </span>
                {confirmarId === carton.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEliminar(carton.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmarId(null)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmarId(carton.id)}
                    aria-label={`Borrar cartón ${idx + 1}`}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <CartonGrid numeros={carton.numeros} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
