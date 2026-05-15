import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HistorialSorteados from './HistorialSorteados'

describe('HistorialSorteados', () => {
  it('muestra los 5 títulos de serie B/I/N/G/O', () => {
    render(<HistorialSorteados numerosSorteados={[]} />)
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('N')).toBeInTheDocument()
    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.getByText('O')).toBeInTheDocument()
  })

  it('agrupa correctamente: 5→B, 18→I, 33→N, 47→G', () => {
    render(<HistorialSorteados numerosSorteados={[5, 18, 33, 47]} />)
    const chips = screen.getAllByText(/^\d+$/)
    const textos = chips.map((el) => el.textContent)
    expect(textos).toContain('5')
    expect(textos).toContain('18')
    expect(textos).toContain('33')
    expect(textos).toContain('47')
  })

  it('muestra guión en series vacías', () => {
    render(<HistorialSorteados numerosSorteados={[5]} />)
    const guiones = screen.getAllByText('—')
    expect(guiones.length).toBe(4)
  })

  it('muestra múltiples números de la misma serie en orden de aparición', () => {
    render(<HistorialSorteados numerosSorteados={[10, 3, 7]} />)
    const bChips = screen.getAllByText(/^(10|3|7)$/)
    expect(bChips[0].textContent).toBe('10')
    expect(bChips[1].textContent).toBe('3')
    expect(bChips[2].textContent).toBe('7')
  })

  it('número 15 va a B (límite superior)', () => {
    render(<HistorialSorteados numerosSorteados={[15]} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBe(4)
  })

  it('número 61 va a O (límite inferior)', () => {
    render(<HistorialSorteados numerosSorteados={[61]} />)
    expect(screen.getByText('61')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBe(4)
  })

  it('con lista vacía muestra 5 guiones', () => {
    render(<HistorialSorteados numerosSorteados={[]} />)
    expect(screen.getAllByText('—').length).toBe(5)
  })
})
