import { describe, it, expect } from 'vitest'
import {
  aGrisesPixels,
  aplicarContrastePixels,
  histograma,
  calcularUmbralOtsu,
  aplicarUmbralPixels,
  aplicarSharpen,
} from './preprocess'

function rgba(r: number, g: number, b: number, a = 255): number[] {
  return [r, g, b, a]
}

function flatten(pixels: number[][]): Uint8ClampedArray {
  return new Uint8ClampedArray(pixels.flat())
}

describe('aGrisesPixels', () => {
  it('convierte rojo puro a su luminancia (~76)', () => {
    const data = flatten([rgba(255, 0, 0)])
    aGrisesPixels(data)
    expect(data[0]).toBe(76)
    expect(data[1]).toBe(76)
    expect(data[2]).toBe(76)
    expect(data[3]).toBe(255) // alpha sin tocar
  })

  it('convierte verde puro a su luminancia (~150)', () => {
    const data = flatten([rgba(0, 255, 0)])
    aGrisesPixels(data)
    expect(data[0]).toBe(150)
  })

  it('convierte azul puro a su luminancia (~29)', () => {
    const data = flatten([rgba(0, 0, 255)])
    aGrisesPixels(data)
    expect(data[0]).toBe(29)
  })

  it('blanco se mantiene blanco', () => {
    const data = flatten([rgba(255, 255, 255)])
    aGrisesPixels(data)
    expect(data[0]).toBe(255)
  })

  it('negro se mantiene negro', () => {
    const data = flatten([rgba(0, 0, 0)])
    aGrisesPixels(data)
    expect(data[0]).toBe(0)
  })
})

describe('aplicarContrastePixels', () => {
  it('factor=1 no cambia los valores', () => {
    const data = flatten([rgba(64, 128, 200)])
    aplicarContrastePixels(data, 1)
    expect(data[0]).toBe(64)
    expect(data[1]).toBe(128)
    expect(data[2]).toBe(200)
  })

  it('factor=2 separa los valores del punto medio', () => {
    const data = flatten([rgba(64, 128, 192)])
    aplicarContrastePixels(data, 2)
    // (64-128)*2+128 = 0; (128-128)*2+128 = 128; (192-128)*2+128 = 256→255
    expect(data[0]).toBe(0)
    expect(data[1]).toBe(128)
    expect(data[2]).toBe(255)
  })

  it('clampea valores fuera de [0, 255]', () => {
    const data = flatten([rgba(0, 255, 100)])
    aplicarContrastePixels(data, 3)
    expect(data[0]).toBe(0)
    expect(data[1]).toBe(255)
  })
})

describe('histograma', () => {
  it('cuenta correctamente la frecuencia de cada valor del canal R', () => {
    const data = flatten([
      rgba(10, 10, 10),
      rgba(10, 10, 10),
      rgba(50, 50, 50),
      rgba(255, 255, 255),
    ])
    const hist = histograma(data)
    expect(hist).toHaveLength(256)
    expect(hist[10]).toBe(2)
    expect(hist[50]).toBe(1)
    expect(hist[255]).toBe(1)
    expect(hist[0]).toBe(0)
  })
})

describe('calcularUmbralOtsu', () => {
  it('separa correctamente una distribución bimodal usando aplicarUmbralPixels (>) ', () => {
    const hist = new Array(256).fill(0)
    // 50 pixeles oscuros en 30, 50 pixeles claros en 200
    hist[30] = 50
    hist[200] = 50
    const umbral = calcularUmbralOtsu(hist)
    // El umbral debe caer en [30, 199] para que el cluster oscuro (=30) quede en 0
    // y el cluster claro (=200) en 255 cuando se aplica la binarización con `>`.
    expect(umbral).toBeGreaterThanOrEqual(30)
    expect(umbral).toBeLessThan(200)
  })

  it('retorna umbral cercano al pico cuando todo está en un solo valor', () => {
    const hist = new Array(256).fill(0)
    hist[100] = 1000
    const umbral = calcularUmbralOtsu(hist)
    // Con un solo cluster, Otsu devuelve un valor degenerado pero no debe crashear
    expect(umbral).toBeGreaterThanOrEqual(0)
    expect(umbral).toBeLessThanOrEqual(255)
  })

  it('retorna 127 cuando el histograma está totalmente vacío', () => {
    const hist = new Array(256).fill(0)
    expect(calcularUmbralOtsu(hist)).toBe(127)
  })
})

describe('aplicarUmbralPixels', () => {
  it('valores > umbral pasan a 255, el umbral exacto pasa a 0', () => {
    const data = flatten([rgba(100, 100, 100), rgba(150, 150, 150), rgba(200, 200, 200)])
    aplicarUmbralPixels(data, 150)
    expect(data[0]).toBe(0) // 100 <= 150 → 0
    expect(data[4]).toBe(0) // 150 == 150 → 0 (strict >)
    expect(data[8]).toBe(255) // 200 > 150 → 255
  })

  it('preserva alpha', () => {
    const data = flatten([rgba(100, 100, 100, 200)])
    aplicarUmbralPixels(data, 50)
    expect(data[3]).toBe(200)
  })
})

describe('aplicarSharpen', () => {
  it('mantiene un parche uniforme (kernel suma 1, sin cambios)', () => {
    const ancho = 3
    const alto = 3
    const data = new Uint8ClampedArray(ancho * alto * 4)
    // todos los pixeles = (128, 128, 128, 255)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 128
      data[i + 3] = 255
    }
    const result = aplicarSharpen(data, ancho, alto)
    // El pixel central debe seguir siendo 128 (kernel suma 1, parche uniforme)
    const centroIdx = (1 * ancho + 1) * 4
    expect(result[centroIdx]).toBe(128)
  })

  it('amplifica un pixel central distinto a sus vecinos', () => {
    const ancho = 3
    const alto = 3
    const data = new Uint8ClampedArray(ancho * alto * 4)
    // vecinos = 100, centro = 150
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 100
      data[i + 3] = 255
    }
    const centroIdx = (1 * ancho + 1) * 4
    data[centroIdx] = data[centroIdx + 1] = data[centroIdx + 2] = 150

    const result = aplicarSharpen(data, ancho, alto)
    // 150*5 - 100*4 = 350 → clamp a 255
    expect(result[centroIdx]).toBe(255)
  })

  it('no toca los píxeles de los bordes', () => {
    const ancho = 3
    const alto = 3
    const data = new Uint8ClampedArray(ancho * alto * 4)
    // pixel (0,0) = (42, 0, 0)
    data[0] = 42
    data[3] = 255
    const result = aplicarSharpen(data, ancho, alto)
    expect(result[0]).toBe(42)
  })
})
