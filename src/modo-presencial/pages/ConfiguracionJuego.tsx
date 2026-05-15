import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CondicionVictoria } from '@/core/motor-juego'
import { useSesionStore } from '@/lib/stores/sesion'
import { usePatronesStore } from '@/lib/stores/patrones'

type TipoCondicion = CondicionVictoria['tipo']

export default function ConfiguracionJuego() {
  const navigate = useNavigate()
  const { patrones } = usePatronesStore()
  const { establecerCondicion, reiniciarSesion } = useSesionStore()

  const [tipo, setTipo] = useState<TipoCondicion>('cartonLleno')
  const [nMarcados, setNMarcados] = useState(5)
  const [patronId, setPatronId] = useState<string>('')

  function buildCondicion(): CondicionVictoria {
    if (tipo === 'n_marcados') return { tipo: 'n_marcados', valor: nMarcados }
    if (tipo === 'patron') return { tipo: 'patron', patronId: patronId || (patrones[0]?.id ?? '') }
    return { tipo: 'cartonLleno' }
  }

  function handleIniciar() {
    const condicion = buildCondicion()
    establecerCondicion(condicion)
    reiniciarSesion()
    navigate('/jugar')
  }

  const puedeIniciar = tipo !== 'patron' || patrones.length > 0

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Configurar juego</h1>

      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Condición de victoria
        </legend>

        <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <input
            type="radio"
            name="condicion"
            value="cartonLleno"
            checked={tipo === 'cartonLleno'}
            onChange={() => setTipo('cartonLleno')}
            className="mt-0.5"
          />
          <div>
            <p className="font-medium text-gray-800">Cartón lleno</p>
            <p className="text-sm text-gray-500">Hay que marcar todas las casillas del cartón.</p>
          </div>
        </label>

        <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <input
            type="radio"
            name="condicion"
            value="n_marcados"
            checked={tipo === 'n_marcados'}
            onChange={() => setTipo('n_marcados')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-800">Número de casillas</p>
            <p className="mb-2 text-sm text-gray-500">Gana quien marque N casillas primero.</p>
            {tipo === 'n_marcados' && (
              <input
                type="number"
                min={1}
                max={25}
                value={nMarcados}
                onChange={(e) => setNMarcados(Math.max(1, Math.min(25, Number(e.target.value))))}
                aria-label="Número de casillas a marcar"
                className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <input
            type="radio"
            name="condicion"
            value="patron"
            checked={tipo === 'patron'}
            onChange={() => setTipo('patron')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-800">Patrón guardado</p>
            <p className="mb-2 text-sm text-gray-500">Gana quien complete el patrón elegido.</p>
            {tipo === 'patron' &&
              (patrones.length === 0 ? (
                <p className="text-sm text-amber-600">
                  No tienes patrones guardados.{' '}
                  <a href="/patrones" className="underline">
                    Crea uno primero.
                  </a>
                </p>
              ) : (
                <select
                  value={patronId || patrones[0]?.id}
                  onChange={(e) => setPatronId(e.target.value)}
                  aria-label="Seleccionar patrón"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {patrones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              ))}
          </div>
        </label>
      </fieldset>

      <button
        onClick={handleIniciar}
        disabled={!puedeIniciar}
        className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Iniciar sesión de juego
      </button>
    </div>
  )
}
