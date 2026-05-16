interface MiniPatronGridProps {
  grilla: boolean[][]
  /** Tamaño de cada celda en píxeles. Default 20px (tipo "thumbnail"). */
  celdaPx?: number
}

/**
 * Mini visualización 5×5 de un patrón. Solo display, sin interactividad.
 * Usa los mismos colores que el editor visual:
 * - celda activa → azul
 * - celda inactiva → gris claro
 * - centro (FREE) → amarillo (siempre)
 */
export default function MiniPatronGrid({ grilla, celdaPx = 20 }: MiniPatronGridProps) {
  const tamaño = `${celdaPx}px`
  return (
    <div
      role="img"
      aria-label="Mini-preview del patrón"
      className="grid grid-cols-5 gap-0.5"
      style={{ width: `calc(${celdaPx * 5}px + 0.5rem)` }}
    >
      {grilla.flatMap((fila, fIdx) =>
        fila.map((activa, cIdx) => {
          const esFree = fIdx === 2 && cIdx === 2
          return (
            <div
              key={`${fIdx}-${cIdx}`}
              aria-hidden="true"
              style={{ width: tamaño, height: tamaño }}
              className={[
                'rounded-sm',
                esFree ? 'bg-yellow-400' : activa ? 'bg-blue-500' : 'bg-gray-200',
              ].join(' ')}
            />
          )
        }),
      )}
    </div>
  )
}
