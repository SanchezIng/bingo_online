import { describe, it, expect, vi, beforeEach } from 'vitest'
import { procesarImagenOCR } from './tesseract'

// Mock de tesseract.js — el worker real requiere WASM y red; no se usa en tests unitarios
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}))

import { createWorker } from 'tesseract.js'

const mockWorker = {
  setParameters: vi.fn().mockResolvedValue({}),
  recognize: vi.fn(),
  terminate: vi.fn().mockResolvedValue({}),
}

beforeEach(() => {
  vi.mocked(createWorker).mockResolvedValue(mockWorker as never)
  mockWorker.setParameters.mockClear()
  mockWorker.recognize.mockClear()
  mockWorker.terminate.mockClear()
})

function crearImagenFake(tipo = 'image/jpeg'): File {
  return new File(['fake'], 'carton.jpg', { type: tipo })
}

describe('procesarImagenOCR', () => {
  it('rechaza archivo que no es imagen', async () => {
    const pdf = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    const result = await procesarImagenOCR(pdf)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.tipo).toBe('archivo_invalido')
    }
  })

  it('no crea worker para archivos no-imagen', async () => {
    const pdf = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    await procesarImagenOCR(pdf)
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('retorna texto y bloques cuando Tesseract tiene éxito', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: {
        text: '5 18 33',
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  {
                    words: [
                      { text: '5', confidence: 95, bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } },
                      { text: '18', confidence: 80, bbox: { x0: 30, y0: 0, x1: 60, y1: 20 } },
                      { text: '33', confidence: 70, bbox: { x0: 70, y0: 0, x1: 100, y1: 20 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.texto).toBe('5 18 33')
      expect(result.value.bloques).toHaveLength(3)
      expect(result.value.bloques[0].texto).toBe('5')
      expect(result.value.bloques[0].confianza).toBe(95)
      expect(result.value.bloques[1].texto).toBe('18')
    }
  })

  it('configura whitelist de solo dígitos', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: { text: '7', blocks: null },
    })
    await procesarImagenOCR(crearImagenFake())
    expect(mockWorker.setParameters).toHaveBeenCalledWith({
      tessedit_char_whitelist: '0123456789',
    })
  })

  it('llama terminate() aunque reconocimiento falle', async () => {
    mockWorker.recognize.mockRejectedValue(new Error('WASM error'))
    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.tipo).toBe('procesamiento_fallido')
    }
    expect(mockWorker.terminate).toHaveBeenCalled()
  })

  it('retorna error sin_texto cuando no hay texto ni bloques', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: { text: '   ', blocks: null },
    })
    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.tipo).toBe('sin_texto')
    }
  })

  it('ignora palabras con texto vacío en los bloques', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: {
        text: '42',
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  {
                    words: [
                      { text: '', confidence: 10, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } },
                      { text: '42', confidence: 88, bbox: { x0: 20, y0: 0, x1: 50, y1: 20 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.bloques).toHaveLength(1)
      expect(result.value.bloques[0].texto).toBe('42')
    }
  })

  it('mapea el progreso de Tesseract por etapas a un porcentaje 0-100 monotónico', async () => {
    let loggerCb: ((m: { status: string; progress: number }) => void) | undefined

    vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options) => {
      loggerCb = (options as { logger?: (m: unknown) => void }).logger as typeof loggerCb
      // Dispara etapas previas al recognize para verificar que el progreso no queda en 0.
      loggerCb?.({ status: 'loading tesseract core', progress: 1 })
      loggerCb?.({ status: 'loading language traineddata', progress: 0.5 })
      return mockWorker as never
    })

    mockWorker.recognize.mockImplementation(async () => {
      loggerCb?.({ status: 'recognizing text', progress: 0 })
      loggerCb?.({ status: 'recognizing text', progress: 1 })
      return { data: { text: '1', blocks: null } }
    })

    const progresoCaptured: number[] = []
    await procesarImagenOCR(crearImagenFake(), (p) => progresoCaptured.push(p))

    // Las etapas previas avanzan el progreso (no queda en 0 durante la descarga).
    expect(progresoCaptured.some((p) => p > 0 && p < 55)).toBe(true)
    // recognize llega a 100 al final.
    expect(progresoCaptured[progresoCaptured.length - 1]).toBe(100)
    // Monotónicamente no decreciente.
    for (let i = 1; i < progresoCaptured.length; i++) {
      expect(progresoCaptured[i]).toBeGreaterThanOrEqual(progresoCaptured[i - 1])
    }
  })
})
