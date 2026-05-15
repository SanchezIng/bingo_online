import { v4 as uuidv4 } from 'uuid'
import type { Carton, NumerosCarton, NumerosCartonParcial, Result } from './types'
import { validarNumerosCarton } from './validacion'

function numerosAleatoriosSinRepetir(min: number, max: number, cantidad: number): number[] {
  const disponibles = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const resultado: number[] = []
  for (let i = 0; i < cantidad; i++) {
    const indice = Math.floor(Math.random() * disponibles.length)
    resultado.push(disponibles[indice])
    disponibles.splice(indice, 1)
  }
  return resultado
}

export function crearCartonAleatorio(): Carton {
  const [b1, b2, b3, b4, b5] = numerosAleatoriosSinRepetir(1, 15, 5)
  const [i1, i2, i3, i4, i5] = numerosAleatoriosSinRepetir(16, 30, 5)
  const [n1, n2, n3, n4] = numerosAleatoriosSinRepetir(31, 45, 4)
  const [g1, g2, g3, g4, g5] = numerosAleatoriosSinRepetir(46, 60, 5)
  const [o1, o2, o3, o4, o5] = numerosAleatoriosSinRepetir(61, 75, 5)

  const numeros: NumerosCarton = {
    B: [b1, b2, b3, b4, b5],
    I: [i1, i2, i3, i4, i5],
    N: [n1, n2, 'FREE', n3, n4],
    G: [g1, g2, g3, g4, g5],
    O: [o1, o2, o3, o4, o5],
  }

  return {
    id: uuidv4(),
    serie: '',
    numeros,
    creadoEn: new Date().toISOString(),
    fuente: 'aleatorio',
  }
}

export interface OpcionesCarton {
  serie?: string
  fuente?: Carton['fuente']
}

export function crearCartonDesdeNumeros(
  numeros: unknown,
  opciones: OpcionesCarton = {},
): Result<Carton, string[]> {
  const validacion = validarNumerosCarton(numeros)
  if (!validacion.ok) {
    return validacion
  }
  return {
    ok: true,
    value: {
      id: uuidv4(),
      serie: opciones.serie ?? '',
      numeros: validacion.value,
      creadoEn: new Date().toISOString(),
      fuente: opciones.fuente ?? 'manual',
    },
  }
}

export function cartonVacioPlantilla(): NumerosCartonParcial {
  return {
    B: [null, null, null, null, null],
    I: [null, null, null, null, null],
    N: [null, null, 'FREE', null, null],
    G: [null, null, null, null, null],
    O: [null, null, null, null, null],
  }
}
