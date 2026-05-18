import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import EmptyState from '@/shared/components/EmptyState'
import { CartonVacioIcon, JuegoIcon } from '@/shared/components/icons'

function descripcionCondicion(condicion: CondicionVictoria, patrones: Patron[]): string {
  if (condicion.tipo === 'cartonLleno') return 'Cartón lleno'
  if (condicion.tipo === 'n_marcados') return `${condicion.valor} casillas marcadas`
  const patron = patrones.find((p) => p.id === condicion.patronId)
  return patron ? `Patrón: ${patron.nombre}` : 'Patrón desconocido'
}

export default function Jugar() {
  const navigate = useNavigate()
  const {
    iniciadaEn,
    condicionVictoria,
    numerosSorteados,
    reiniciarSesion,
    cargarSesion,
    rankingComputed,
  } = useSesionStore()
  const { cartones, cargarCartones } = useCartonesStore()
  const { patrones, cargarPatrones } = usePatronesStore()
  const [verHistorial, setVerHistorial] = useState(false)
  const [pedirConfirmaReinicio, setPedirConfirmaReinicio] = useState(false)
  const [modalCondicionAbierto, setModalCondicionAbierto] = useState(false)
  const [setupAbierto, setSetupAbierto] = useState(false)

  function abrirModoJuego() {
    setModalCondicionAbierto(true)
  }

  function navegarAElegirPatron() {
    setModalCondicionAbierto(false)
    navigate('/patrones', { state: { volverAJugar: true } })
  }

  useEffect(() => {
    // Cargar todos los stores al montar; /jugar puede ser la primera ruta
    // que el usuario visita tras un refresh (no podemos depender de que
    // MisCartones o EditorPatrones se hayan montado antes).
    cargarSesion()
    cargarCartones()
    cargarPatrones()
  }, [cargarSesion, cargarCartones, cargarPatrones])

  // Sin sesión activa: pantalla de bienvenida con pasos. El modal se abre
  // explícitamente con el botón — no automáticamente, para que el usuario
  // entienda qué está por configurar.
  if (!iniciadaEn) {
    const pasos = [
      {
        n: 1,
        titulo: 'Crea tus cartones',
        desc: 'Ingresa los números de tus cartones físicos en /cartones.',
      },
      {
        n: 2,
        titulo: 'Define cómo se gana',
        desc: 'Patrón libre, cartón lleno o N casillas marcadas.',
      },
      {
        n: 3,
        titulo: 'Marca números en vivo',
        desc: 'La app calcula quién está más cerca de ganar.',
      },
    ]
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 text-blue-500/80">
            <JuegoIcon size={72} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Empezar partida</h1>
          <p className="mt-2 text-sm text-gray-500">En tres pasos estás listo para jugar.</p>
        </div>

        <ol className="mb-8 space-y-4">
          {pasos.map((p) => (
            <li key={p.n} className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
              >
                {p.n}
              </span>
              <div>
                <p className="font-medium text-gray-800">{p.titulo}</p>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => setSetupAbierto(true)}
          className="min-h-[48px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          Configurar partida
        </button>

        {setupAbierto && (
          <ModalSeleccionarCondicion modo="iniciar" onClose={() => setSetupAbierto(false)} />
        )}
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
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-800">
              {descripcionCondicion(condicionVictoria, patrones)}
            </h1>
            <button
              type="button"
              onClick={abrirModoJuego}
              className="rounded-md border border-blue-600 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Modo juego
            </button>
          </div>
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
          <EmptyState
            icono={<CartonVacioIcon size={48} />}
            titulo="Sin cartones en juego"
            descripcion="Añade al menos un cartón para que la app marque los números y calcule el ranking."
            accion={
              <Link
                to="/cartones/nuevo"
                className="inline-block min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Añadir cartón
              </Link>
            }
          />
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

      {/* Modal "Modo juego" — abierto desde el botón del header */}
      {modalCondicionAbierto && (
        <ModalSeleccionarCondicion
          modo="cambiar"
          condicionInicial={condicionVictoria}
          onClose={() => setModalCondicionAbierto(false)}
          onElegirPatron={navegarAElegirPatron}
        />
      )}

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
