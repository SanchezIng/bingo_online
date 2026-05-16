import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Patron } from '@/core/motor-juego'
import { usePatronesStore } from '@/lib/stores/patrones'
import { useSesionStore } from '@/lib/stores/sesion'
import PatronCanvas from '@/modo-presencial/components/PatronCanvas'
import MiniPatronGrid from '@/modo-presencial/components/MiniPatronGrid'
import { grillaInicial } from '@/modo-presencial/components/patronUtils'

const MAX_NOMBRE = 30

function contarActivas(grilla: boolean[][]): number {
  return grilla.flat().filter(Boolean).length
}

/**
 * Genera un nombre único "Patrón N" para cuando el usuario no llena el campo.
 * Toma el siguiente número que no choque con los nombres ya existentes.
 */
function siguienteNombreDefault(patrones: Patron[]): string {
  const usados = new Set(patrones.map((p) => p.nombre))
  for (let i = patrones.length + 1; i < patrones.length + 100; i++) {
    const candidato = `Patrón ${i}`
    if (!usados.has(candidato)) return candidato
  }
  return `Patrón ${Date.now()}`
}

type Vista = 'lista' | 'crear'

export default function EditorPatrones() {
  const location = useLocation()
  const navigate = useNavigate()
  const { patrones, cargarPatrones, agregarPatron, eliminarPatron } = usePatronesStore()
  const { establecerCondicion } = useSesionStore()

  // Modo "selección": el usuario llegó desde el modal "Modo juego" de /jugar
  // (o desde /configurar) y quiere elegir un patrón para esta partida.
  // Al elegir o crear, aplicamos la condición y volvemos a /jugar.
  const enModoSeleccion =
    (location.state as { volverAJugar?: boolean } | null)?.volverAJugar === true

  const [vista, setVista] = useState<Vista>('lista')
  const [grilla, setGrilla] = useState<boolean[][]>(grillaInicial)
  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState('')
  const [patronAEliminar, setPatronAEliminar] = useState<string | null>(null)

  useEffect(() => {
    cargarPatrones()
  }, [cargarPatrones])

  function abrirCrear() {
    setGrilla(grillaInicial())
    setNombre('')
    setErrorNombre('')
    setVista('crear')
  }

  function cancelar() {
    setVista('lista')
    setPatronAEliminar(null)
  }

  function aplicarYVolverAJugar(patronId: string) {
    establecerCondicion({ tipo: 'patron', patronId })
    navigate('/jugar')
  }

  function seleccionarParaJugar(id: string) {
    aplicarYVolverAJugar(id)
  }

  function cancelarSeleccion() {
    navigate('/jugar')
  }

  function guardar() {
    const nombreTrim = nombre.trim()
    if (nombreTrim.length > MAX_NOMBRE) {
      setErrorNombre(`Máximo ${MAX_NOMBRE} caracteres.`)
      return
    }
    // El centro siempre está activo → necesitamos al menos 2 casillas más
    if (contarActivas(grilla) < 3) {
      setErrorNombre('Activa al menos 2 casillas además del centro.')
      return
    }

    const nombreFinal = nombreTrim || siguienteNombreDefault(patrones)
    const patron: Patron = {
      id: uuidv4(),
      nombre: nombreFinal,
      grilla,
      creadoEn: new Date().toISOString(),
    }
    agregarPatron(patron)

    if (enModoSeleccion) {
      // El usuario vino desde /jugar a elegir/crear un patrón. Lo aplicamos
      // inmediatamente y volvemos a la partida en curso.
      aplicarYVolverAJugar(patron.id)
      return
    }
    setVista('lista')
  }

  function confirmarEliminar(id: string) {
    setPatronAEliminar(id)
  }

  function ejecutarEliminar() {
    if (patronAEliminar) {
      eliminarPatron(patronAEliminar)
      setPatronAEliminar(null)
    }
  }

  if (vista === 'crear') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={cancelar}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nuevo patrón</h1>
        </div>

        <div className="mb-4">
          <label htmlFor="patron-nombre" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre del patrón <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="patron-nombre"
            type="text"
            value={nombre}
            maxLength={MAX_NOMBRE}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrorNombre('')
            }}
            placeholder="Ej: Línea horizontal, Cruz, Esquinas…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errorNombre && <p className="mt-1 text-xs text-red-600">{errorNombre}</p>}
          <p className="mt-1 text-right text-xs text-gray-400">
            {nombre
              ? `${nombre.length}/${MAX_NOMBRE}`
              : 'Si lo dejas vacío, se nombrará automáticamente'}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <PatronCanvas grilla={grilla} onChange={setGrilla} />
        </div>

        <p className="mb-4 text-center text-xs text-gray-500">
          Casillas activas: {contarActivas(grilla)} (incluye FREE)
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {enModoSeleccion ? 'Guardar y usar' : 'Guardar patrón'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {enModoSeleccion && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-medium">Elige un patrón para esta partida</p>
          <p className="mt-1 text-xs text-blue-700">
            Al seleccionar uno, se aplicará como condición de victoria y volverás a la pantalla de
            juego.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {enModoSeleccion ? 'Elegir patrón' : 'Mis patrones'}
        </h1>
        <div className="flex gap-2">
          {enModoSeleccion && (
            <button
              type="button"
              onClick={cancelarSeleccion}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={abrirCrear}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Nuevo patrón
          </button>
        </div>
      </div>

      {patrones.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
          <span className="text-4xl">🎯</span>
          <p className="text-gray-600">
            {enModoSeleccion
              ? 'No tienes patrones guardados. Crea uno para empezar a jugar.'
              : 'Aún no has creado ningún patrón.'}
          </p>
          <p className="text-sm text-gray-400">
            Los patrones definen qué casillas deben marcarse para ganar el bingo.
          </p>
          <button
            type="button"
            onClick={abrirCrear}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Crear patrón
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patrones.map((p: Patron) => (
            <li
              key={p.id}
              className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              {/* Mini-preview visual centrado */}
              <div className="mb-3 flex justify-center rounded-lg bg-gray-50 p-3">
                <MiniPatronGrid grilla={p.grilla} celdaPx={28} />
              </div>

              <h2 className="mb-1 text-center font-semibold text-gray-900">{p.nombre}</h2>
              <p className="mb-3 text-center text-xs text-gray-400">
                {contarActivas(p.grilla)} casillas ·{' '}
                {new Date(p.creadoEn).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>

              {enModoSeleccion && (
                <button
                  type="button"
                  onClick={() => seleccionarParaJugar(p.id)}
                  className="mb-2 w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Usar para jugar
                </button>
              )}

              {patronAEliminar === p.id ? (
                <div className="flex w-full gap-1">
                  <button
                    type="button"
                    onClick={ejecutarEliminar}
                    className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatronAEliminar(null)}
                    className="flex-1 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => confirmarEliminar(p.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Borrar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
