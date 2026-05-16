import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PanelPatronFlotante from './PanelPatronFlotante'
import { useSesionStore } from '@/lib/stores/sesion'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { CondicionVictoria, Patron } from '@/core/motor-juego'

vi.mock('@/lib/stores/sesion')
vi.mock('@/lib/stores/patrones')
vi.mock('./ModalSeleccionarCondicion', () => ({
  default: ({ modo }: { modo: string }) => (
    <div data-testid="modal-seleccionar-condicion" data-modo={modo} />
  ),
}))

function mockSesion(condicion: CondicionVictoria = { tipo: 'cartonLleno' }) {
  vi.mocked(useSesionStore).mockReturnValue({
    iniciadaEn: new Date().toISOString(),
    condicionVictoria: condicion,
    numerosSorteados: [],
    establecerCondicion: vi.fn(),
    agregarNumeroSorteado: vi.fn(),
    deshacerUltimoNumero: vi.fn(),
    reiniciarSesion: vi.fn(),
    cargarSesion: vi.fn(),
    rankingComputed: vi.fn(() => []),
  })
}

function mockPatrones(patrones: Patron[] = []) {
  vi.mocked(usePatronesStore).mockReturnValue({
    patrones,
    error: null,
    cargarPatrones: vi.fn(),
    agregarPatron: vi.fn(),
    eliminarPatron: vi.fn(),
    renombrarPatron: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PanelPatronFlotante', () => {
  it('muestra "Cartón lleno" cuando la condición es cartonLleno', () => {
    mockSesion({ tipo: 'cartonLleno' })
    mockPatrones()
    render(<PanelPatronFlotante />)
    expect(screen.getByText(/Cartón lleno/i)).toBeInTheDocument()
  })

  it('muestra "N casillas marcadas" cuando la condición es n_marcados', () => {
    mockSesion({ tipo: 'n_marcados', valor: 7 })
    mockPatrones()
    render(<PanelPatronFlotante />)
    expect(screen.getByText(/7 casillas marcadas/i)).toBeInTheDocument()
  })

  it('muestra el nombre del patrón cuando la condición es patron', () => {
    const patron: Patron = {
      id: 'p1',
      nombre: 'Línea diagonal',
      grilla: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false)),
      creadoEn: '2026-01-01T00:00:00.000Z',
    }
    mockSesion({ tipo: 'patron', patronId: 'p1' })
    mockPatrones([patron])
    render(<PanelPatronFlotante />)
    expect(screen.getByText('Línea diagonal')).toBeInTheDocument()
  })

  it('muestra "Patrón no encontrado" si el patronId no existe en el store', () => {
    mockSesion({ tipo: 'patron', patronId: 'inexistente' })
    mockPatrones([])
    render(<PanelPatronFlotante />)
    expect(screen.getByText(/Patrón no encontrado/i)).toBeInTheDocument()
  })

  it('botón "Cambiar patrón" abre el modal en modo "cambiar"', () => {
    mockSesion({ tipo: 'cartonLleno' })
    mockPatrones()
    render(<PanelPatronFlotante />)
    fireEvent.click(screen.getByRole('button', { name: /Cambiar patrón/i }))
    const modal = screen.getByTestId('modal-seleccionar-condicion')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-modo', 'cambiar')
  })

  it('botón colapsar oculta el panel y muestra el FAB', () => {
    mockSesion({ tipo: 'cartonLleno' })
    mockPatrones()
    render(<PanelPatronFlotante />)
    expect(
      screen.getByRole('complementary', { name: /Panel del patrón actual/i }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Colapsar panel/i }))
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mostrar panel de patrón/i })).toBeInTheDocument()
  })

  it('FAB expandido vuelve a mostrar el panel', () => {
    mockSesion({ tipo: 'cartonLleno' })
    mockPatrones()
    render(<PanelPatronFlotante />)
    fireEvent.click(screen.getByRole('button', { name: /Colapsar panel/i }))
    fireEvent.click(screen.getByRole('button', { name: /Mostrar panel de patrón/i }))
    expect(
      screen.getByRole('complementary', { name: /Panel del patrón actual/i }),
    ).toBeInTheDocument()
  })
})
