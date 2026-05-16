import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UltimoNumeroDisplay from './UltimoNumeroDisplay'
import { useSesionStore } from '@/lib/stores/sesion'

vi.mock('@/lib/stores/sesion')

function mockSesion(numerosSorteados: number[] = [], deshacer = vi.fn()) {
  vi.mocked(useSesionStore).mockReturnValue({
    iniciadaEn: new Date().toISOString(),
    condicionVictoria: { tipo: 'cartonLleno' },
    numerosSorteados,
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: vi.fn(),
    deshacerUltimoNumero: deshacer,
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UltimoNumeroDisplay', () => {
  it('muestra placeholder cuando no hay números sorteados', () => {
    mockSesion([])
    render(<UltimoNumeroDisplay />)
    expect(screen.getByText(/Sin números sorteados/i)).toBeInTheDocument()
  })

  it('muestra el último número con su letra (e.g. B-7)', () => {
    mockSesion([5, 7])
    render(<UltimoNumeroDisplay />)
    expect(screen.getByText('B-7')).toBeInTheDocument()
  })

  it('mapea correctamente todas las series', () => {
    const casos: Array<[number, string]> = [
      [1, 'B-1'],
      [15, 'B-15'],
      [16, 'I-16'],
      [30, 'I-30'],
      [31, 'N-31'],
      [45, 'N-45'],
      [46, 'G-46'],
      [60, 'G-60'],
      [61, 'O-61'],
      [75, 'O-75'],
    ]
    for (const [n, esperado] of casos) {
      mockSesion([n])
      const { unmount } = render(<UltimoNumeroDisplay />)
      expect(screen.getByText(esperado)).toBeInTheDocument()
      unmount()
    }
  })

  it('botón "Deshacer último" deshabilitado sin números sorteados', () => {
    mockSesion([])
    render(<UltimoNumeroDisplay />)
    expect(screen.getByRole('button', { name: /Deshacer último/i })).toBeDisabled()
  })

  it('botón "Deshacer último" llama deshacerUltimoNumero', () => {
    const deshacer = vi.fn()
    mockSesion([7], deshacer)
    render(<UltimoNumeroDisplay />)
    fireEvent.click(screen.getByRole('button', { name: /Deshacer último/i }))
    expect(deshacer).toHaveBeenCalledOnce()
  })
})
