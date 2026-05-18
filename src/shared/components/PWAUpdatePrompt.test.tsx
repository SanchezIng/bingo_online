import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const setNeedRefresh = vi.fn()
const setOfflineReady = vi.fn()
const updateServiceWorker = vi.fn()

let mockState = {
  needRefresh: false,
  offlineReady: false,
}

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [mockState.needRefresh, setNeedRefresh],
    offlineReady: [mockState.offlineReady, setOfflineReady],
    updateServiceWorker,
  }),
}))

import PWAUpdatePrompt from './PWAUpdatePrompt'

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    mockState = { needRefresh: false, offlineReady: false }
    setNeedRefresh.mockClear()
    setOfflineReady.mockClear()
    updateServiceWorker.mockClear()
  })

  it('no renderiza nada cuando no hay actualización ni offline-ready', () => {
    const { container } = render(<PWAUpdatePrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra prompt de recarga cuando needRefresh es true', () => {
    mockState.needRefresh = true
    render(<PWAUpdatePrompt />)
    expect(screen.getByText(/nueva versión disponible/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument()
  })

  it('llama updateServiceWorker al hacer click en Recargar', () => {
    mockState.needRefresh = true
    render(<PWAUpdatePrompt />)
    fireEvent.click(screen.getByRole('button', { name: /recargar/i }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('descarta el prompt al hacer click en Después', () => {
    mockState.needRefresh = true
    render(<PWAUpdatePrompt />)
    fireEvent.click(screen.getByRole('button', { name: /después/i }))
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
    expect(setOfflineReady).toHaveBeenCalledWith(false)
  })

  it('muestra mensaje offline-ready cuando offlineReady es true', () => {
    mockState.offlineReady = true
    render(<PWAUpdatePrompt />)
    expect(screen.getByText(/lista para usar offline/i)).toBeInTheDocument()
  })

  it('prioriza el mensaje de actualización sobre offline-ready', () => {
    mockState.needRefresh = true
    mockState.offlineReady = true
    render(<PWAUpdatePrompt />)
    expect(screen.getByText(/nueva versión disponible/i)).toBeInTheDocument()
    expect(screen.queryByText(/lista para usar offline/i)).not.toBeInTheDocument()
  })
})
