import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InputNumeroSorteado from './InputNumeroSorteado'
import { useSesionStore } from '@/lib/stores/sesion'

vi.mock('@/lib/stores/sesion')

function mockSesion(numerosSorteados: number[] = [], agregar = vi.fn()) {
  vi.mocked(useSesionStore).mockReturnValue({
    iniciadaEn: new Date().toISOString(),
    condicionVictoria: { tipo: 'cartonLleno' },
    numerosSorteados,
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: agregar,
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InputNumeroSorteado', () => {
  it('renderiza el input y el botón Marcar', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    expect(screen.getByLabelText('Número sorteado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Marcar/i })).toBeInTheDocument()
  })

  it('muestra preview de la letra cuando el número está en rango', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    const input = screen.getByLabelText('Número sorteado')
    fireEvent.change(input, { target: { value: '23' } })
    expect(screen.getByText('I-23')).toBeInTheDocument()
  })

  it('botón Marcar deshabilitado cuando el input está vacío', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    expect(screen.getByRole('button', { name: /Marcar/i })).toBeDisabled()
  })

  it('botón Marcar deshabilitado para número fuera de rango (>75)', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    // El input filtra a 2 chars, así que "76" entra OK. "99" también.
    fireEvent.change(screen.getByLabelText('Número sorteado'), { target: { value: '99' } })
    expect(screen.getByRole('button', { name: /Marcar/i })).toBeDisabled()
  })

  it('botón Marcar deshabilitado si el número ya fue sorteado', () => {
    mockSesion([23])
    render(<InputNumeroSorteado />)
    fireEvent.change(screen.getByLabelText('Número sorteado'), { target: { value: '23' } })
    expect(screen.getByRole('button', { name: /Marcar/i })).toBeDisabled()
  })

  it('submit con número válido llama agregarNumeroSorteado y limpia el input', () => {
    const agregar = vi.fn()
    mockSesion([], agregar)
    render(<InputNumeroSorteado />)
    const input = screen.getByLabelText('Número sorteado')
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: /Marcar/i }))
    expect(agregar).toHaveBeenCalledWith(7)
    expect(input).toHaveValue('')
  })

  it('submit con número duplicado muestra error inline y NO llama agregar', () => {
    const agregar = vi.fn()
    mockSesion([23], agregar)
    render(<InputNumeroSorteado />)
    fireEvent.change(screen.getByLabelText('Número sorteado'), { target: { value: '23' } })
    // El botón está disabled, pero podemos enviar el formulario con Enter (que dispara submit).
    fireEvent.submit(screen.getByLabelText('Número sorteado').closest('form')!)
    expect(agregar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/ya fue sorteado/i)
  })

  it('filtra caracteres no numéricos del input', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    const input = screen.getByLabelText('Número sorteado')
    fireEvent.change(input, { target: { value: 'a1b2' } })
    expect(input).toHaveValue('12')
  })

  it('limita el input a 2 dígitos', () => {
    mockSesion()
    render(<InputNumeroSorteado />)
    const input = screen.getByLabelText('Número sorteado')
    fireEvent.change(input, { target: { value: '123' } })
    expect(input).toHaveValue('12')
  })
})
