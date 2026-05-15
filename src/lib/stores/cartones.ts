import { create } from 'zustand'
import type { Carton } from '@/core/cartones'
import { leerCartones, guardarCartones } from '@/core/almacenamiento'

interface CartonesState {
  cartones: Carton[]
  error: string | null
  cargarCartones: () => void
  agregarCarton: (carton: Carton) => void
  eliminarCarton: (id: string) => void
  editarCarton: (id: string, cambios: Partial<Omit<Carton, 'id'>>) => void
}

export const useCartonesStore = create<CartonesState>((set, get) => ({
  cartones: [],
  error: null,

  cargarCartones: () => {
    const cartones = leerCartones()
    set({ cartones, error: null })
  },

  agregarCarton: (carton) => {
    const cartones = [...get().cartones, carton]
    const result = guardarCartones(cartones)
    if (result.ok) {
      set({ cartones, error: null })
    } else {
      set({ error: result.errors })
    }
  },

  eliminarCarton: (id) => {
    const cartones = get().cartones.filter((c) => c.id !== id)
    const result = guardarCartones(cartones)
    if (result.ok) {
      set({ cartones, error: null })
    } else {
      set({ error: result.errors })
    }
  },

  editarCarton: (id, cambios) => {
    const cartones = get().cartones.map((c) => (c.id === id ? { ...c, ...cambios } : c))
    const result = guardarCartones(cartones)
    if (result.ok) {
      set({ cartones, error: null })
    } else {
      set({ error: result.errors })
    }
  },
}))
