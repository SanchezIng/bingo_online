import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RevisionOCR from './RevisionOCR'
import type { NumerosCartonParcial } from '@/core/cartones'
import { cartonVacioPlantilla } from '@/core/cartones'
import type { CandidatoOCR, GrillaDetectada } from '@/core/ocr'

type Nivel = CandidatoOCR['confianza']

function grillaConCandidatos(
  porCelda: Record<string, { numero: number; conf: Nivel }[]> = {},
): GrillaDetectada {
  const celdas = []
  for (let fila = 0; fila < 5; fila++) {
    for (let columna = 0; columna < 5; columna++) {
      if (fila === 2 && columna === 2) continue
      const key = `${fila},${columna}`
      const candidatos: CandidatoOCR[] = (porCelda[key] ?? []).map((c) => ({
        numero: c.numero,
        confianza: c.conf,
      }))
      celdas.push({ fila, columna, candidatos })
    }
  }
  return { celdas }
}

const numerosBaseCompleta: NumerosCartonParcial = {
  B: [1, 2, 3, 4, 5],
  I: [16, 17, 18, 19, 20],
  N: [31, 32, 'FREE', 33, 34],
  G: [46, 47, 48, 49, 50],
  O: [61, 62, 63, 64, 65],
}

describe('RevisionOCR', () => {
  it('renderiza 24 inputs editables más la casilla FREE', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Casilla FREE')).toBeInTheDocument()
    expect(screen.getByText('FREE')).toBeInTheDocument()
    // 5x5 = 25, menos la FREE → 24 inputs editables
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(24)
  })

  it('inicializa los inputs con los valores de numerosBase', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={numerosBaseCompleta}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('B fila 1')).toHaveValue(1)
    expect(screen.getByLabelText('I fila 1')).toHaveValue(16)
    expect(screen.getByLabelText('O fila 5')).toHaveValue(65)
  })

  it('editar un input actualiza su valor', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('B fila 1')
    fireEvent.change(input, { target: { value: '7' } })
    expect(input).toHaveValue(7)
  })

  it('botón "Guardar cartón" está deshabilitado con grilla incompleta', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Guardar cartón/i })).toBeDisabled()
  })

  it('botón "Guardar cartón" se habilita con grilla completa válida', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={numerosBaseCompleta}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Guardar cartón/i })).not.toBeDisabled()
  })

  it('llama a onGuardar con los números editados', () => {
    const onGuardar = vi.fn()
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={numerosBaseCompleta}
        onGuardar={onGuardar}
        onVolver={vi.fn()}
      />,
    )
    // Edita B[0] a 9 antes de guardar
    fireEvent.change(screen.getByLabelText('B fila 1'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cartón/i }))

    expect(onGuardar).toHaveBeenCalledOnce()
    const numeros = onGuardar.mock.calls[0][0]
    expect(numeros.B[0]).toBe(9)
    expect(numeros.N[2]).toBe('FREE')
  })

  it('muestra error inline cuando hay duplicados y no llama onGuardar', () => {
    const onGuardar = vi.fn()
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={numerosBaseCompleta}
        onGuardar={onGuardar}
        onVolver={vi.fn()}
      />,
    )
    // Provoca duplicado: B[1] = 1 (mismo que B[0])
    fireEvent.change(screen.getByLabelText('B fila 2'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cartón/i }))

    expect(onGuardar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/duplicados/i)
  })

  it('botón "Volver a tomar foto" llama a onVolver', () => {
    const onVolver = vi.fn()
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={onVolver}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Volver a tomar foto/i }))
    expect(onVolver).toHaveBeenCalledOnce()
  })

  it('asigna clase border-green al input de confianza alta', () => {
    const grilla = grillaConCandidatos({
      '0,0': [{ numero: 5, conf: 'alta' }],
    })
    render(
      <RevisionOCR
        grilla={grilla}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('B fila 1')
    expect(input.className).toContain('border-green-500')
    expect(input).toHaveAttribute('data-confianza', 'alta')
  })

  it('asigna clase border-amber al input de confianza media', () => {
    const grilla = grillaConCandidatos({
      '0,1': [{ numero: 20, conf: 'media' }],
    })
    render(
      <RevisionOCR
        grilla={grilla}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('I fila 1')
    expect(input.className).toContain('border-amber-500')
  })

  it('asigna clase border-red al input de confianza baja', () => {
    const grilla = grillaConCandidatos({
      '0,3': [{ numero: 50, conf: 'baja' }],
    })
    render(
      <RevisionOCR
        grilla={grilla}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('G fila 1')
    expect(input.className).toContain('border-red-500')
  })

  it('asigna borde gris punteado a inputs sin candidatos', () => {
    render(
      <RevisionOCR
        grilla={grillaConCandidatos()}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('B fila 1')
    expect(input.className).toMatch(/border-dashed/)
    expect(input).toHaveAttribute('data-confianza', 'ninguna')
  })

  it('muestra título "Confianza alta" en el tooltip del input', () => {
    const grilla = grillaConCandidatos({
      '0,0': [{ numero: 5, conf: 'alta' }],
    })
    render(
      <RevisionOCR
        grilla={grilla}
        numerosBase={cartonVacioPlantilla()}
        onGuardar={vi.fn()}
        onVolver={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('B fila 1')).toHaveAttribute('title', 'Confianza alta')
  })
})
