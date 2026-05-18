// Íconos SVG inline para los empty states. Tamaño base 64px, color heredado.

interface IconProps {
  size?: number
  className?: string
}

export function CartonVacioIcon({ size = 64, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="10" width="52" height="44" rx="4" />
      <rect x="6" y="10" width="52" height="10" rx="4" />
      <line x1="6" y1="32" x2="58" y2="32" />
      <line x1="6" y1="44" x2="58" y2="44" />
      <line x1="22" y1="20" x2="22" y2="54" />
      <line x1="42" y1="20" x2="42" y2="54" />
    </svg>
  )
}

export function PatronIcon({ size = 64, className }: IconProps) {
  // Grilla 3×3 con celda central marcada (estilo "patrón")
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="8" y="8" width="48" height="48" rx="4" />
      <line x1="24" y1="8" x2="24" y2="56" />
      <line x1="40" y1="8" x2="40" y2="56" />
      <line x1="8" y1="24" x2="56" y2="24" />
      <line x1="8" y1="40" x2="56" y2="40" />
      <rect x="26" y="26" width="12" height="12" fill="currentColor" stroke="none" rx="1" />
    </svg>
  )
}

export function JuegoIcon({ size = 64, className }: IconProps) {
  // Diana / target — coherente con el emoji 🎯 del logo
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="16" />
      <circle cx="32" cy="32" r="8" />
      <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}
