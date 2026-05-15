const SERIES: { nombre: string; min: number; max: number }[] = [
  { nombre: 'B', min: 1, max: 15 },
  { nombre: 'I', min: 16, max: 30 },
  { nombre: 'N', min: 31, max: 45 },
  { nombre: 'G', min: 46, max: 60 },
  { nombre: 'O', min: 61, max: 75 },
]

interface HistorialSorteadosProps {
  numerosSorteados: number[]
}

export default function HistorialSorteados({ numerosSorteados }: HistorialSorteadosProps) {
  return (
    <div className="space-y-4">
      {SERIES.map(({ nombre, min, max }) => {
        const numeros = numerosSorteados.filter((n) => n >= min && n <= max)
        return (
          <div key={nombre}>
            <h3 className="mb-1.5 text-sm font-bold text-gray-700">{nombre}</h3>
            {numeros.length === 0 ? (
              <p className="text-sm text-gray-400">—</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {numeros.map((n) => (
                  <span
                    key={n}
                    className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
