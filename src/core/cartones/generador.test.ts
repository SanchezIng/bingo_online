import { describe, it, expect } from 'vitest'
import {
  crearCartonAleatorio,
  crearCartonDesdeNumeros,
  cartonVacioPlantilla,
  validarNumerosCarton,
} from './index'
import type { NumerosCarton } from './index'

const numerosValidos: NumerosCarton = {
  B: [3, 7, 11, 14, 15],
  I: [17, 21, 26, 29, 30],
  N: [32, 36, 'FREE', 41, 44],
  G: [47, 51, 56, 59, 60],
  O: [62, 66, 71, 73, 75],
}

describe('crearCartonAleatorio', () => {
  it('genera un cartón con estructura válida', () => {
    const carton = crearCartonAleatorio()
    expect(carton).toHaveProperty('id')
    expect(carton).toHaveProperty('numeros')
    expect(carton).toHaveProperty('creadoEn')
    expect(carton.fuente).toBe('aleatorio')
    expect(carton.serie).toBe('')
  })

  it('genera cartones con id UUID único', () => {
    const ids = new Set(Array.from({ length: 50 }, () => crearCartonAleatorio().id))
    expect(ids.size).toBe(50)
  })

  it('genera cartones con creadoEn como ISO 8601 válido', () => {
    const carton = crearCartonAleatorio()
    expect(() => new Date(carton.creadoEn)).not.toThrow()
    expect(new Date(carton.creadoEn).toISOString()).toBe(carton.creadoEn)
  })

  it('el centro (N[2]) siempre es FREE', () => {
    for (let i = 0; i < 20; i++) {
      const carton = crearCartonAleatorio()
      expect(carton.numeros.N[2]).toBe('FREE')
    }
  })

  it('todos los números de B están en rango 1-15', () => {
    for (let i = 0; i < 20; i++) {
      const { B } = crearCartonAleatorio().numeros
      B.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(15)
      })
    }
  })

  it('todos los números de I están en rango 16-30', () => {
    for (let i = 0; i < 20; i++) {
      const { I } = crearCartonAleatorio().numeros
      I.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(16)
        expect(n).toBeLessThanOrEqual(30)
      })
    }
  })

  it('los números de N (excluyendo FREE) están en rango 31-45', () => {
    for (let i = 0; i < 20; i++) {
      const { N } = crearCartonAleatorio().numeros
      ;[N[0], N[1], N[3], N[4]].forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(31)
        expect(n).toBeLessThanOrEqual(45)
      })
    }
  })

  it('todos los números de G están en rango 46-60', () => {
    for (let i = 0; i < 20; i++) {
      const { G } = crearCartonAleatorio().numeros
      G.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(46)
        expect(n).toBeLessThanOrEqual(60)
      })
    }
  })

  it('todos los números de O están en rango 61-75', () => {
    for (let i = 0; i < 20; i++) {
      const { O } = crearCartonAleatorio().numeros
      O.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(61)
        expect(n).toBeLessThanOrEqual(75)
      })
    }
  })

  it('no hay duplicados dentro de una columna', () => {
    for (let i = 0; i < 20; i++) {
      const { B, I, G, O } = crearCartonAleatorio().numeros
      expect(new Set(B).size).toBe(5)
      expect(new Set(I).size).toBe(5)
      expect(new Set(G).size).toBe(5)
      expect(new Set(O).size).toBe(5)
    }
  })

  it('no hay duplicados en la columna N (los 4 números)', () => {
    for (let i = 0; i < 20; i++) {
      const { N } = crearCartonAleatorio().numeros
      const numerosN = [N[0], N[1], N[3], N[4]]
      expect(new Set(numerosN).size).toBe(4)
    }
  })

  it('100 cartones generados son todos válidos según validarNumerosCarton', () => {
    for (let i = 0; i < 100; i++) {
      const carton = crearCartonAleatorio()
      const resultado = validarNumerosCarton(carton.numeros)
      expect(resultado.ok).toBe(true)
    }
  })

  it('100 cartones generados tienen ids distintos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => crearCartonAleatorio().id))
    expect(ids.size).toBe(100)
  })
})

describe('crearCartonDesdeNumeros', () => {
  it('crea un cartón válido desde números correctos', () => {
    const resultado = crearCartonDesdeNumeros(numerosValidos)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.value.fuente).toBe('manual')
      expect(resultado.value.serie).toBe('')
      expect(resultado.value.id).toBeTruthy()
    }
  })

  it('aplica opciones de serie y fuente', () => {
    const resultado = crearCartonDesdeNumeros(numerosValidos, {
      serie: 'Cartón-A',
      fuente: 'importado',
    })
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.value.serie).toBe('Cartón-A')
      expect(resultado.value.fuente).toBe('importado')
    }
  })

  it('retorna error con números inválidos', () => {
    const resultado = crearCartonDesdeNumeros({ ...numerosValidos, B: [0, 7, 11, 14, 15] })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.errors.length).toBeGreaterThan(0)
    }
  })

  it('retorna error con duplicados', () => {
    const resultado = crearCartonDesdeNumeros({ ...numerosValidos, B: [3, 3, 11, 14, 15] })
    expect(resultado.ok).toBe(false)
  })

  it('retorna error con input null', () => {
    const resultado = crearCartonDesdeNumeros(null)
    expect(resultado.ok).toBe(false)
  })

  it('genera ids únicos para cada cartón creado', () => {
    const ids = new Set(
      Array.from({ length: 20 }, () => {
        const r = crearCartonDesdeNumeros(numerosValidos)
        return r.ok ? r.value.id : null
      }),
    )
    expect(ids.size).toBe(20)
  })

  it('asigna creadoEn como ISO 8601 válido', () => {
    const resultado = crearCartonDesdeNumeros(numerosValidos)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(new Date(resultado.value.creadoEn).toISOString()).toBe(resultado.value.creadoEn)
    }
  })
})

describe('cartonVacioPlantilla', () => {
  it('retorna estructura con nulls en casillas normales', () => {
    const plantilla = cartonVacioPlantilla()
    expect(plantilla.B).toEqual([null, null, null, null, null])
    expect(plantilla.I).toEqual([null, null, null, null, null])
    expect(plantilla.G).toEqual([null, null, null, null, null])
    expect(plantilla.O).toEqual([null, null, null, null, null])
  })

  it('el centro N[2] es FREE en la plantilla', () => {
    const plantilla = cartonVacioPlantilla()
    expect(plantilla.N[2]).toBe('FREE')
    expect(plantilla.N[0]).toBeNull()
    expect(plantilla.N[1]).toBeNull()
    expect(plantilla.N[3]).toBeNull()
    expect(plantilla.N[4]).toBeNull()
  })

  it('retorna un objeto nuevo cada vez (no referencia compartida)', () => {
    const p1 = cartonVacioPlantilla()
    const p2 = cartonVacioPlantilla()
    p1.B[0] = 5
    expect(p2.B[0]).toBeNull()
  })
})
