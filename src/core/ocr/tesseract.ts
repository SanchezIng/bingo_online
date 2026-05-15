import { createWorker } from 'tesseract.js'
import type { Result } from '@/core/cartones/types'
import type { ResultadoOCRBruto, OcrError } from './types'

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

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (onProgreso && m.status === 'recognizing text') {
        onProgreso(Math.round(m.progress * 100))
      }
    },
  })

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
