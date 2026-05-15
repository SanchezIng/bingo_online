import { Link } from 'react-router-dom'
import { useSesionStore } from '@/lib/stores/sesion'
import { useCartonesStore } from '@/lib/stores/cartones'
import { usePatronesStore } from '@/lib/stores/patrones'

function descripcionCondicion(
  condicion: ReturnType<typeof useSesionStore.getState>['condicionVictoria'],
  patrones: ReturnType<typeof usePatronesStore.getState>['patrones'],
): string {
  if (condicion.tipo === 'cartonLleno') return 'Cartón lleno'
  if (condicion.tipo === 'n_marcados') return `${condicion.valor} casillas marcadas`
  const patron = patrones.find((p) => p.id === condicion.patronId)
  return patron ? `Patrón: ${patron.nombre}` : 'Patrón desconocido'
}

export default function Jugar() {
  const { iniciadaEn, condicionVictoria, numerosSorteados } = useSesionStore()
  const { cartones } = useCartonesStore()
  const { patrones } = usePatronesStore()

  if (!iniciadaEn) {
    return (
      <div className="px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Modo juego</h1>
        <p className="mb-6 text-gray-500">No hay ninguna sesión activa.</p>
        <Link
          to="/configurar"
          className="inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
        >
          Configurar juego
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Modo juego</h1>

      <div className="mb-4 rounded-lg bg-green-50 p-4">
        <p className="text-sm font-medium text-green-700">Sesión activa</p>
        <p className="text-xs text-green-600">
          Iniciada: {new Date(iniciadaEn).toLocaleTimeString()}
        </p>
      </div>

      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">Condición de victoria</dt>
          <dd className="text-sm font-medium text-gray-800">
            {descripcionCondicion(condicionVictoria, patrones)}
          </dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">Cartones</dt>
          <dd className="text-sm font-medium text-gray-800">{cartones.length}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">Números sorteados</dt>
          <dd className="text-sm font-medium text-gray-800">{numerosSorteados.length}</dd>
        </div>
      </dl>

      <p className="mt-6 text-center text-sm text-gray-400">
        El marcador de números llega en la siguiente fase.
      </p>

      <div className="mt-4 text-center">
        <Link to="/configurar" className="text-sm text-blue-600 hover:underline">
          Cambiar configuración
        </Link>
      </div>
    </div>
  )
}
