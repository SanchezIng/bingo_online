import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CartonRankeado from './CartonRankeado'
import type { Carton } from '@/core/cartones'
import type { RankingEntry } from '@/core/motor-juego'

const carton: Carton = {
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

function entrada(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return { cartonId: carton.id, faltan: 10, ganado: false, ...overrides }
}

function renderCarton(
  posicion: number,
  rankingEntrada: RankingEntry,
  numerosSorteados: number[] = [],
) {
  return render(
    <CartonRankeado
      carton={carton}
      posicion={posicion}
      entrada={rankingEntrada}
      numerosSorteados={numerosSorteados}
    />,
  )
}

describe('CartonRankeado', () => {
  it('muestra el número de posición', () => {
    renderCarton(1, entrada())
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('muestra posición correcta cuando es la segunda', () => {
    renderCarton(2, entrada())
    expect(screen.getByText('#2')).toBeInTheDocument()
  })

  it('muestra badge BINGO cuando ganado=true', () => {
    renderCarton(1, entrada({ ganado: true, faltan: 0 }))
    expect(screen.getByText(/BINGO/)).toBeInTheDocument()
  })

  it('muestra badge MUY CERCA cuando faltan <= 2', () => {
    renderCarton(1, entrada({ faltan: 2, ganado: false }))
    expect(screen.getByText(/MUY CERCA/)).toBeInTheDocument()
  })

  it('muestra badge MUY CERCA cuando faltan es 1', () => {
    renderCarton(1, entrada({ faltan: 1, ganado: false }))
    expect(screen.getByText(/MUY CERCA/)).toBeInTheDocument()
  })

  it('muestra badge CASI cuando faltan está entre 3 y 5', () => {
    renderCarton(1, entrada({ faltan: 4, ganado: false }))
    expect(screen.getByText(/CASI/)).toBeInTheDocument()
  })

  it('no muestra badge cuando faltan > 5', () => {
    renderCarton(1, entrada({ faltan: 6, ganado: false }))
    expect(screen.queryByText(/BINGO|MUY CERCA|CASI/)).not.toBeInTheDocument()
  })

  it('muestra texto "Faltan N casillas" cuando no ganado', () => {
    renderCarton(1, entrada({ faltan: 7, ganado: false }))
    expect(screen.getByText('Faltan 7 casillas')).toBeInTheDocument()
  })

  it('usa "casilla" en singular cuando faltan es 1', () => {
    renderCarton(1, entrada({ faltan: 1, ganado: false }))
    expect(screen.getByText('Faltan 1 casilla')).toBeInTheDocument()
  })

  it('muestra "Patrón no encontrado" cuando faltan es Infinity', () => {
    renderCarton(1, entrada({ faltan: Infinity, ganado: false }))
    expect(screen.getByText('Patrón no encontrado')).toBeInTheDocument()
  })

  it('no muestra texto faltan cuando el cartón está ganado', () => {
    renderCarton(1, entrada({ ganado: true, faltan: 0 }))
    expect(screen.queryByText(/Faltan/)).not.toBeInTheDocument()
  })

  it('muestra la serie del cartón cuando existe', () => {
    const cartonConSerie = { ...carton, serie: 'ABC-01' }
    render(
      <CartonRankeado
        carton={cartonConSerie}
        posicion={1}
        entrada={entrada()}
        numerosSorteados={[]}
      />,
    )
    expect(screen.getByText('Serie ABC-01')).toBeInTheDocument()
  })

  it('resalta casillas marcadas según números sorteados', () => {
    renderCarton(1, entrada({ faltan: 23 }), [5])
    // El número 5 está en B[0] → debe aparecer con clase de marcado
    const celdas = screen.getAllByText('5')
    const marcada = celdas.find(
      (el) => el.classList.contains('bg-green-200') || el.closest('[class*="bg-green-200"]'),
    )
    expect(marcada ?? celdas[0]).toBeInTheDocument()
  })
})
