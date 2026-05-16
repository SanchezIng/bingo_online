import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesionStore } from '@/lib/stores/sesion'
import { useCartonesStore } from '@/lib/stores/cartones'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { CondicionVictoria, Patron } from '@/core/motor-juego'
import CartonRankeado from '../components/CartonRankeado'
import TableroGeneral from '../components/TableroGeneral'
import HistorialSorteados from '../components/HistorialSorteados'
import UltimoNumeroDisplay from '../components/UltimoNumeroDisplay'
import InputNumeroSorteado from '../components/InputNumeroSorteado'
import PanelPatronFlotante from '../components/PanelPatronFlotante'
import ModalSeleccionarCondicion from '../components/ModalSeleccionarCondicion'
import Modal from '@/shared/components/Modal'

function descripcionCondicion(condicion: CondicionVictoria, patrones: Patron[]): string {
  if (condicion.tipo === 'cartonLleno') return 'Cartón lleno'
  if (condicion.tipo === 'n_marcados') return `${condicion.valor} casillas marcadas`
  const patron = patrones.find((p) => p.id === condicion.patronId)
  return patron ? `Patrón: ${patron.nombre}` : 'Patrón desconocido'
}

export default function Jugar() {
  const {
    iniciadaEn,
    condicionVictoria,
    numerosSorteados,
    reiniciarSesion,
    cargarSesion,
    rankingComputed,
  } = useSesionStore()
  const { cartones } = useCartonesStore()
  const { patrones } = usePatronesStore()
  const [verHistorial, setVerHistorial] = useState(false)
  const [pedirConfirmaReinicio, setPedirConfirmaReinicio] = useState(false)

  useEffect(() => {
    cargarSesion()
  }, [cargarSesion])

  // Si no hay sesión activa, abrir el modal de configuración directamente
  // en vez de un link a /configurar — el patrón se define justo antes de jugar.
  if (!iniciadaEn) {
    return (
      <div className="px-4 py-8">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">Modo juego</h1>
        <p className="mb-6 text-center text-gray-500">
          Configura la condición de victoria para empezar.
        </p>
        <ModalSeleccionarCondicion
          modo="iniciar"
          onClose={() => {
            // En modo "iniciar" no hay cómo cancelar sin sesión: redirigimos a /cartones
            window.location.assign('/cartones')
          }}
        />
      </div>
    )
  }

  const ranking = rankingComputed()
  const cartonMap = new Map(cartones.map((c) => [c.id, c]))

  function handleConfirmarReinicio() {
    reiniciarSesion()
    setPedirConfirmaReinicio(false)
  }

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header: condición resumida + acciones */}
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
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setVerHistorial(true)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            Ver historial
          </button>
          <button
            onClick={() => setPedirConfirmaReinicio(true)}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Tira con los últimos 10 sorteados (más reciente primero) */}
      {numerosSorteados.length > 0 && (
        <div
          role="region"
          className="mb-4 flex gap-1.5 overflow-x-auto pb-1"
          aria-label="Historial de números sorteados"
        >
          {[...numerosSorteados]
            .reverse()
            .slice(0, 10)
            .map((n, idx) => (
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

      {/* 1) Input + último número + deshacer */}
      <section className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <InputNumeroSorteado />
        <UltimoNumeroDisplay />
      </section>

      {/* 2) Cartones */}
      <section className="mb-6" aria-label="Cartones en juego">
        {cartones.length === 0 ? (
          <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-400">
            Sin cartones.{' '}
            <Link to="/cartones/nuevo" className="text-blue-600 hover:underline">
              Añadir cartón
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {ranking
              .map((entradaRanking, idx) => {
                const carton = cartonMap.get(entradaRanking.cartonId)
                if (!carton) return null
                return (
                  <CartonRankeado
                    key={carton.id}
                    carton={carton}
                    posicion={idx + 1}
                    entrada={entradaRanking}
                    numerosSorteados={numerosSorteados}
                  />
                )
              })
              .filter(Boolean)}
          </div>
        )}
      </section>

      {/* 3) Tablero general (todos los 75 números) */}
      <TableroGeneral />

      {/* Panel patrón flotante */}
      <PanelPatronFlotante />

      {/* Modales */}
      {verHistorial && (
        <Modal titulo="Historial de números" onClose={() => setVerHistorial(false)}>
          <HistorialSorteados numerosSorteados={numerosSorteados} />
        </Modal>
      )}

      {pedirConfirmaReinicio && (
        <Modal titulo="Reiniciar sesión" onClose={() => setPedirConfirmaReinicio(false)}>
          <p className="mb-6 text-sm text-gray-600">
            ¿Borrar el historial de números sorteados? Tus cartones y patrones se mantienen.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPedirConfirmaReinicio(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarReinicio}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
