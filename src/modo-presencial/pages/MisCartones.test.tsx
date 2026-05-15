import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MisCartones from './MisCartones'
import { useCartonesStore } from '@/lib/stores/cartones'
import type { Carton } from '@/core/cartones'

vi.mock('@/lib/stores/cartones')

const cartonA: Carton = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  serie: 'A',
  numeros: {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 33, 34],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

const cartonB: Carton = {
  ...cartonA,
  id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  serie: 'B',
  numeros: {
    B: [6, 7, 8, 9, 10],
    I: [21, 22, 23, 24, 25],
    N: [35, 36, 'FREE', 37, 38],
    G: [51, 52, 53, 54, 55],
    O: [66, 67, 68, 69, 70],
  },
}

function makeStoreMock(cartones: Carton[] = []) {
  return {
    cartones,
    error: null,
    cargarCartones: vi.fn(),
    agregarCarton: vi.fn(),
    eliminarCarton: vi.fn(),
    editarCarton: vi.fn(),
  }
}

function renderMisCartones() {
  return render(
    <MemoryRouter>
      <MisCartones />
    </MemoryRouter>,
  )
}

describe('MisCartones', () => {
  beforeEach(() => {
    vi.mocked(useCartonesStore).mockReturnValue(makeStoreMock())
  })

  it('muestra mensaje vacío cuando no hay cartones', () => {
    renderMisCartones()
    expect(screen.getByText(/Aún no has creado ningún cartón/i)).toBeInTheDocument()
  })

  it('muestra el link para crear el primer cartón cuando no hay cartones', () => {
    renderMisCartones()
    expect(screen.getByRole('link', { name: /Crear primer cartón/i })).toBeInTheDocument()
  })

  it('muestra 2 tarjetas cuando hay 2 cartones', () => {
    vi.mocked(useCartonesStore).mockReturnValue(makeStoreMock([cartonA, cartonB]))
    renderMisCartones()
    expect(screen.getByText('Serie: A')).toBeInTheDocument()
    expect(screen.getByText('Serie: B')).toBeInTheDocument()
  })

  it('muestra botón Borrar por cada cartón', () => {
    vi.mocked(useCartonesStore).mockReturnValue(makeStoreMock([cartonA, cartonB]))
    renderMisCartones()
    const botonesEliminar = screen.getAllByRole('button', { name: /Borrar/i })
    expect(botonesEliminar).toHaveLength(2)
  })

  it('muestra confirmación al hacer click en Borrar', () => {
    vi.mocked(useCartonesStore).mockReturnValue(makeStoreMock([cartonA]))
    renderMisCartones()
    fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
  })

  it('cancela la eliminación al hacer click en Cancelar', () => {
    vi.mocked(useCartonesStore).mockReturnValue(makeStoreMock([cartonA]))
    renderMisCartones()
    fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(screen.queryByRole('button', { name: /Confirmar/i })).not.toBeInTheDocument()
  })

  it('llama a eliminarCarton al confirmar el borrado', () => {
    const mockEliminar = vi.fn()
    vi.mocked(useCartonesStore).mockReturnValue({
      ...makeStoreMock([cartonA]),
      eliminarCarton: mockEliminar,
    })
    renderMisCartones()
    fireEvent.click(screen.getByRole('button', { name: /Borrar/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
    expect(mockEliminar).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })
})
