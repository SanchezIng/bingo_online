import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PatronCanvas from './PatronCanvas'
import { grillaInicial } from './patronUtils'

function renderCanvas(grilla = grillaInicial(), onChange = vi.fn()) {
  return { onChange, ...render(<PatronCanvas grilla={grilla} onChange={onChange} />) }
}

describe('PatronCanvas', () => {
  describe('grillaInicial', () => {
    it('devuelve grilla 5×5 con solo el centro activo', () => {
      const g = grillaInicial()
      expect(g).toHaveLength(5)
      g.forEach((frow) => expect(frow).toHaveLength(5))
      let activas = 0
      g.forEach((frow, r) =>
        frow.forEach((v, c) => {
          if (r === 2 && c === 2) {
            expect(v).toBe(true)
          } else {
            expect(v).toBe(false)
          }
          if (v) activas++
        }),
      )
      expect(activas).toBe(1)
    })
  })

  describe('renderizado', () => {
    it('muestra 25 botones de celda', () => {
      renderCanvas()
      // 25 celdas + 3 botones de control (Dibujar, Borrar, Limpiar)
      const botones = screen.getAllByRole('button')
      // Filtra los botones de control por su texto
      const celdas = botones.filter(
        (b) => !['✏️ Dibujar', '🗑️ Borrar', 'Limpiar'].includes(b.textContent ?? ''),
      )
      expect(celdas).toHaveLength(25)
    })

    it('muestra los botones de modo y limpiar', () => {
      renderCanvas()
      expect(screen.getByRole('button', { name: /dibujar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /borrar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument()
    })
  })

  describe('celda FREE (centro)', () => {
    it('la celda FREE [2][2] está deshabilitada', () => {
      renderCanvas()
      const celdaFree = screen.getByRole('button', { name: /FREE/i })
      expect(celdaFree).toBeDisabled()
    })

    it('click en celda FREE no llama onChange', () => {
      const { onChange } = renderCanvas()
      const celdaFree = screen.getByRole('button', { name: /FREE/i })
      fireEvent.pointerDown(celdaFree)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('toggle de celdas', () => {
    it('pointerDown en celda inactiva llama onChange con esa celda activa', () => {
      const grilla = grillaInicial()
      const { onChange } = renderCanvas(grilla)

      // Celda [0][0] — fila 1, columna 1
      const celda00 = screen.getByRole('button', { name: /celda fila 1 columna 1/i })
      fireEvent.pointerDown(celda00)

      expect(onChange).toHaveBeenCalledTimes(1)
      const nuevaGrilla: boolean[][] = onChange.mock.calls[0][0]
      expect(nuevaGrilla[0][0]).toBe(true)
      // El resto de celdas distintas a FREE no cambia
      expect(nuevaGrilla[0][1]).toBe(false)
      expect(nuevaGrilla[2][2]).toBe(true) // FREE sigue activo
    })

    it('en modo borrar, pointerDown en celda activa la desactiva', () => {
      // Grilla con [0][0] activo
      const grilla = grillaInicial().map((frow, r) =>
        frow.map((v, c) => (r === 0 && c === 0 ? true : v)),
      )
      const { onChange } = renderCanvas(grilla)

      // Cambiar a modo borrar
      fireEvent.click(screen.getByRole('button', { name: /borrar/i }))

      const celda00 = screen.getByRole('button', { name: /celda fila 1 columna 1/i })
      fireEvent.pointerDown(celda00)

      expect(onChange).toHaveBeenCalledTimes(1)
      const nuevaGrilla: boolean[][] = onChange.mock.calls[0][0]
      expect(nuevaGrilla[0][0]).toBe(false)
    })
  })

  describe('limpiar', () => {
    it('botón Limpiar resetea la grilla a solo el centro', () => {
      const grilla = grillaInicial().map((frow, r) =>
        frow.map((v, c) => (r === 0 || c === 0 ? true : v)),
      )
      const { onChange } = renderCanvas(grilla)

      fireEvent.click(screen.getByRole('button', { name: /limpiar/i }))

      expect(onChange).toHaveBeenCalledTimes(1)
      const nuevaGrilla: boolean[][] = onChange.mock.calls[0][0]
      let activas = 0
      nuevaGrilla.forEach((frow) =>
        frow.forEach((v) => {
          if (v) activas++
        }),
      )
      expect(activas).toBe(1)
      expect(nuevaGrilla[2][2]).toBe(true)
    })
  })
})
