import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ConfiguracionJuego from './ConfiguracionJuego'
import { useSesionStore } from '@/lib/stores/sesion'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { Patron } from '@/core/motor-juego'

vi.mock('@/lib/stores/sesion')
vi.mock('@/lib/stores/patrones')

const mockNavegar = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavegar }
})

const patronEjemplo: Patron = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  nombre: 'Línea horizontal',
  grilla: Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => r === 0 || (r === 2 && c === 2)),
  ),
  creadoEn: '2026-01-01T00:00:00.000Z',
}

function makeSesionMock() {
  return {
    condicionVictoria: { tipo: 'cartonLleno' as const },
    numerosSorteados: [],
    iniciadaEn: null,
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: vi.fn(),
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  }
}

function renderConfig() {
  return render(
    <MemoryRouter>
      <ConfiguracionJuego />
    </MemoryRouter>,
  )
}

describe('ConfiguracionJuego', () => {
  let sesionMock: ReturnType<typeof makeSesionMock>

  beforeEach(() => {
    mockNavegar.mockReset()
    sesionMock = makeSesionMock()
    vi.mocked(useSesionStore).mockReturnValue(sesionMock)
    vi.mocked(usePatronesStore).mockReturnValue({
      patrones: [],
      error: null,
      cargarPatrones: vi.fn(),
      agregarPatron: vi.fn(),
      eliminarPatron: vi.fn(),
      renombrarPatron: vi.fn(),
    })
  })

  it('muestra los 3 radio buttons de condición', () => {
    renderConfig()
    expect(screen.getByRole('radio', { name: /cartón lleno/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /número de casillas/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /patrón guardado/i })).toBeInTheDocument()
  })

  it('cartón lleno está seleccionado por defecto', () => {
    renderConfig()
    expect(screen.getByRole('radio', { name: /cartón lleno/i })).toBeChecked()
  })

  it('al seleccionar n_marcados muestra el input numérico', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: /número de casillas/i }))
    expect(screen.getByRole('spinbutton', { name: /número de casillas/i })).toBeInTheDocument()
  })

  it('al seleccionar patrón sin patrones guardados muestra aviso', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: /patrón guardado/i }))
    expect(screen.getByText(/no tienes patrones guardados/i)).toBeInTheDocument()
  })

  it('al seleccionar patrón con patrones disponibles muestra el dropdown', () => {
    vi.mocked(usePatronesStore).mockReturnValue({
      patrones: [patronEjemplo],
      error: null,
      cargarPatrones: vi.fn(),
      agregarPatron: vi.fn(),
      eliminarPatron: vi.fn(),
      renombrarPatron: vi.fn(),
    })
    renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: /patrón guardado/i }))
    expect(screen.getByRole('combobox', { name: /seleccionar patrón/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /línea horizontal/i })).toBeInTheDocument()
  })

  it('botón deshabilitado si patrón seleccionado pero no hay patrones', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: /patrón guardado/i }))
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeDisabled()
  })

  it('al hacer click en iniciar llama establecerCondicion y reiniciarSesion', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(sesionMock.establecerCondicion).toHaveBeenCalledWith({ tipo: 'cartonLleno' })
    expect(sesionMock.reiniciarSesion).toHaveBeenCalled()
  })

  it('al iniciar navega a /jugar', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(mockNavegar).toHaveBeenCalledWith('/jugar')
  })

  it('al iniciar con n_marcados llama establecerCondicion con el valor correcto', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('radio', { name: /número de casillas/i }))
    const input = screen.getByRole('spinbutton', { name: /número de casillas/i })
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(sesionMock.establecerCondicion).toHaveBeenCalledWith({ tipo: 'n_marcados', valor: 10 })
  })
})
