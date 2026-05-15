import { z } from 'zod'
import type { Carton, NumerosCarton, Result } from './types'

const rangoB = z.number().int().min(1).max(15)
const rangoI = z.number().int().min(16).max(30)
const rangoN = z.number().int().min(31).max(45)
const rangoG = z.number().int().min(46).max(60)
const rangoO = z.number().int().min(61).max(75)

const columnaBSchema = z.tuple([rangoB, rangoB, rangoB, rangoB, rangoB])
const columnaISchema = z.tuple([rangoI, rangoI, rangoI, rangoI, rangoI])
const columnaNSchema = z.tuple([rangoN, rangoN, z.literal('FREE'), rangoN, rangoN])
const columnaGSchema = z.tuple([rangoG, rangoG, rangoG, rangoG, rangoG])
const columnaOSchema = z.tuple([rangoO, rangoO, rangoO, rangoO, rangoO])

const numerosCartonSchema = z.object({
  B: columnaBSchema,
  I: columnaISchema,
  N: columnaNSchema,
  G: columnaGSchema,
  O: columnaOSchema,
})

const cartonSchema = z.object({
  id: z.string().uuid(),
  serie: z.string(),
  numeros: numerosCartonSchema,
  creadoEn: z.string().datetime(),
  fuente: z.enum(['manual', 'ocr', 'aleatorio', 'importado']),
})

function extraerNumerosDelCarton(numeros: NumerosCarton): number[] {
  return [
    ...numeros.B,
    ...numeros.I,
    numeros.N[0],
    numeros.N[1],
    numeros.N[3],
    numeros.N[4],
    ...numeros.G,
    ...numeros.O,
  ]
}

function tieneDuplicados(numeros: NumerosCarton): boolean {
  const valores = extraerNumerosDelCarton(numeros)
  return new Set(valores).size !== valores.length
}

export function validarNumerosCarton(input: unknown): Result<NumerosCarton, string[]> {
  const resultado = numerosCartonSchema.safeParse(input)
  if (!resultado.success) {
    const errores = resultado.error.issues.map((i) => i.message)
    return { ok: false, errors: errores }
  }
  const numeros = resultado.data as NumerosCarton
  if (tieneDuplicados(numeros)) {
    return { ok: false, errors: ['El cartón contiene números duplicados'] }
  }
  return { ok: true, value: numeros }
}

export function validarCartonCompleto(input: unknown): Result<Carton, string[]> {
  const resultado = cartonSchema.safeParse(input)
  if (!resultado.success) {
    const errores = resultado.error.issues.map((i) => i.message)
    return { ok: false, errors: errores }
  }
  const carton = resultado.data as Carton
  if (tieneDuplicados(carton.numeros)) {
    return { ok: false, errors: ['El cartón contiene números duplicados'] }
  }
  return { ok: true, value: carton }
}

export { numerosCartonSchema, cartonSchema }
