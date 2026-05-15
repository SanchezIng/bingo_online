import { describe, it, expect } from 'vitest'
import type { Carton } from '@/core/cartones/types'
import { casillasMarcadasDeCartonConNumeros } from './index'

// Cartón de prueba con números simples y predecibles
// B(col0): 1,2,3,4,5  I(col1): 16,17,18,19,20  N(col2): 31,32,FREE,34,35
// G(col3): 46,47,48,49,50  O(col4): 61,62,63,64,65
const cartonBase: Carton = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  serie: 'A',
  numeros: {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 34, 35],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

describe('casillasMarcadasDeCartonConNumeros', () => {
  it('con lista vacía solo la casilla FREE está marcada', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [])
    expect(marcadas.size).toBe(1)
    expect(marcadas.has('2,2')).toBe(true)
  })

  it('la casilla FREE (2,2) siempre está marcada independientemente de los sorteados', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [99])
    expect(marcadas.has('2,2')).toBe(true)
  })

  it('marca la casilla correcta cuando el número sorteado existe en columna B', () => {
    // B[0] = 1 → coordenada "0,0"
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [1])
    expect(marcadas.has('0,0')).toBe(true)
    expect(marcadas.size).toBe(2) // "0,0" + FREE
  })

  it('marca la casilla correcta en columna I', () => {
    // I[2] = 18 → coordenada "2,1"
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [18])
    expect(marcadas.has('2,1')).toBe(true)
  })

  it('marca la casilla correcta en columna G', () => {
    // G[4] = 50 → coordenada "4,3"
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [50])
    expect(marcadas.has('4,3')).toBe(true)
  })

  it('marca la casilla correcta en columna O', () => {
    // O[0] = 61 → coordenada "0,4"
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [61])
    expect(marcadas.has('0,4')).toBe(true)
  })

  it('marca múltiples casillas con múltiples números sorteados', () => {
    // 1 → "0,0", 17 → "1,1", 46 → "0,3"
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [1, 17, 46])
    expect(marcadas.has('0,0')).toBe(true)
    expect(marcadas.has('1,1')).toBe(true)
    expect(marcadas.has('0,3')).toBe(true)
    expect(marcadas.size).toBe(4) // 3 números + FREE
  })

  it('los números repetidos en la lista no duplican casillas', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [1, 1, 1])
    expect(marcadas.size).toBe(2) // "0,0" + FREE
  })

  it('un número que no está en el cartón no marca ninguna casilla extra', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [99])
    expect(marcadas.size).toBe(1) // solo FREE
  })

  it('con todos los números del cartón, las 25 casillas quedan marcadas', () => {
    const todosLosNumeros = [
      1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 34, 35, 46, 47, 48, 49, 50, 61, 62, 63, 64, 65,
    ]
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, todosLosNumeros)
    expect(marcadas.size).toBe(25)
  })

  it('las coordenadas devueltas tienen el formato correcto "fila,columna"', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [5])
    // B[4] = 5 → "4,0"
    expect(marcadas.has('4,0')).toBe(true)
    for (const coord of marcadas) {
      expect(coord).toMatch(/^\d,\d$/)
    }
  })

  it('N[0]=31 está en columna 2 fila 0 → "0,2"', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [31])
    expect(marcadas.has('0,2')).toBe(true)
  })

  it('N[4]=35 está en columna 2 fila 4 → "4,2"', () => {
    const marcadas = casillasMarcadasDeCartonConNumeros(cartonBase, [35])
    expect(marcadas.has('4,2')).toBe(true)
  })
})
