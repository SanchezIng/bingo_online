export type OcrErrorTipo = 'archivo_invalido' | 'procesamiento_fallido' | 'sin_texto'

export interface OcrError {
  tipo: OcrErrorTipo
  mensaje: string
}

export interface CandidatoOCR {
  numero: number
  confianza: 'alta' | 'media' | 'baja'
}

export interface CeldaDetectada {
  fila: number
  columna: number
  candidatos: CandidatoOCR[]
}

export interface GrillaDetectada {
  celdas: CeldaDetectada[]
}
