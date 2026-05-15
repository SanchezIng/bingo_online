export { procesarImagenOCR } from './tesseract'
export { estructurarEnGrilla, consolidarCandidatos } from './post-process'
export type {
  ResultadoOCRBruto,
  BloqueOCR,
  BboxOCR,
  OcrError,
  OcrErrorTipo,
  GrillaDetectada,
  CeldaDetectada,
  CandidatoOCR,
} from './types'
