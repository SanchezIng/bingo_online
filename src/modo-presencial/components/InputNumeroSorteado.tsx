import { useState } from 'react'
import { useSesionStore } from '@/lib/stores/sesion'

const SERIES = ['B', 'I', 'N', 'G', 'O'] as const

function serieDe(n: number): string {
  return SERIES[Math.floor((n - 1) / 15)]
}

export default function InputNumeroSorteado() {
  const { numerosSorteados, agregarNumeroSorteado } = useSesionStore()
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)

  const num = valor === '' ? null : parseInt(valor, 10)
  const enRango = num !== null && !isNaN(num) && num >= 1 && num <= 75
  const yaSorteado = num !== null && numerosSorteados.includes(num)
  const previewLetra = enRango ? `${serieDe(num)}-${num}` : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (valor === '') return
    if (num === null || isNaN(num)) {
      setError('Ingresa un número entre 1 y 75.')
      return
    }
    if (!enRango) {
      setError('El número debe estar entre 1 y 75.')
      return
    }
    if (yaSorteado) {
      setError(`${serieDe(num)}-${num} ya fue sorteado.`)
      return
    }
    agregarNumeroSorteado(num)
    setValor('')
    setError(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const limpio = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
    setValor(limpio)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="input-numero-sorteado" className="text-xs font-medium text-gray-600">
        Anotar número sorteado
      </label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 focus-within:border-blue-500">
          <input
            id="input-numero-sorteado"
            type="text"
            inputMode="numeric"
            placeholder="1-75"
            value={valor}
            onChange={handleChange}
            aria-label="Número sorteado"
            aria-invalid={error !== null}
            className="w-full min-w-0 bg-transparent text-lg font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {previewLetra && !yaSorteado && (
            <span className="shrink-0 rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
              {previewLetra}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!enRango || yaSorteado}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Marcar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  )
}
