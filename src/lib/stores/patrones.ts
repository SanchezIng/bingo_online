import { create } from 'zustand'
import type { Patron } from '@/core/motor-juego'
import { leerPatrones, guardarPatrones } from '@/core/almacenamiento'

interface PatronesState {
  patrones: Patron[]
  error: string | null
  cargarPatrones: () => void
  agregarPatron: (patron: Patron) => void
  eliminarPatron: (id: string) => void
  renombrarPatron: (id: string, nombre: string) => void
}

export const usePatronesStore = create<PatronesState>((set, get) => ({
  patrones: [],
  error: null,

  cargarPatrones: () => {
    const patrones = leerPatrones()
    set({ patrones, error: null })
  },

  agregarPatron: (patron) => {
    const patrones = [...get().patrones, patron]
    const result = guardarPatrones(patrones)
    if (result.ok) {
      set({ patrones, error: null })
    } else {
      set({ error: result.errors })
    }
  },

  eliminarPatron: (id) => {
    const patrones = get().patrones.filter((p) => p.id !== id)
    const result = guardarPatrones(patrones)
    if (result.ok) {
      set({ patrones, error: null })
    } else {
      set({ error: result.errors })
    }
  },

  renombrarPatron: (id, nombre) => {
    const patrones = get().patrones.map((p) => (p.id === id ? { ...p, nombre } : p))
    const result = guardarPatrones(patrones)
    if (result.ok) {
      set({ patrones, error: null })
    } else {
      set({ error: result.errors })
    }
  },
}))
