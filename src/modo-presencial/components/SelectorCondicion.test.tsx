import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SelectorCondicion from './SelectorCondicion'
import { usePatronesStore } from '@/lib/stores/patrones'
import type { Patron } from '@/core/motor-juego'

vi.mock('@/lib/stores/patrones')

const patron: Patron = {
  id: 'p-1',
  nombre: 'Línea horizontal',
  grilla: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false)),
  creadoEn: '2026-01-01T00:00:00.000Z',
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

describe('SelectorCondicion', () => {
  describe('flujo clásico (sin onElegirPatron)', () => {
    it('muestra el <select> cuando hay patrones disponibles', () => {
      mockPatrones([patron])
      render(<SelectorCondicion textoBoton="Confirmar" onConfirmar={vi.fn()} />)
      fireEvent.click(screen.getByRole('radio', { name: /Patrón guardado/i }))
      expect(screen.getByRole('combobox', { name: /Seleccionar patrón/i })).toBeInTheDocument()
    })

    it('muestra mensaje "Crea uno primero" si no hay patrones', () => {
      mockPatrones([])
      render(<SelectorCondicion textoBoton="Confirmar" onConfirmar={vi.fn()} />)
      fireEvent.click(screen.getByRole('radio', { name: /Patrón guardado/i }))
      expect(screen.getByText(/Crea uno primero/i)).toBeInTheDocument()
    })

    it('deshabilita el botón principal cuando no hay patrones en modo patrón', () => {
      mockPatrones([])
      render(<SelectorCondicion textoBoton="Iniciar" onConfirmar={vi.fn()} />)
      fireEvent.click(screen.getByRole('radio', { name: /Patrón guardado/i }))
      expect(screen.getByRole('button', { name: /Iniciar/ })).toBeDisabled()
    })
  })

  describe('flujo "Ir a elegir patrón" (con onElegirPatron)', () => {
    it('sustituye el <select> por un botón "Ir a elegir patrón"', () => {
      mockPatrones([patron])
      render(
        <SelectorCondicion
          textoBoton="Aplicar"
          onConfirmar={vi.fn()}
          onElegirPatron={vi.fn()}
          condicionInicial={{ tipo: 'patron', patronId: 'p-1' }}
        />,
      )
      // No hay <select>
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      // Hay botón
      expect(screen.getByRole('button', { name: /Ir a elegir patrón/i })).toBeInTheDocument()
    })

    it('muestra el nombre del patrón actualmente seleccionado', () => {
      mockPatrones([patron])
      render(
        <SelectorCondicion
          textoBoton="Aplicar"
          onConfirmar={vi.fn()}
          onElegirPatron={vi.fn()}
          condicionInicial={{ tipo: 'patron', patronId: 'p-1' }}
        />,
      )
      expect(screen.getByText('Línea horizontal')).toBeInTheDocument()
    })

    it('click en "Ir a elegir patrón" llama al callback', () => {
      const elegir = vi.fn()
      mockPatrones([patron])
      render(
        <SelectorCondicion
          textoBoton="Aplicar"
          onConfirmar={vi.fn()}
          onElegirPatron={elegir}
          condicionInicial={{ tipo: 'patron', patronId: 'p-1' }}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: /Ir a elegir patrón/i }))
      expect(elegir).toHaveBeenCalledOnce()
    })

    it('botón principal disabled si tipo=patron pero no hay patronId aún', () => {
      mockPatrones([])
      render(
        <SelectorCondicion textoBoton="Aplicar" onConfirmar={vi.fn()} onElegirPatron={vi.fn()} />,
      )
      fireEvent.click(screen.getByRole('radio', { name: /Patrón guardado/i }))
      expect(screen.getByRole('button', { name: /Aplicar/ })).toBeDisabled()
    })
  })
})
