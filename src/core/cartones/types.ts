/* v8 ignore file */
export type SerieBingo = 'B' | 'I' | 'N' | 'G' | 'O'

export type NumerosCarton = {
  B: [number, number, number, number, number]
  I: [number, number, number, number, number]
  N: [number, number, 'FREE', number, number]
  G: [number, number, number, number, number]
  O: [number, number, number, number, number]
}

export type NumerosCartonParcial = {
  B: [number | null, number | null, number | null, number | null, number | null]
  I: [number | null, number | null, number | null, number | null, number | null]
  N: [number | null, number | null, 'FREE', number | null, number | null]
  G: [number | null, number | null, number | null, number | null, number | null]
  O: [number | null, number | null, number | null, number | null, number | null]
}

export type Carton = {
  id: string
  serie: string
  numeros: NumerosCarton
  creadoEn: string
  fuente: 'manual' | 'ocr' | 'aleatorio' | 'importado'
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }
