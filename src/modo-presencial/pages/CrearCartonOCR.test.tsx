import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CrearCartonOCR from './CrearCartonOCR'
import type { GrillaDetectada } from '@/core/ocr'
import type { NumerosCartonParcial } from '@/core/cartones'

const navigateMock = vi.fn()
const agregarCartonMock = vi.fn()

vi.mock('@/core/ocr', () => ({
  procesarImagenOCR: vi.fn(),
  estructurarEnGrilla: vi.fn(),
  consolidarCandidatos: vi.fn(),
}))

vi.mock('@/lib/stores/cartones', () => ({
  useCartonesStore: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

import { procesarImagenOCR, estructurarEnGrilla, consolidarCandidatos } from '@/core/ocr'
import { useCartonesStore } from '@/lib/stores/cartones'

function renderOCR() {
  return render(
    <MemoryRouter>
      <CrearCartonOCR />
    </MemoryRouter>,
  )
}

function crearImagenFake(nombre = 'carton.jpg', tipo = 'image/jpeg'): File {
  return new File(['fake-image-data'], nombre, { type: tipo })
}

function grillaVaciaFake(): GrillaDetectada {
  const celdas = []
  for (let fila = 0; fila < 5; fila++) {
    for (let columna = 0; columna < 5; columna++) {
      if (fila === 2 && columna === 2) continue
      celdas.push({ fila, columna, candidatos: [] })
    }
  }
  return { celdas }
}

function numerosBaseCompletoFake(): NumerosCartonParcial {
  return {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 33, 34],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  }
}

beforeEach(() => {
  vi.mocked(procesarImagenOCR).mockReset()
  vi.mocked(estructurarEnGrilla).mockReset()
  vi.mocked(consolidarCandidatos).mockReset()
  navigateMock.mockReset()
  agregarCartonMock.mockReset()

  vi.mocked(useCartonesStore).mockReturnValue({
    cartones: [],
    error: null,
    cargarCartones: vi.fn(),
    agregarCarton: agregarCartonMock,
    eliminarCarton: vi.fn(),
    editarCarton: vi.fn(),
  })
})

describe('CrearCartonOCR', () => {
  it('muestra el input de archivo al cargar', () => {
    renderOCR()
    expect(screen.getByLabelText('Seleccionar foto del cartón')).toBeInTheDocument()
  })

  it('muestra botón procesar solo tras seleccionar archivo', async () => {
    renderOCR()
    expect(screen.queryByText('Procesar OCR')).not.toBeInTheDocument()

    const input = screen.getByLabelText('Seleccionar foto del cartón')
    fireEvent.change(input, { target: { files: [crearImagenFake()] } })

    expect(screen.getByText('Procesar OCR')).toBeInTheDocument()
  })

  it('muestra barra de progreso al procesar', async () => {
    vi.mocked(procesarImagenOCR).mockImplementation(
      () => new Promise(() => {}), // nunca resuelve (simula procesando)
    )

    renderOCR()
    const input = screen.getByLabelText('Seleccionar foto del cartón')
    fireEvent.change(input, { target: { files: [crearImagenFake()] } })
    fireEvent.click(screen.getByText('Procesar OCR'))

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('Procesando imagen…')).toBeInTheDocument()
  })

  it('al terminar OCR exitoso pasa a la etapa de revisión', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '5 18 33',
        bloques: [
          { texto: '5', confianza: 95, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } },
          { texto: '18', confianza: 80, bbox: { x0: 30, y0: 0, x1: 60, y1: 20 } },
        ],
      },
    })
    vi.mocked(estructurarEnGrilla).mockReturnValue(grillaVaciaFake())
    vi.mocked(consolidarCandidatos).mockReturnValue(numerosBaseCompletoFake())

    renderOCR()
    fireEvent.change(screen.getByLabelText('Seleccionar foto del cartón'), {
      target: { files: [crearImagenFake()] },
    })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Guardar cartón/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Volver a tomar foto/i })).toBeInTheDocument()
    })
    expect(estructurarEnGrilla).toHaveBeenCalledOnce()
    expect(consolidarCandidatos).toHaveBeenCalledOnce()
  })

  it('muestra warning cuando la confianza promedio es < 30%', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '5',
        bloques: [
          { texto: '5', confianza: 20, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } },
          { texto: '8', confianza: 25, bbox: { x0: 30, y0: 0, x1: 60, y1: 20 } },
        ],
      },
    })
    vi.mocked(estructurarEnGrilla).mockReturnValue(grillaVaciaFake())
    vi.mocked(consolidarCandidatos).mockReturnValue(numerosBaseCompletoFake())

    renderOCR()
    fireEvent.change(screen.getByLabelText('Seleccionar foto del cartón'), {
      target: { files: [crearImagenFake()] },
    })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => {
      expect(screen.getByText(/Confianza baja en la detección/i)).toBeInTheDocument()
    })
  })

  it('no muestra warning si la confianza promedio es ≥ 30%', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '5',
        bloques: [{ texto: '5', confianza: 90, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } }],
      },
    })
    vi.mocked(estructurarEnGrilla).mockReturnValue(grillaVaciaFake())
    vi.mocked(consolidarCandidatos).mockReturnValue(numerosBaseCompletoFake())

    renderOCR()
    fireEvent.change(screen.getByLabelText('Seleccionar foto del cartón'), {
      target: { files: [crearImagenFake()] },
    })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => screen.getByRole('button', { name: /Guardar cartón/i }))
    expect(screen.queryByText(/Confianza baja en la detección/i)).not.toBeInTheDocument()
  })

  it('al guardar el cartón llama agregarCarton con fuente=ocr y navega a /cartones', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '',
        bloques: [{ texto: '5', confianza: 90, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } }],
      },
    })
    vi.mocked(estructurarEnGrilla).mockReturnValue(grillaVaciaFake())
    vi.mocked(consolidarCandidatos).mockReturnValue(numerosBaseCompletoFake())

    renderOCR()
    fireEvent.change(screen.getByLabelText('Seleccionar foto del cartón'), {
      target: { files: [crearImagenFake()] },
    })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => screen.getByRole('button', { name: /Guardar cartón/i }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cartón/i }))

    expect(agregarCartonMock).toHaveBeenCalledOnce()
    const carton = agregarCartonMock.mock.calls[0][0]
    expect(carton.fuente).toBe('ocr')
    expect(navigateMock).toHaveBeenCalledWith(
      '/cartones',
      expect.objectContaining({ state: expect.any(Object) }),
    )
  })

  it('al hacer click en "Volver a tomar foto" desde revisión, regresa a selección', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '',
        bloques: [{ texto: '5', confianza: 90, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } }],
      },
    })
    vi.mocked(estructurarEnGrilla).mockReturnValue(grillaVaciaFake())
    vi.mocked(consolidarCandidatos).mockReturnValue(numerosBaseCompletoFake())

    renderOCR()
    fireEvent.change(screen.getByLabelText('Seleccionar foto del cartón'), {
      target: { files: [crearImagenFake()] },
    })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => screen.getByRole('button', { name: /Volver a tomar foto/i }))
    fireEvent.click(screen.getByRole('button', { name: /Volver a tomar foto/i }))

    expect(screen.getByLabelText('Seleccionar foto del cartón')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar cartón/i })).not.toBeInTheDocument()
  })

  it('muestra mensaje de error cuando OCR falla', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: false,
      errors: { tipo: 'sin_texto', mensaje: 'No se detectó texto en la imagen.' },
    })

    renderOCR()
    const input = screen.getByLabelText('Seleccionar foto del cartón')
    fireEvent.change(input, { target: { files: [crearImagenFake()] } })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('No se detectó texto en la imagen.')).toBeInTheDocument()
    })
  })

  it('botón "Volver a intentar" desde error vuelve a estado inicial', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: false,
      errors: { tipo: 'procesamiento_fallido', mensaje: 'Error al procesar la imagen.' },
    })

    renderOCR()
    const input = screen.getByLabelText('Seleccionar foto del cartón')
    fireEvent.change(input, { target: { files: [crearImagenFake()] } })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => screen.getByText('Volver a intentar'))
    fireEvent.click(screen.getByText('Volver a intentar'))

    expect(screen.getByLabelText('Seleccionar foto del cartón')).toBeInTheDocument()
    expect(screen.queryByText('Procesar OCR')).not.toBeInTheDocument()
  })

  it('muestra link volver a /cartones', () => {
    renderOCR()
    expect(screen.getByText('← Mis cartones')).toBeInTheDocument()
  })
})
