import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Patron } from '@/core/motor-juego'
import { usePatronesStore } from '@/lib/stores/patrones'
import PatronCanvas from '@/modo-presencial/components/PatronCanvas'
import { grillaInicial } from '@/modo-presencial/components/patronUtils'

const MAX_NOMBRE = 30

function miniPreview(grilla: boolean[][]): string {
  return grilla.map((frow) => frow.map((v) => (v ? '■' : '□')).join('')).join('\n')
}

function contarActivas(grilla: boolean[][]): number {
  return grilla.flat().filter(Boolean).length
}

type Vista = 'lista' | 'crear'

export default function EditorPatrones() {
  const { patrones, cargarPatrones, agregarPatron, eliminarPatron } = usePatronesStore()
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

  function guardar() {
    const nombreTrim = nombre.trim()
    if (!nombreTrim) {
      setErrorNombre('El nombre es obligatorio.')
      return
    }
    if (nombreTrim.length > MAX_NOMBRE) {
      setErrorNombre(`Máximo ${MAX_NOMBRE} caracteres.`)
      return
    }
    // El centro siempre está activo → necesitamos al menos 2 casillas más
    if (contarActivas(grilla) < 3) {
      setErrorNombre('Activa al menos 2 casillas además del centro.')
      return
    }

    const patron: Patron = {
      id: uuidv4(),
      nombre: nombreTrim,
      grilla,
      creadoEn: new Date().toISOString(),
    }
    agregarPatron(patron)
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
            Nombre del patrón
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
            {nombre.length}/{MAX_NOMBRE}
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
            Guardar patrón
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mis patrones</h1>
        <button
          type="button"
          onClick={abrirCrear}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Nuevo patrón
        </button>
      </div>

      {patrones.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
          <span className="text-4xl">🎯</span>
          <p className="text-gray-600">Aún no has creado ningún patrón.</p>
          <p className="text-sm text-gray-400">
            Los patrones definen qué casillas deben marcarse para ganar el bingo.
          </p>
          <button
            type="button"
            onClick={abrirCrear}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Crear mi primer patrón
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {patrones.map((p: Patron) => (
            <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{p.nombre}</h2>
                {patronAEliminar === p.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={ejecutarEliminar}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatronAEliminar(null)}
                      className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirmarEliminar(p.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Borrar
                  </button>
                )}
              </div>

              {/* Mini-preview de la grilla */}
              <pre className="font-mono text-xs leading-tight text-gray-600">
                {miniPreview(p.grilla)}
              </pre>

              <p className="mt-2 text-xs text-gray-400">
                {contarActivas(p.grilla)} casillas activas ·{' '}
                {new Date(p.creadoEn).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
