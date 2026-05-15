import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesionStore } from '@/lib/stores/sesion'
import { useCartonesStore } from '@/lib/stores/cartones'
import { usePatronesStore } from '@/lib/stores/patrones'
import { casillasMarcadasDeCartonConNumeros } from '@/core/motor-juego'
import type { CondicionVictoria } from '@/core/motor-juego'
import type { Patron } from '@/core/motor-juego'
import CartonGrid from '../components/CartonGrid'
import TecladoNumerico from '../components/TecladoNumerico'

function descripcionCondicion(condicion: CondicionVictoria, patrones: Patron[]): string {
  if (condicion.tipo === 'cartonLleno') return 'Cartón lleno'
  if (condicion.tipo === 'n_marcados') return `${condicion.valor} casillas marcadas`
  const patron = patrones.find((p) => p.id === condicion.patronId)
  return patron ? `Patrón: ${patron.nombre}` : 'Patrón desconocido'
}

export default function Jugar() {
  const { iniciadaEn, condicionVictoria, numerosSorteados, reiniciarSesion } = useSesionStore()
  const { cartones } = useCartonesStore()
  const { patrones } = usePatronesStore()
  const [pedirConfirma, setPedirConfirma] = useState(false)

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

  const ultimosNumeros = [...numerosSorteados].reverse().slice(0, 10)

  function handleReiniciar() {
    if (!pedirConfirma) {
      setPedirConfirma(true)
      return
    }
    reiniciarSesion()
    setPedirConfirma(false)
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {descripcionCondicion(condicionVictoria, patrones)}
          </h1>
          <p className="text-sm text-gray-500">
            {numerosSorteados.length} número{numerosSorteados.length !== 1 ? 's' : ''} sorteado
            {numerosSorteados.length !== 1 ? 's' : ''} · {cartones.length} cartón
            {cartones.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={handleReiniciar}
          onBlur={() => setPedirConfirma(false)}
          className={[
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium',
            pedirConfirma
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-red-50 text-red-600 hover:bg-red-100',
          ].join(' ')}
        >
          {pedirConfirma ? '¿Confirmar?' : 'Reiniciar'}
        </button>
      </div>

      {ultimosNumeros.length > 0 && (
        <div
          role="region"
          className="mb-4 flex gap-1.5 overflow-x-auto pb-1"
          aria-label="Historial de números sorteados"
        >
          {ultimosNumeros.map((n, idx) => (
            <span
              key={`${n}-${idx}`}
              className={[
                'shrink-0 rounded px-2 py-1 text-xs font-semibold',
                idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600',
              ].join(' ')}
            >
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="order-1 flex flex-1 flex-col gap-4 md:order-2">
          {cartones.length === 0 ? (
            <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-400">
              Sin cartones.{' '}
              <Link to="/cartones/nuevo" className="text-blue-600 hover:underline">
                Añadir cartón
              </Link>
            </p>
          ) : (
            cartones.map((carton) => {
              const marcadas = casillasMarcadasDeCartonConNumeros(carton, numerosSorteados)
              return (
                <div key={carton.id} className="rounded-lg border border-gray-200 p-3">
                  {carton.serie && (
                    <p className="mb-1 text-xs font-medium text-gray-500">Serie {carton.serie}</p>
                  )}
                  <CartonGrid numeros={carton.numeros} casillasMarcadas={marcadas} />
                </div>
              )
            })
          )}
        </div>

        <div className="order-2 md:order-1 md:w-64 md:shrink-0">
          <TecladoNumerico />
        </div>
      </div>
    </div>
  )
}
