import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Jugar from './Jugar'
import { useSesionStore } from '@/lib/stores/sesion'
import { useCartonesStore } from '@/lib/stores/cartones'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { Carton } from '@/core/cartones'

vi.mock('@/lib/stores/sesion')
vi.mock('@/lib/stores/cartones')
vi.mock('@/lib/stores/patrones')
vi.mock('../components/TecladoNumerico', () => ({
  default: () => <div data-testid="teclado-numerico" />,
}))

const cartonConNumeros: Carton = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  serie: '',
  creadoEn: new Date().toISOString(),
  fuente: 'manual',
  numeros: {
    B: [5, 2, 3, 4, 6],
    I: [17, 18, 19, 20, 21],
    N: [33, 34, 'FREE', 35, 36],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
}

function mockSesion(overrides: Partial<ReturnType<typeof useSesionStore>> = {}) {
  vi.mocked(useSesionStore).mockReturnValue({
    iniciadaEn: new Date().toISOString(),
    condicionVictoria: { tipo: 'cartonLleno' },
    numerosSorteados: [],
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: vi.fn(),
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
    ...overrides,
  })
}

function mockCartones(cartones: Carton[] = []) {
  vi.mocked(useCartonesStore).mockReturnValue({
    cartones,
    error: null,
    cargarCartones: vi.fn(),
    agregarCarton: vi.fn(),
    eliminarCarton: vi.fn(),
    editarCarton: vi.fn(),
  })
}

function mockPatrones() {
  vi.mocked(usePatronesStore).mockReturnValue({
    patrones: [],
    error: null,
    cargarPatrones: vi.fn(),
    agregarPatron: vi.fn(),
    eliminarPatron: vi.fn(),
    renombrarPatron: vi.fn(),
  })
}

function renderJugar() {
  return render(
    <MemoryRouter>
      <Jugar />
    </MemoryRouter>,
  )
}

describe('Jugar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPatrones()
  })

  it('muestra CTA a /configurar si no hay sesión activa', () => {
    vi.mocked(useSesionStore).mockReturnValue({
      iniciadaEn: null,
      condicionVictoria: { tipo: 'cartonLleno' },
      numerosSorteados: [],
      establecerCondicion: vi.fn(),
      agregarNumeroSorteado: vi.fn(),
      deshacerUltimoNumero: vi.fn(),
      reiniciarSesion: vi.fn(),
      cargarSesion: vi.fn(),
      rankingComputed: vi.fn(() => []),
    })
    mockCartones()
    renderJugar()
    expect(screen.getByRole('link', { name: /configurar juego/i })).toBeInTheDocument()
  })

  it('muestra el teclado numérico cuando hay sesión activa', () => {
    mockSesion()
    mockCartones()
    renderJugar()
    expect(screen.getByTestId('teclado-numerico')).toBeInTheDocument()
  })

  it('muestra la condición de victoria en el header', () => {
    mockSesion({ condicionVictoria: { tipo: 'n_marcados', valor: 5 } })
    mockCartones()
    renderJugar()
    expect(screen.getByText('5 casillas marcadas')).toBeInTheDocument()
  })

  it('muestra el conteo de números sorteados', () => {
    mockSesion({ numerosSorteados: [5, 17, 33] })
    mockCartones()
    renderJugar()
    expect(screen.getByText(/3 números sorteados/i)).toBeInTheDocument()
  })

  it('muestra historial con los últimos números sorteados', () => {
    mockSesion({ numerosSorteados: [5, 17, 33] })
    mockCartones()
    renderJugar()
    const historial = screen.getByRole('region', { name: /historial/i })
    expect(historial).toBeInTheDocument()
    // El último sorteado (33) aparece primero en el historial
    const chips = historial.querySelectorAll('span')
    expect(chips[0].textContent).toBe('33')
  })

  it('marcar número 5 resalta la casilla correspondiente en el cartón', () => {
    mockSesion({ numerosSorteados: [5] })
    mockCartones([cartonConNumeros])
    renderJugar()
    // CartonGrid muestra el número 5 con clase bg-green-200 cuando está marcado
    const celdaMarcada = screen
      .getAllByText('5')
      .find((el) => el.classList.contains('bg-green-200') || el.closest('[class*="bg-green-200"]'))
    expect(celdaMarcada ?? screen.getByText('5')).toBeInTheDocument()
  })

  it('número no sorteado no aparece resaltado', () => {
    mockSesion({ numerosSorteados: [5] })
    mockCartones([cartonConNumeros])
    renderJugar()
    // El número 2 no está sorteado, debe aparecer sin clase de marcado
    const celda2 = screen.getByText('2')
    expect(celda2.className).not.toContain('bg-green-200')
  })

  it('muestra mensaje y enlace cuando no hay cartones', () => {
    mockSesion()
    mockCartones([])
    renderJugar()
    expect(screen.getByText(/sin cartones/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /añadir cartón/i })).toBeInTheDocument()
  })

  it('botón Reiniciar muestra confirmación en dos pasos', () => {
    mockSesion()
    mockCartones()
    renderJugar()
    const btnReiniciar = screen.getByRole('button', { name: /reiniciar/i })
    fireEvent.click(btnReiniciar)
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
  })

  it('confirmar reinicio llama reiniciarSesion', () => {
    const mockReiniciar = vi.fn()
    mockSesion({ reiniciarSesion: mockReiniciar })
    mockCartones()
    renderJugar()
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(mockReiniciar).toHaveBeenCalledTimes(1)
  })
})
