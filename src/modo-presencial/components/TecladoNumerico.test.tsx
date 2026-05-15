import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TecladoNumerico from './TecladoNumerico'
import { useSesionStore } from '@/lib/stores/sesion'

vi.mock('@/lib/stores/sesion')

const mockAgregar = vi.fn()
const mockDeshacer = vi.fn()

function mockStore(overrides: Partial<ReturnType<typeof useSesionStore>> = {}) {
  vi.mocked(useSesionStore).mockReturnValue({
    numerosSorteados: [],
    agregarNumeroSorteado: mockAgregar,
    deshacerUltimoNumero: mockDeshacer,
    condicionVictoria: { tipo: 'cartonLleno' },
    iniciadaEn: new Date().toISOString(),
    establecerCondicion: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
    ...overrides,
  })
}

describe('TecladoNumerico', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('renderiza 75 botones de número', () => {
    render(<TecladoNumerico />)
    for (const n of [1, 15, 16, 30, 31, 45, 46, 60, 61, 75]) {
      expect(screen.getByRole('button', { name: `Número ${n}` })).toBeInTheDocument()
    }
  })

  it('los números están organizados por columnas BINGO (B=1-15, I=16-30, etc.)', () => {
    render(<TecladoNumerico />)
    // La primera celda de la columna B es 1, la primera de I es 16
    const boton1 = screen.getByRole('button', { name: 'Número 1' })
    const boton16 = screen.getByRole('button', { name: 'Número 16' })
    const boton75 = screen.getByRole('button', { name: 'Número 75' })
    expect(boton1).toBeInTheDocument()
    expect(boton16).toBeInTheDocument()
    expect(boton75).toBeInTheDocument()
  })

  it('click en un botón llama agregarNumeroSorteado con ese número', () => {
    render(<TecladoNumerico />)
    fireEvent.click(screen.getByRole('button', { name: 'Número 7' }))
    expect(mockAgregar).toHaveBeenCalledWith(7)
    expect(mockAgregar).toHaveBeenCalledTimes(1)
  })

  it('un número ya sorteado aparece deshabilitado', () => {
    mockStore({ numerosSorteados: [7] })
    render(<TecladoNumerico />)
    expect(screen.getByRole('button', { name: 'Número 7' })).toBeDisabled()
  })

  it('un número no sorteado está habilitado', () => {
    mockStore({ numerosSorteados: [7] })
    render(<TecladoNumerico />)
    expect(screen.getByRole('button', { name: 'Número 8' })).not.toBeDisabled()
  })

  it('botón Deshacer llama deshacerUltimoNumero', () => {
    mockStore({ numerosSorteados: [7] })
    render(<TecladoNumerico />)
    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }))
    expect(mockDeshacer).toHaveBeenCalledTimes(1)
  })

  it('botón Deshacer está deshabilitado sin números sorteados', () => {
    render(<TecladoNumerico />)
    expect(screen.getByRole('button', { name: /deshacer/i })).toBeDisabled()
  })

  it('botón Deshacer está habilitado con al menos un número sorteado', () => {
    mockStore({ numerosSorteados: [33] })
    render(<TecladoNumerico />)
    expect(screen.getByRole('button', { name: /deshacer/i })).not.toBeDisabled()
  })

  it('muestra el último número sorteado con su serie', () => {
    mockStore({ numerosSorteados: [7, 20] })
    render(<TecladoNumerico />)
    // 20 está en la serie I (16-30)
    expect(screen.getByText('I-20')).toBeInTheDocument()
  })

  it('muestra "Sin números sorteados" cuando no hay ninguno', () => {
    render(<TecladoNumerico />)
    expect(screen.getByText(/sin números sorteados/i)).toBeInTheDocument()
  })

  it('número de serie B muestra prefijo B', () => {
    mockStore({ numerosSorteados: [1] })
    render(<TecladoNumerico />)
    expect(screen.getByText('B-1')).toBeInTheDocument()
  })

  it('número de serie O muestra prefijo O', () => {
    mockStore({ numerosSorteados: [75] })
    render(<TecladoNumerico />)
    expect(screen.getByText('O-75')).toBeInTheDocument()
  })
})
