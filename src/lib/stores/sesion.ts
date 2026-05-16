import { create } from 'zustand'
import type { CondicionVictoria, EstadoSesion, RankingEntry } from '@/core/motor-juego'
import { calcularRanking } from '@/core/motor-juego'
import { leerSesion, guardarSesion } from '@/core/almacenamiento'
import { useCartonesStore } from './cartones'
import { usePatronesStore } from './patrones'

interface SesionState {
  condicionVictoria: CondicionVictoria
  numerosSorteados: number[]
  iniciadaEn: string | null
  establecerCondicion: (condicion: CondicionVictoria) => void
  agregarNumeroSorteado: (n: number) => void
  deshacerUltimoNumero: () => void
  reiniciarSesion: () => void
  cargarSesion: () => void
  rankingComputed: () => RankingEntry[]
}

const CONDICION_DEFAULT: CondicionVictoria = { tipo: 'cartonLleno' }

function persistirSesion(
  numerosSorteados: number[],
  iniciadaEn: string,
  condicionVictoria: CondicionVictoria,
): void {
  const sesion: EstadoSesion = { numerosSorteados, iniciadaEn, condicionActiva: condicionVictoria }
  guardarSesion(sesion)
}

export const useSesionStore = create<SesionState>((set, get) => ({
  condicionVictoria: CONDICION_DEFAULT,
  numerosSorteados: [],
  iniciadaEn: null,

  establecerCondicion: (condicion) => {
    const { numerosSorteados, iniciadaEn } = get()
    set({ condicionVictoria: condicion })
    // Si hay sesión activa, persistir el cambio para que sobreviva a recargas.
    // Si no, queda solo en memoria hasta que reiniciarSesion la materialice.
    if (iniciadaEn !== null) {
      persistirSesion(numerosSorteados, iniciadaEn, condicion)
    }
  },

  agregarNumeroSorteado: (n) => {
    const { numerosSorteados, iniciadaEn, condicionVictoria } = get()
    if (iniciadaEn === null || numerosSorteados.includes(n)) return
    const nuevos = [...numerosSorteados, n]
    set({ numerosSorteados: nuevos })
    persistirSesion(nuevos, iniciadaEn, condicionVictoria)
  },

  deshacerUltimoNumero: () => {
    const { numerosSorteados, iniciadaEn, condicionVictoria } = get()
    if (iniciadaEn === null || numerosSorteados.length === 0) return
    const nuevos = numerosSorteados.slice(0, -1)
    set({ numerosSorteados: nuevos })
    persistirSesion(nuevos, iniciadaEn, condicionVictoria)
  },

  reiniciarSesion: () => {
    const { condicionVictoria } = get()
    const iniciadaEn = new Date().toISOString()
    set({ numerosSorteados: [], iniciadaEn })
    persistirSesion([], iniciadaEn, condicionVictoria)
  },

  cargarSesion: () => {
    const sesion = leerSesion()
    if (sesion) {
      set({
        condicionVictoria: sesion.condicionActiva,
        numerosSorteados: sesion.numerosSorteados,
        iniciadaEn: sesion.iniciadaEn,
      })
    }
  },

  rankingComputed: () => {
    const { cartones } = useCartonesStore.getState()
    const { patrones } = usePatronesStore.getState()
    const { numerosSorteados, condicionVictoria } = get()
    return calcularRanking(cartones, numerosSorteados, condicionVictoria, patrones)
  },
}))
