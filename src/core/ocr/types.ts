export interface BboxOCR {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface BloqueOCR {
  texto: string
  confianza: number
  bbox: BboxOCR
}

export interface ResultadoOCRBruto {
  texto: string
  bloques: BloqueOCR[]
}

export type OcrErrorTipo = 'archivo_invalido' | 'procesamiento_fallido' | 'sin_texto'

export interface OcrError {
  tipo: OcrErrorTipo
  mensaje: string
}
