import { createWorker } from 'tesseract.js'
import type { Result } from '@/core/cartones/types'
import type { ResultadoOCRBruto, OcrError } from './types'

// Pesos relativos por etapa para construir un progreso 0-100 coherente.
// El logger de Tesseract emite muchos status; sin ponderarlos, el usuario
// vería "0%" durante toda la descarga del modelo (~10 MB) y luego un salto.
const PESO_ETAPA: Record<string, [number, number]> = {
  'loading tesseract core': [0, 10],
  'initializing tesseract': [10, 15],
  'loading language traineddata': [15, 50],
  'initializing api': [50, 55],
  'recognizing text': [55, 100],
}

function progresoCombinado(status: string, progreso: number): number | null {
  const rango = PESO_ETAPA[status]
  if (!rango) return null
  const [min, max] = rango
  return Math.round(min + progreso * (max - min))
}

export async function procesarImagenOCR(
  file: File,
  onProgreso?: (progreso: number) => void,
): Promise<Result<ResultadoOCRBruto, OcrError>> {
  if (!file.type.startsWith('image/')) {
    return {
      ok: false,
      errors: { tipo: 'archivo_invalido', mensaje: 'El archivo debe ser una imagen.' },
    }
  }

  let worker
  try {
    worker = await createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract-core',
      logger: (m) => {
        if (!onProgreso) return
        const pct = progresoCombinado(m.status, m.progress)
        if (pct !== null) onProgreso(pct)
      },
    })
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
    await worker.setParameters({ tessedit_char_whitelist: '0123456789' })

    const { data } = await worker.recognize(file)

    // Extraer palabras individuales (cada número del cartón es una word)
    const bloques: ResultadoOCRBruto['bloques'] = []
    if (data.blocks) {
      for (const block of data.blocks) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            for (const word of line.words) {
              const texto = word.text.trim()
              if (texto) {
                bloques.push({ texto, confianza: word.confidence, bbox: word.bbox })
              }
            }
          }
        }
      }
    }

    if (!data.text.trim() && bloques.length === 0) {
      return {
        ok: false,
        errors: { tipo: 'sin_texto', mensaje: 'No se detectó texto en la imagen.' },
      }
    }

    return { ok: true, value: { texto: data.text, bloques } }
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
