import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TableroGeneral from './TableroGeneral'
import { useSesionStore } from '@/lib/stores/sesion'

vi.mock('@/lib/stores/sesion')

function mockSesion(numerosSorteados: number[] = [], agregarNumeroSorteado = vi.fn()) {
  vi.mocked(useSesionStore).mockReturnValue({
    iniciadaEn: new Date().toISOString(),
    condicionVictoria: { tipo: 'cartonLleno' },
    numerosSorteados,
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado,
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TableroGeneral', () => {
  it('renderiza 75 botones de número (1 a 75)', () => {
    mockSesion()
    render(<TableroGeneral />)
    // 75 botones + 0 más (los encabezados B-I-N-G-O son <div>, no botones).
    const botones = screen.getAllByRole('button')
    expect(botones).toHaveLength(75)
  })

  it('muestra los 5 encabezados B-I-N-G-O', () => {
    mockSesion()
    render(<TableroGeneral />)
    for (const letra of ['B', 'I', 'N', 'G', 'O']) {
      expect(screen.getByText(letra)).toBeInTheDocument()
    }
  })

  it('los números sorteados quedan deshabilitados y con fondo verde', () => {
    mockSesion([5, 18])
    render(<TableroGeneral />)
    const boton5 = screen.getByRole('button', { name: /Número 5 \(sorteado\)/ })
    expect(boton5).toBeDisabled()
    expect(boton5.className).toContain('bg-green-500')
  })

  it('los números sorteados muestran el número (no un ✓)', () => {
    mockSesion([5])
    render(<TableroGeneral />)
    const boton5 = screen.getByRole('button', { name: /Número 5 \(sorteado\)/ })
    expect(boton5.textContent).toBe('5')
  })

  it('aria-pressed=true en botones sorteados, false en los no sorteados', () => {
    mockSesion([7])
    render(<TableroGeneral />)
    const boton7 = screen.getByRole('button', { name: /Número 7 \(sorteado\)/ })
    const boton8 = screen.getByRole('button', { name: 'Número 8' })
    expect(boton7).toHaveAttribute('aria-pressed', 'true')
    expect(boton8).toHaveAttribute('aria-pressed', 'false')
  })

  it('click en un número no sorteado llama agregarNumeroSorteado', () => {
    const agregar = vi.fn()
    mockSesion([], agregar)
    render(<TableroGeneral />)
    fireEvent.click(screen.getByRole('button', { name: 'Número 23' }))
    expect(agregar).toHaveBeenCalledWith(23)
  })

  it('click en un número ya sorteado no llama agregarNumeroSorteado (botón disabled)', () => {
    const agregar = vi.fn()
    mockSesion([23], agregar)
    render(<TableroGeneral />)
    fireEvent.click(screen.getByRole('button', { name: /Número 23 \(sorteado\)/ }))
    expect(agregar).not.toHaveBeenCalled()
  })

  it('NO renderiza display de último número (ya vive afuera)', () => {
    mockSesion([5])
    render(<TableroGeneral />)
    expect(screen.queryByText(/Último número/i)).not.toBeInTheDocument()
  })

  it('NO renderiza botón "Deshacer último" (vive en UltimoNumeroDisplay)', () => {
    mockSesion([5])
    render(<TableroGeneral />)
    expect(screen.queryByRole('button', { name: /Deshacer/i })).not.toBeInTheDocument()
  })
})
