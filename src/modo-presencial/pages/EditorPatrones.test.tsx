import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import EditorPatrones from './EditorPatrones'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { Patron } from '@/core/motor-juego'

vi.mock('@/lib/stores/patrones')

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
    vi.mocked(usePatronesStore).mockReturnValue(makeStoreMock())
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

    it('muestra error si se intenta guardar sin nombre', () => {
      renderEditor()
      fireEvent.click(screen.getByRole('button', { name: /Nuevo patrón/i }))
      fireEvent.click(screen.getByRole('button', { name: /Guardar patrón/i }))
      expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
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
