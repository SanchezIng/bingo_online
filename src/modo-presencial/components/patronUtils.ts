export function grillaInicial(): boolean[][] {
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => r === 2 && c === 2),
  )
}
