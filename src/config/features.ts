/**
 * Feature flags del proyecto.
 *
 * Convención: módulo único con constantes booleanas. No usa env vars para
 * que el estado quede explícito en el código y revisable en code review.
 *
 * Para activar/desactivar un feature, edita este archivo y haz commit.
 */

export const FEATURES = {
  /**
   * OCR de cartones desde foto. Pausado en v1 tras pruebas reales:
   * la precisión con frontend-only (Tesseract.js + preprocesado Canvas)
   * no alcanza la meta de ≥70% acierto por casilla en fotos de celular
   * con perspectiva o iluminación variable.
   *
   * Ver `docs/adr/0004-ocr-pausado-v1.md` para alternativas futuras
   * (Google Vision, Gemini Vision, AWS Textract, modelo fine-tuned).
   *
   * Cuando se rehabilite (con backend OCR o calibración manual), poner
   * a true. Los tests del módulo `core/ocr/` siguen ejecutándose y cubren
   * el flujo, así que el código no se descompone mientras está pausado.
   */
  ocr: false,
} as const
