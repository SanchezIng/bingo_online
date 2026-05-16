import { useState } from 'react'
import type { CondicionVictoria } from '@/core/motor-juego'
import { usePatronesStore } from '@/lib/stores/patrones'

type TipoCondicion = CondicionVictoria['tipo']

interface SelectorCondicionProps {
  condicionInicial?: CondicionVictoria
  textoBoton: string
  onConfirmar: (condicion: CondicionVictoria) => void
  onCancelar?: () => void
  /**
   * Si se provee, la opción "Patrón guardado" muestra un botón
   * "Ir a elegir patrón →" en vez del `<select>` interno. Pensado para
   * los flujos donde queremos llevar al usuario a /patrones para
   * elegir/crear, especialmente cuando el patrón a usar no existe aún.
   */
  onElegirPatron?: () => void
}

export default function SelectorCondicion({
  condicionInicial,
  textoBoton,
  onConfirmar,
  onCancelar,
  onElegirPatron,
}: SelectorCondicionProps) {
  const { patrones } = usePatronesStore()

  const [tipo, setTipo] = useState<TipoCondicion>(condicionInicial?.tipo ?? 'cartonLleno')
  const [nMarcados, setNMarcados] = useState(
    condicionInicial?.tipo === 'n_marcados' ? condicionInicial.valor : 5,
  )
  const [patronId, setPatronId] = useState<string>(
    condicionInicial?.tipo === 'patron' ? condicionInicial.patronId : '',
  )

  function buildCondicion(): CondicionVictoria {
    if (tipo === 'n_marcados') return { tipo: 'n_marcados', valor: nMarcados }
    if (tipo === 'patron') return { tipo: 'patron', patronId: patronId || (patrones[0]?.id ?? '') }
    return { tipo: 'cartonLleno' }
  }

  // Cuando se usa el flujo "Ir a elegir patrón" (onElegirPatron), el botón
  // principal solo puede aplicar la condición si ya hay un patronId concreto;
  // sin eso el usuario debe ir a /patrones primero. En el flujo clásico (select)
  // basta con que haya patrones disponibles.
  const puedeConfirmar =
    tipo !== 'patron' || (onElegirPatron ? patronId !== '' : patrones.length > 0)

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Condición de victoria
        </legend>

        <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
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

        <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
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

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
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
              (onElegirPatron ? (
                <div className="space-y-2">
                  {patronId && (
                    <p className="text-xs text-gray-600">
                      Patrón actual:{' '}
                      <span className="font-medium text-gray-800">
                        {patrones.find((p) => p.id === patronId)?.nombre ?? '(no encontrado)'}
                      </span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={onElegirPatron}
                    className="w-full rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Ir a elegir patrón →
                  </button>
                </div>
              ) : patrones.length === 0 ? (
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

      <div className="flex justify-end gap-3">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={() => onConfirmar(buildCondicion())}
          disabled={!puedeConfirmar}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {textoBoton}
        </button>
      </div>
    </div>
  )
}
