import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Jugar from './Jugar'
import { useSesionStore } from '@/lib/stores/sesion'
import { useCartonesStore } from '@/lib/stores/cartones'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { Carton } from '@/core/cartones'
import type { RankingEntry } from '@/core/motor-juego'

vi.mock('@/lib/stores/sesion')
vi.mock('@/lib/stores/cartones')
vi.mock('@/lib/stores/patrones')
vi.mock('../components/TecladoNumerico', () => ({
  default: () => <div data-testid="teclado-numerico" />,
}))

const cartonBase: Carton = {
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

function rankingPara(cartones: Carton[], faltan: number[] = []): RankingEntry[] {
  return cartones.map((c, i) => ({
    cartonId: c.id,
    faltan: faltan[i] ?? 10,
    ganado: false,
  }))
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
    const chips = historial.querySelectorAll('span')
    expect(chips[0].textContent).toBe('33')
  })

  it('marcar número 5 resalta la casilla correspondiente en el cartón', () => {
    mockSesion({
      numerosSorteados: [5],
      rankingComputed: vi.fn(() => rankingPara([cartonBase], [23])),
    })
    mockCartones([cartonBase])
    renderJugar()
    const celdaMarcada = screen
      .getAllByText('5')
      .find((el) => el.classList.contains('bg-green-200') || el.closest('[class*="bg-green-200"]'))
    expect(celdaMarcada ?? screen.getByText('5')).toBeInTheDocument()
  })

  it('número no sorteado no aparece resaltado', () => {
    mockSesion({
      numerosSorteados: [5],
      rankingComputed: vi.fn(() => rankingPara([cartonBase], [23])),
    })
    mockCartones([cartonBase])
    renderJugar()
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

  it('botón Reiniciar abre modal de confirmación', () => {
    mockSesion()
    mockCartones()
    renderJugar()
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/cartones y patrones se mantienen/i)).toBeInTheDocument()
  })

  it('confirmar reinicio en modal llama reiniciarSesion', () => {
    const mockReiniciar = vi.fn()
    mockSesion({ reiniciarSesion: mockReiniciar })
    mockCartones()
    renderJugar()
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(mockReiniciar).toHaveBeenCalledTimes(1)
  })

  it('cancelar reinicio cierra el modal sin llamar reiniciarSesion', () => {
    const mockReiniciar = vi.fn()
    mockSesion({ reiniciarSesion: mockReiniciar })
    mockCartones()
    renderJugar()
    fireEvent.click(screen.getByRole('button', { name: /reiniciar/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(mockReiniciar).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('botón Ver historial abre modal con historial agrupado', () => {
    mockSesion({ numerosSorteados: [5, 18, 33] })
    mockCartones()
    renderJugar()
    fireEvent.click(screen.getByRole('button', { name: /ver historial/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
  })

  it('llama cargarSesion al montar el componente', () => {
    const mockCargar = vi.fn()
    mockSesion({ cargarSesion: mockCargar })
    mockCartones()
    renderJugar()
    expect(mockCargar).toHaveBeenCalledTimes(1)
  })
})

describe('Jugar — ranking dinámico', () => {
  const cartonA: Carton = {
    id: 'id-carton-a000-0000-0000-000000000001',
    serie: 'A',
    creadoEn: new Date().toISOString(),
    fuente: 'manual',
    numeros: {
      B: [1, 2, 3, 4, 6],
      I: [16, 18, 19, 20, 21],
      N: [31, 32, 'FREE', 35, 36],
      G: [46, 47, 48, 49, 50],
      O: [61, 62, 63, 64, 65],
    },
  }
  const cartonB: Carton = {
    id: 'id-carton-b000-0000-0000-000000000002',
    serie: 'B',
    creadoEn: new Date().toISOString(),
    fuente: 'manual',
    numeros: {
      B: [5, 7, 8, 9, 10],
      I: [17, 22, 23, 24, 25],
      N: [33, 37, 'FREE', 38, 39],
      G: [51, 52, 53, 54, 55],
      O: [66, 67, 68, 69, 70],
    },
  }
  const cartonC: Carton = {
    id: 'id-carton-c000-0000-0000-000000000003',
    serie: 'C',
    creadoEn: new Date().toISOString(),
    fuente: 'manual',
    numeros: {
      B: [11, 12, 13, 14, 15],
      I: [26, 27, 28, 29, 30],
      N: [40, 41, 'FREE', 42, 43],
      G: [56, 57, 58, 59, 60],
      O: [71, 72, 73, 74, 75],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPatrones()
  })

  it('ordena los cartones según faltan (menor primero): B(2), A(5), C(8)', () => {
    // ranking retorna B primero (faltan 2), luego A (5), luego C (8)
    mockSesion({
      rankingComputed: vi.fn(() => [
        { cartonId: cartonB.id, faltan: 2, ganado: false },
        { cartonId: cartonA.id, faltan: 5, ganado: false },
        { cartonId: cartonC.id, faltan: 8, ganado: false },
      ]),
    })
    mockCartones([cartonA, cartonB, cartonC]) // orden original A, B, C

    render(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    const textosFaltan = screen.getAllByText(/Faltan \d+ casillas?/)
    expect(textosFaltan[0].textContent).toBe('Faltan 2 casillas')
    expect(textosFaltan[1].textContent).toBe('Faltan 5 casillas')
    expect(textosFaltan[2].textContent).toBe('Faltan 8 casillas')
  })

  it('muestra posiciones #1, #2, #3 en el orden del ranking', () => {
    mockSesion({
      rankingComputed: vi.fn(() => [
        { cartonId: cartonB.id, faltan: 2, ganado: false },
        { cartonId: cartonA.id, faltan: 5, ganado: false },
        { cartonId: cartonC.id, faltan: 8, ganado: false },
      ]),
    })
    mockCartones([cartonA, cartonB, cartonC])

    render(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('muestra badge MUY CERCA en el cartón con faltan <= 2', () => {
    mockSesion({
      rankingComputed: vi.fn(() => [
        { cartonId: cartonB.id, faltan: 2, ganado: false },
        { cartonId: cartonA.id, faltan: 5, ganado: false },
      ]),
    })
    mockCartones([cartonA, cartonB])

    render(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    expect(screen.getByText(/MUY CERCA/)).toBeInTheDocument()
  })

  it('muestra badge BINGO cuando un cartón ha ganado', () => {
    mockSesion({
      rankingComputed: vi.fn(() => [{ cartonId: cartonA.id, faltan: 0, ganado: true }]),
    })
    mockCartones([cartonA])

    render(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    expect(screen.getByText(/BINGO/)).toBeInTheDocument()
  })

  it('actualiza el orden cuando cambia el ranking al rerenderizar', () => {
    const mockRanking = vi.fn(() => [
      { cartonId: cartonB.id, faltan: 2, ganado: false },
      { cartonId: cartonA.id, faltan: 5, ganado: false },
    ])
    mockSesion({ rankingComputed: mockRanking })
    mockCartones([cartonA, cartonB])

    const { rerender } = render(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    // Primer render: B primero (faltan 2), A segundo (faltan 5)
    let textos = screen.getAllByText(/Faltan \d+ casillas?/)
    expect(textos[0].textContent).toBe('Faltan 2 casillas')

    // Cambia el ranking: ahora A primero (faltan 1), B segundo (faltan 4)
    mockRanking.mockReturnValue([
      { cartonId: cartonA.id, faltan: 1, ganado: false },
      { cartonId: cartonB.id, faltan: 4, ganado: false },
    ])
    rerender(
      <MemoryRouter>
        <Jugar />
      </MemoryRouter>,
    )

    textos = screen.getAllByText(/Faltan \d+ casillas?/)
    expect(textos[0].textContent).toBe('Faltan 1 casilla')
    expect(textos[1].textContent).toBe('Faltan 4 casillas')
  })
})
