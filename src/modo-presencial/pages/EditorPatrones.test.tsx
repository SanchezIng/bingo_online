import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import EditorPatrones from './EditorPatrones'
import { usePatronesStore } from '@/lib/stores/patrones'
import { useSesionStore } from '@/lib/stores/sesion'
import type { Patron } from '@/core/motor-juego'

vi.mock('@/lib/stores/patrones')
vi.mock('@/lib/stores/sesion')

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

function defaultSesionMock() {
  return {
    iniciadaEn: null,
    condicionVictoria: { tipo: 'cartonLleno' as const },
    numerosSorteados: [],
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: vi.fn(),
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  }
}

const patronA: Patron = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  nombre: 'Línea horizontal',
  grilla: Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => r === 0 || (r === 2 && c === 2)),
  ),
  creadoEn: '2026-01-01T00:00:00.000Z',
}

const patronB: Patron = {
  id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  nombre: 'Cruz',
  grilla: Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => r === 2 || c === 2),
  ),
  creadoEn: '2026-01-02T00:00:00.000Z',
}

function makeStoreMock(patrones: Patron[] = []) {
  return {
    patrones,
    error: null,
    cargarPatrones: vi.fn(),
    agregarPatron: vi.fn(),
    eliminarPatron: vi.fn(),
    renombrarPatron: vi.fn(),
  }
}

function renderEditor() {
  return render(
    <MemoryRouter>
      <EditorPatrones />
    </MemoryRouter>,
  )
}

describe('EditorPatrones', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock())
    vi.mocked(useSesionStore).mockReturnValue(defaultSesionMock())
  })

  describe('vista lista', () => {
    it('muestra mensaje vacío cuando no hay patrones', () => {
      renderEditor()
      expect(screen.getByText(/Aún no has creado ningún patrón/i)).toBeInTheDocument()
    })

    it('muestra los patrones existentes', () => {
      vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([patronA, patronB]))
      renderEditor()
      expect(screen.getByText('Línea horizontal')).toBeInTheDocument()
      expect(screen.getByText('Cruz')).toBeInTheDocument()
    })

    it('muestra botón Borrar por cada patrón', () => {
      vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([patronA, patronB]))
      renderEditor()
      const botones = screen.getAllByRole('button', { name: /Borrar/i })
      expect(botones).toHaveLength(2)
    })
  })

  describe('borrar patrón', () => {
    it('muestra confirmación al hacer click en Borrar', () => {
      vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([patronA]))
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
      expect(screen.getByRole('button', { name: /Confirmar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })

    it('llama a eliminarPatron al confirmar', () => {
      const mockEliminar = vi.fn()
      vi.mocked(usePatronesStore).mockReturnValue({
        ...makeStoreMock([patronA]),
        eliminarPatron: mockEliminar,
      })
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
      fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
      expect(mockEliminar).toHaveBeenCalledWith(patronA.id)
    })

    it('cancela la eliminación al hacer click en Cancelar', () => {
      vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([patronA]))
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
      expect(screen.queryByRole('button', { name: /Confirmar/i })).not.toBeInTheDocument()
    })
  })

  describe('crear patrón', () => {
    it('botón "+ Nuevo patrón" cambia a vista de creación', () => {
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))
      expect(screen.getByText('Nuevo patrón')).toBeInTheDocument()
      expect(screen.getByLabelText(/Nombre del patrón/i)).toBeInTheDocument()
    })

    it('botón Cancelar regresa a la lista', () => {
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
      expect(screen.getByText(/Mis patrones/i)).toBeInTheDocument()
    })

    it('guarda con un nombre auto-generado "Patrón N" si el campo se deja vacío', () => {
      const mockAgregar = vi.fn()
      vi.mocked(usePatronesStore).mockReturnValue({
        ...makeStoreMock([]),
        agregarPatron: mockAgregar,
      })
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))
      // Activa 2 celdas para pasar la validación de grilla (centro ya cuenta).
      const celdas = screen.getAllByLabelText(/Celda fila/i)
      fireEvent.pointerDown(celdas[0])
      fireEvent.pointerDown(celdas[1])
      // Sin tocar el input de nombre, guardar.
      fireEvent.click(screen.getByRole('button', { name: /Guardar patrón/i }))
      expect(mockAgregar).toHaveBeenCalledOnce()
      expect(mockAgregar.mock.calls[0][0].nombre).toMatch(/^Patrón \d+$/)
    })

    it('muestra error si hay menos de 2 casillas activas (además del FREE)', () => {
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))
      // Completar nombre pero dejar la grilla con solo FREE
      const input = screen.getByLabelText(/Nombre del patrón/i)
      fireEvent.change(input, { target: { value: 'Test' } })
      // La grilla inicial solo tiene FREE → debe fallar
      fireEvent.click(screen.getByRole('button', { name: /Guardar patrón/i }))
      expect(screen.getByText(/Activa al menos 2 casillas/i)).toBeInTheDocument()
    })

    it('llama a agregarPatron con un nombre y grilla con 3+ celdas activas', () => {
      const mockAgregar = vi.fn()
      vi.mocked(usePatronesStore).mockReturnValue({
        ...makeStoreMock(),
        agregarPatron: mockAgregar,
      })
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))

      const input = screen.getByLabelText(/Nombre del patrón/i)
      fireEvent.change(input, { target: { value: 'Mi patrón' } })

      // Activar dos celdas (fila 1, columnas 1 y 2)
      const celda00 = screen.getByRole('button', { name: /celda fila 1 columna 1/i })
      const celda01 = screen.getByRole('button', { name: /celda fila 1 columna 2/i })
      fireEvent.pointerDown(celda00)
      fireEvent.pointerDown(celda01)

      fireEvent.click(screen.getByRole('button', { name: /Guardar patrón/i }))

      expect(mockAgregar).toHaveBeenCalledTimes(1)
      const patronGuardado: Patron = mockAgregar.mock.calls[0][0]
      expect(patronGuardado.nombre).toBe('Mi patrón')
      expect(patronGuardado.grilla[0][0]).toBe(true)
      expect(patronGuardado.grilla[2][2]).toBe(true) // FREE
      expect(typeof patronGuardado.id).toBe('string')
    })
  })
})

// ─── Modo selección (volverAJugar) ───────────────────────────────────────────

function renderEditorEnModoSeleccion() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/patrones', state: { volverAJugar: true } }]}>
      <EditorPatrones />
    </MemoryRouter>,
  )
}

describe('EditorPatrones — modo selección (volverAJugar)', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([patronA, patronB]))
    vi.mocked(useSesionStore).mockReturnValue(defaultSesionMock())
  })

  it('muestra banner "Elige un patrón para esta partida"', () => {
    renderEditorEnModoSeleccion()
    expect(screen.getByText(/Elige un patrón para esta partida/i)).toBeInTheDocument()
  })

  it('cada patrón tiene un botón "Usar para jugar"', () => {
    renderEditorEnModoSeleccion()
    expect(screen.getAllByRole('button', { name: /Usar para jugar/i })).toHaveLength(2)
  })

  it('click en "Usar para jugar" aplica la condición y navega a /jugar', () => {
    const establecer = vi.fn()
    vi.mocked(useSesionStore).mockReturnValue({
      ...defaultSesionMock(),
      establecerCondicion: establecer,
    })
    renderEditorEnModoSeleccion()
    fireEvent.click(screen.getAllByRole('button', { name: /Usar para jugar/i })[0])
    expect(establecer).toHaveBeenCalledWith({ tipo: 'patron', patronId: patronA.id })
    expect(navigateMock).toHaveBeenCalledWith('/jugar')
  })

  it('botón "Cancelar" del header navega a /jugar', () => {
    renderEditorEnModoSeleccion()
    // Hay un botón "Cancelar" en el header en modo selección.
    fireEvent.click(screen.getAllByRole('button', { name: /Cancelar/i })[0])
    expect(navigateMock).toHaveBeenCalledWith('/jugar')
  })

  it('lista vacía muestra "Crear patrón" prominente', () => {
    vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock([]))
    renderEditorEnModoSeleccion()
    expect(screen.getByText(/No tienes patrones guardados/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear patrón/i })).toBeInTheDocument()
  })

  it('en vista crear el botón principal dice "Guardar y usar"', () => {
    renderEditorEnModoSeleccion()
    fireEvent.click(screen.getByRole('button', { name: /\+ Nuevo patrón/i }))
    expect(screen.getByRole('button', { name: /Guardar y usar/i })).toBeInTheDocument()
  })
})
