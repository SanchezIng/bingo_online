import { createWorker } from 'tesseract.js'
import type { Result } from '@/core/cartones/types'
import type { CandidatoOCR, CeldaDetectada, GrillaDetectada, OcrError } from './types'
import { imagenAImagenCanvas, preprocesarCanvas, cropCelda } from './preprocess'

// Rangos válidos por columna del cartón B-I-N-G-O (B=col0, I=col1, ..., O=col4).
const RANGO_COLUMNA: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
]

function mapearConfianza(confianzaTesseract: number): CandidatoOCR['confianza'] {
  if (confianzaTesseract >= 80) return 'alta'
  if (confianzaTesseract >= 50) return 'media'
  return 'baja'
}

function progresoPorEtapa(
  etapa: 'preprocess' | 'init' | 'ocr-celda' | 'recognize-tess',
  detalle: number,
): number {
  switch (etapa) {
    case 'preprocess':
      return Math.round(detalle * 5) // 0-5
    case 'init':
      return 5 + Math.round(detalle * 10) // 5-15
    case 'recognize-tess':
      return 15 + Math.round(detalle * 80) // 15-95 (Tesseract progresses)
    case 'ocr-celda':
      // detalle = nº de celda procesada (1-24)
      return 15 + Math.round((detalle / 24) * 80)
  }
}

export async function procesarImagenOCR(
  file: File,
  onProgreso?: (progreso: number) => void,
): Promise<Result<GrillaDetectada, OcrError>> {
  if (!file.type.startsWith('image/')) {
    return {
      ok: false,
      errors: { tipo: 'archivo_invalido', mensaje: 'El archivo debe ser una imagen.' },
    }
  }

  let canvas: HTMLCanvasElement
  try {
    onProgreso?.(progresoPorEtapa('preprocess', 0))
    canvas = await imagenAImagenCanvas(file)
    preprocesarCanvas(canvas)
    onProgreso?.(progresoPorEtapa('preprocess', 1))
  } catch (error) {
    return {
      ok: false,
      errors: {
        tipo: 'archivo_invalido',
        mensaje:
          error instanceof Error
            ? `No se pudo procesar la imagen: ${error.message}`
            : 'No se pudo procesar la imagen.',
      },
    }
  }

  let worker
  try {
    onProgreso?.(progresoPorEtapa('init', 0))
    worker = await createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract-core',
      logger: (m) => {
        if (!onProgreso) return
        if (m.status === 'loading tesseract core') {
          onProgreso(progresoPorEtapa('init', m.progress * 0.3))
        } else if (m.status === 'loading language traineddata') {
          onProgreso(progresoPorEtapa('init', 0.3 + m.progress * 0.7))
        }
      },
    })
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: '8' as never, // PSM 8 = treat the image as a single word
    })
    onProgreso?.(progresoPorEtapa('init', 1))
  } catch (error) {
    return {
      ok: false,
      errors: {
        tipo: 'procesamiento_fallido',
        mensaje:
          error instanceof Error
            ? `No se pudo iniciar el OCR: ${error.message}`
            : 'No se pudo iniciar el OCR.',
      },
    }
  }

  try {
    const celdas: CeldaDetectada[] = []
    let procesadas = 0

    for (let fila = 0; fila < 5; fila++) {
      for (let columna = 0; columna < 5; columna++) {
        if (fila === 2 && columna === 2) continue // FREE

        const celdaCanvas = cropCelda(canvas, fila, columna)
        const { data } = await worker.recognize(celdaCanvas)

        const candidatos: CandidatoOCR[] = []
        const textoLimpio = data.text.trim()
        const numero = parseInt(textoLimpio, 10)

        if (!isNaN(numero) && numero >= 1 && numero <= 75) {
          let confianza = mapearConfianza(data.confidence)
          const [min, max] = RANGO_COLUMNA[columna]
          if (numero < min || numero > max) {
            confianza = 'baja'
          }
          candidatos.push({ numero, confianza })
        }

        celdas.push({ fila, columna, candidatos })
        procesadas++
        onProgreso?.(progresoPorEtapa('ocr-celda', procesadas))
      }
    }

    onProgreso?.(100)
    return { ok: true, value: { celdas } }
  } catch (error) {
    return {
      ok: false,
      errors: {
        tipo: 'procesamiento_fallido',
        mensaje: error instanceof Error ? error.message : 'Error al procesar la imagen.',
      },
    }
  } finally {
    await worker.terminate()
  }
}
