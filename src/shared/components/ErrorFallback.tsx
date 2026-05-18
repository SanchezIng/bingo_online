import type { FallbackRender } from '@sentry/react'

const ErrorFallback: FallbackRender = ({ resetError }) => {
  function recargar() {
    resetError()
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div role="alert" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-lg font-semibold text-gray-800">Algo salió mal</h1>
        <p className="mt-2 text-sm text-gray-600">
          Hubo un error inesperado. Tus cartones y patrones siguen guardados. Recarga la página para
          continuar.
        </p>
        <button
          onClick={recargar}
          className="mt-4 min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Recargar la app
        </button>
      </div>
    </div>
  )
}

export default ErrorFallback
