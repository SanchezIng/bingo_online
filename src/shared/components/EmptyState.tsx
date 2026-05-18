import type { ReactNode } from 'react'

interface EmptyStateProps {
  icono?: ReactNode
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export default function EmptyState({ icono, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-4 py-12 text-center sm:py-16">
      {icono && (
        <div aria-hidden="true" className="text-blue-500/80">
          {icono}
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
      {descripcion && <p className="max-w-xs text-sm text-gray-500">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
