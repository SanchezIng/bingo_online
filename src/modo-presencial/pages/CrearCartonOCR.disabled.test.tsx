import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Este archivo cubre el comportamiento cuando FEATURES.ocr === false.
// La suite principal en CrearCartonOCR.test.tsx mockea ocr: true para
// validar el flujo OCR real.
vi.mock('@/config/features', () => ({ FEATURES: { ocr: false } }))

import CrearCartonOCR from './CrearCartonOCR'

describe('CrearCartonOCR (feature OFF)', () => {
  it('muestra banner de OCR deshabilitado en vez del flujo de captura', () => {
    render(
      <MemoryRouter>
        <CrearCartonOCR />
      </MemoryRouter>,
    )

    expect(screen.getByText(/OCR temporalmente deshabilitado/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Seleccionar foto del cartón')).not.toBeInTheDocument()
    expect(screen.queryByText('Procesar OCR')).not.toBeInTheDocument()
  })

  it('ofrece link a creación manual', () => {
    render(
      <MemoryRouter>
        <CrearCartonOCR />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Crear cartón manualmente/i })
    expect(link).toHaveAttribute('href', '/cartones/nuevo')
  })

  it('ofrece link de vuelta a /cartones', () => {
    render(
      <MemoryRouter>
        <CrearCartonOCR />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link', { name: /cartones/i })
    expect(links.some((l) => l.getAttribute('href') === '/cartones')).toBe(true)
  })
})
