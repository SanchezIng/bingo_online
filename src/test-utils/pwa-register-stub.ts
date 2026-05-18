import type { Dispatch, SetStateAction } from 'react'

// Stub para tests: el módulo virtual:pwa-register/react solo existe en build.
// Por defecto retorna estado "sin actualización", ningún prompt visible.
// Los tests que necesitan otro comportamiento deben mockear el módulo a mano.
export function useRegisterSW(): {
  needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
  offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
} {
  const noop = () => undefined
  return {
    needRefresh: [false, noop as Dispatch<SetStateAction<boolean>>],
    offlineReady: [false, noop as Dispatch<SetStateAction<boolean>>],
    updateServiceWorker: async () => undefined,
  }
}
