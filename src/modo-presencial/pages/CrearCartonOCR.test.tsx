import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CrearCartonOCR from './CrearCartonOCR'

vi.mock('@/core/ocr', () => ({
  procesarImagenOCR: vi.fn(),
}))

import { procesarImagenOCR } from '@/core/ocr'

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

beforeEach(() => {
  vi.mocked(procesarImagenOCR).mockReset()
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

  it('muestra bloques detectados al tener resultado exitoso', async () => {
    vi.mocked(procesarImagenOCR).mockResolvedValue({
      ok: true,
      value: {
        texto: '5 18 33',
        bloques: [
          { texto: '5', confianza: 95, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } },
          { texto: '18', confianza: 80, bbox: { x0: 30, y0: 0, x1: 60, y1: 20 } },
          { texto: '33', confianza: 70, bbox: { x0: 70, y0: 0, x1: 100, y1: 20 } },
        ],
      },
    })

    renderOCR()
    const input = screen.getByLabelText('Seleccionar foto del cartón')
    fireEvent.change(input, { target: { files: [crearImagenFake()] } })
    fireEvent.click(screen.getByText('Procesar OCR'))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Se detectaron 3 número(s)')
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument()
      expect(screen.getByText('33')).toBeInTheDocument()
    })
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

  it('botón reintentar vuelve al estado inicial', async () => {
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
