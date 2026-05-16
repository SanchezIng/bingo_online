/**
 * Pre-procesamiento de imagen para mejorar la precisión del OCR.
 *
 * Separación intencional:
 * - Funciones puras que operan sobre Uint8ClampedArray (RGBA): testeables sin DOM.
 * - Wrappers de Canvas que orquestan el pipeline: thin glue, no testeados con jsdom
 *   (jsdom no implementa Canvas 2D).
 */

// =============================================================================
// Lógica pura sobre RGBA Uint8ClampedArray
// =============================================================================

/**
 * Convierte a grises (in-place) usando ponderación luminancia perceptual.
 * Cada pixel ocupa 4 bytes: R, G, B, A.
 */
export function aGrisesPixels(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gris = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = gris
    data[i + 1] = gris
    data[i + 2] = gris
  }
}

/**
 * Aplica contraste (in-place). factor > 1 aumenta contraste, < 1 lo reduce.
 * Asume canales R/G/B iguales (post-grayscale) pero igual procesa los 3.
 */
export function aplicarContrastePixels(data: Uint8ClampedArray, factor: number): void {
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = (data[i + c] - 128) * factor + 128
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v
    }
  }
}

/**
 * Histograma del canal R (asume grayscale en R=G=B). Retorna array de 256 bins.
 */
export function histograma(data: Uint8ClampedArray): number[] {
  const hist = new Array<number>(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]]++
  }
  return hist
}

/**
 * Calcula umbral óptimo según el método Otsu (maximiza varianza inter-clase).
 * Retorna umbral en [0, 255].
 */
export function calcularUmbralOtsu(hist: number[]): number {
  const total = hist.reduce((a, b) => a + b, 0)
  if (total === 0) return 127

  let sumTotal = 0
  for (let t = 0; t < 256; t++) sumTotal += t * hist[t]

  let sumB = 0
  let wB = 0
  let maxVar = -1
  let umbral = 0

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sumTotal - sumB) / wF
    const variance = wB * wF * (mB - mF) * (mB - mF)
    if (variance > maxVar) {
      maxVar = variance
      umbral = t
    }
  }
  return umbral
}

/**
 * Binariza (in-place): pixeles > umbral pasan a 255, los demás a 0.
 * Mantiene canales R=G=B. Se usa strict > (no >=) porque cuando Otsu cae
 * sobre un valor exacto presente en el cluster oscuro, ese valor pertenece
 * al fondo (0), no al texto (255).
 */
export function aplicarUmbralPixels(data: Uint8ClampedArray, umbral: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] > umbral ? 255 : 0
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
}

/**
 * Aplica un kernel sharpen 3×3 (no in-place: necesita el snapshot original).
 * Kernel: [[0,-1,0],[-1,5,-1],[0,-1,0]].
 *
 * Retorna nuevo Uint8ClampedArray con los píxeles modificados.
 * width/height en píxeles (no en bytes).
 */
export function aplicarSharpen(
  src: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length)
  // Copia los bordes (no se aplica convolución en bordes).
  dst.set(src)

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        let k = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const sIdx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += src[sIdx] * kernel[k++]
          }
        }
        dst[idx + c] = sum < 0 ? 0 : sum > 255 ? 255 : sum
      }
      dst[idx + 3] = src[idx + 3]
    }
  }
  return dst
}

// =============================================================================
// Wrappers de Canvas (thin glue, no testeados con jsdom)
// =============================================================================

/* v8 ignore start */

/**
 * Carga un File de imagen en un <canvas> del tamaño natural de la imagen.
 */
export async function imagenAImagenCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
      i.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D no disponible.')
    ctx.drawImage(img, 0, 0)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Pipeline de pre-procesamiento sobre un canvas:
 * grayscale → contraste → binarización Otsu.
 * (sharpen omitido por defecto: en celdas pequeñas amplifica ruido del JPEG.)
 *
 * Muta el canvas in-place y lo retorna por conveniencia.
 */
export function preprocesarCanvas(
  canvas: HTMLCanvasElement,
  contrasteFactor = 1.4,
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible.')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  aGrisesPixels(imageData.data)
  aplicarContrastePixels(imageData.data, contrasteFactor)
  const hist = histograma(imageData.data)
  const umbral = calcularUmbralOtsu(hist)
  aplicarUmbralPixels(imageData.data, umbral)

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Recorta una celda (fila, columna) de una grilla 5×5 equiespaciada
 * sobre el canvas fuente. Retorna un canvas nuevo con la celda.
 */
export function cropCelda(
  src: HTMLCanvasElement,
  fila: number,
  columna: number,
  filas = 5,
  columnas = 5,
): HTMLCanvasElement {
  const wCelda = Math.floor(src.width / columnas)
  const hCelda = Math.floor(src.height / filas)
  const x = columna * wCelda
  const y = fila * hCelda

  const dst = document.createElement('canvas')
  dst.width = wCelda
  dst.height = hCelda
  const ctx = dst.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible.')
  ctx.drawImage(src, x, y, wCelda, hCelda, 0, 0, wCelda, hCelda)
  return dst
}

/* v8 ignore stop */
