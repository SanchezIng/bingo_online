/* v8 ignore file */
export type CondicionVictoria =
  | { tipo: 'n_marcados'; valor: number }
  | { tipo: 'patron'; patronId: string }
  | { tipo: 'cartonLleno' }

export type Patron = {
  id: string
  nombre: string
  // grilla[fila][columna] — [2][2] (centro) siempre true (free space)
  grilla: boolean[][]
  creadoEn: string
}

export type EstadoMarcado = {
  casillasMarcadas: Set<string>
}

export type RankingEntry = {
  cartonId: string
  faltan: number
  ganado: boolean
}

export type EstadoSesion = {
  numerosSorteados: number[]
  iniciadaEn: string
  condicionActiva: CondicionVictoria
}
