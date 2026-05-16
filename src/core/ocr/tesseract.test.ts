import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de tesseract.js — el worker real requiere WASM y red; no se usa en tests unitarios
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}))

// Mock de preprocess — jsdom no implementa Canvas 2D; los wrappers se prueban manualmente
vi.mock('./preprocess', () => ({
  imagenAImagenCanvas: vi.fn(async () => ({ width: 500, height: 500 }) as never),
  preprocesarCanvas: vi.fn((c) => c),
  cropCelda: vi.fn(() => ({ width: 100, height: 100 }) as never),
}))

import { createWorker } from 'tesseract.js'
import { procesarImagenOCR } from './tesseract'

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

function mockRecognize(text: string, confidence: number) {
  return Promise.resolve({ data: { text, confidence } })
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

  it('crea worker con workerPath y corePath locales', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('', 0))
    await procesarImagenOCR(crearImagenFake())
    expect(createWorker).toHaveBeenCalledWith(
      'eng',
      1,
      expect.objectContaining({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract-core',
      }),
    )
  })

  it('configura whitelist de dígitos y PSM 8 antes de reconocer', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('', 0))
    await procesarImagenOCR(crearImagenFake())
    expect(mockWorker.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '8',
      }),
    )
  })

  it('retorna GrillaDetectada con 24 celdas (excluye FREE)', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('7', 90))
    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.celdas).toHaveLength(24)
      // Ninguna celda es (2,2) FREE
      for (const c of result.value.celdas) {
        expect(!(c.fila === 2 && c.columna === 2)).toBe(true)
      }
    }
  })

  it('asigna candidato con confianza alta cuando el número está en rango de la columna', async () => {
    // recognize devuelve "7" en cada celda. Solo en B (col 0, rango 1-15) es válido.
    mockWorker.recognize.mockImplementation(() => mockRecognize('7', 95))
    const result = await procesarImagenOCR(crearImagenFake())
    if (!result.ok) throw new Error('expected ok')

    const celdaB0 = result.value.celdas.find((c) => c.columna === 0 && c.fila === 0)!
    expect(celdaB0.candidatos).toHaveLength(1)
    expect(celdaB0.candidatos[0].numero).toBe(7)
    expect(celdaB0.candidatos[0].confianza).toBe('alta')
  })

  it('marca confianza baja cuando el número cae fuera del rango de la columna', async () => {
    // recognize devuelve "7" para todas — pero 7 no es válido en I (16-30), N, G, O.
    mockWorker.recognize.mockImplementation(() => mockRecognize('7', 95))
    const result = await procesarImagenOCR(crearImagenFake())
    if (!result.ok) throw new Error('expected ok')

    const celdaI0 = result.value.celdas.find((c) => c.columna === 1 && c.fila === 0)!
    expect(celdaI0.candidatos[0].confianza).toBe('baja')
  })

  it('celdas sin texto numérico quedan con candidatos vacío', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('', 0))
    const result = await procesarImagenOCR(crearImagenFake())
    if (!result.ok) throw new Error('expected ok')
    for (const c of result.value.celdas) {
      expect(c.candidatos).toHaveLength(0)
    }
  })

  it('descarta números fuera de [1, 75] (parsea texto basura)', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('999', 80))
    const result = await procesarImagenOCR(crearImagenFake())
    if (!result.ok) throw new Error('expected ok')
    for (const c of result.value.celdas) {
      expect(c.candidatos).toHaveLength(0)
    }
  })

  it('llama terminate() aunque el reconocimiento falle', async () => {
    mockWorker.recognize.mockRejectedValue(new Error('WASM error'))
    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.tipo).toBe('procesamiento_fallido')
    }
    expect(mockWorker.terminate).toHaveBeenCalled()
  })

  it('reporta error de inicialización cuando createWorker falla', async () => {
    vi.mocked(createWorker).mockRejectedValueOnce(new Error('No se descargó el modelo'))
    const result = await procesarImagenOCR(crearImagenFake())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.tipo).toBe('procesamiento_fallido')
      expect(result.errors.mensaje).toMatch(/No se pudo iniciar el OCR/)
    }
  })

  it('progreso avanza monotónicamente desde preprocess hasta 100', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('3', 85))
    const capturado: number[] = []
    await procesarImagenOCR(crearImagenFake(), (p) => capturado.push(p))

    expect(capturado.length).toBeGreaterThan(0)
    expect(capturado[capturado.length - 1]).toBe(100)
    // No retrocede
    for (let i = 1; i < capturado.length; i++) {
      expect(capturado[i]).toBeGreaterThanOrEqual(capturado[i - 1])
    }
  })

  it('hace recognize una vez por celda (24 veces, sin la FREE)', async () => {
    mockWorker.recognize.mockImplementation(() => mockRecognize('', 0))
    await procesarImagenOCR(crearImagenFake())
    expect(mockWorker.recognize).toHaveBeenCalledTimes(24)
  })
})
