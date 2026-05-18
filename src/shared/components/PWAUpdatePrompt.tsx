import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('[pwa] error registrando service worker', error)
    },
  })

  if (!needRefresh && !offlineReady) return null

  function descartar() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 max-w-md px-4"
    >
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg">
        {needRefresh ? (
          <>
            <p className="text-sm font-medium text-gray-800">Nueva versión disponible.</p>
            <p className="mt-1 text-xs text-gray-600">
              Recarga para usar la última versión de la app.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Recargar
              </button>
              <button
                onClick={descartar}
                className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Después
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-800">App lista para usar offline.</p>
            <button onClick={descartar} className="mt-2 text-sm text-blue-600 hover:underline">
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  )
}
