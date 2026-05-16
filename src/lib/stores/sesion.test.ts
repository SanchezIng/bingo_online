import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSesionStore } from './sesion'
import { useCartonesStore } from './cartones'
import { usePatronesStore } from './patrones'
import type { Carton } from '@/core/cartones'
import type { Patron } from '@/core/motor-juego'

vi.mock('@/core/almacenamiento', () => ({
  leerSesion: vi.fn(() => null),
  guardarSesion: vi.fn(() => ({ ok: true, value: undefined })),
}))

const cartonA: Carton = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  serie: 'A',
  numeros: {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 33, 34],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

const cartonB: Carton = {
  id: 'a1b2c3d4-e5f6-4789-8901-234567890abc',
  serie: 'B',
  numeros: {
    B: [6, 7, 8, 9, 10],
    I: [21, 22, 23, 24, 25],
    N: [36, 37, 'FREE', 38, 39],
    G: [51, 52, 53, 54, 55],
    O: [66, 67, 68, 69, 70],
  },
  creadoEn: '2026-01-01T00:00:00.000Z',
  fuente: 'manual',
}

function resetSesion() {
  useSesionStore.setState({
    condicionVictoria: { tipo: 'cartonLleno' },
    numerosSorteados: [],
    iniciadaEn: null,
  })
}

describe('useSesionStore — estado inicial', () => {
  beforeEach(resetSesion)

  it('condicion por defecto es cartonLleno', () => {
    expect(useSesionStore.getState().condicionVictoria).toEqual({ tipo: 'cartonLleno' })
  })

  it('sin números sorteados', () => {
    expect(useSesionStore.getState().numerosSorteados).toEqual([])
  })

  it('sin sesión iniciada', () => {
    expect(useSesionStore.getState().iniciadaEn).toBeNull()
  })
})

describe('establecerCondicion', () => {
  beforeEach(resetSesion)

  it('cambia a n_marcados', () => {
    useSesionStore.getState().establecerCondicion({ tipo: 'n_marcados', valor: 10 })
    expect(useSesionStore.getState().condicionVictoria).toEqual({ tipo: 'n_marcados', valor: 10 })
  })

  it('cambia a patron', () => {
    useSesionStore.getState().establecerCondicion({ tipo: 'patron', patronId: 'id-1' })
    expect(useSesionStore.getState().condicionVictoria).toEqual({
      tipo: 'patron',
      patronId: 'id-1',
    })
  })

  it('cambia a cartonLleno', () => {
    useSesionStore.getState().establecerCondicion({ tipo: 'n_marcados', valor: 5 })
    useSesionStore.getState().establecerCondicion({ tipo: 'cartonLleno' })
    expect(useSesionStore.getState().condicionVictoria).toEqual({ tipo: 'cartonLleno' })
  })

  it('persiste el cambio cuando hay sesión activa', async () => {
    const { guardarSesion } = await import('@/core/almacenamiento')
    vi.mocked(guardarSesion).mockClear()

    useSesionStore.getState().reiniciarSesion()
    vi.mocked(guardarSesion).mockClear()

    useSesionStore.getState().establecerCondicion({ tipo: 'n_marcados', valor: 8 })
    expect(guardarSesion).toHaveBeenCalledTimes(1)
    expect(guardarSesion).toHaveBeenCalledWith(
      expect.objectContaining({ condicionActiva: { tipo: 'n_marcados', valor: 8 } }),
    )
  })

  it('NO persiste cuando no hay sesión activa (iniciadaEn === null)', async () => {
    const { guardarSesion } = await import('@/core/almacenamiento')
    vi.mocked(guardarSesion).mockClear()

    // resetSesion deja iniciadaEn = null
    useSesionStore.getState().establecerCondicion({ tipo: 'n_marcados', valor: 3 })
    expect(guardarSesion).not.toHaveBeenCalled()
  })
})

describe('reiniciarSesion', () => {
  beforeEach(resetSesion)

  it('establece iniciadaEn', () => {
    useSesionStore.getState().reiniciarSesion()
    expect(useSesionStore.getState().iniciadaEn).not.toBeNull()
  })

  it('limpia numerosSorteados', () => {
    useSesionStore.setState({ numerosSorteados: [1, 2, 3], iniciadaEn: '2026-01-01T00:00:00Z' })
    useSesionStore.getState().reiniciarSesion()
    expect(useSesionStore.getState().numerosSorteados).toEqual([])
  })
})

describe('agregarNumeroSorteado', () => {
  beforeEach(() => {
    resetSesion()
    useSesionStore.getState().reiniciarSesion()
  })

  it('añade un número al estado', () => {
    useSesionStore.getState().agregarNumeroSorteado(15)
    expect(useSesionStore.getState().numerosSorteados).toContain(15)
  })

  it('no añade duplicados', () => {
    useSesionStore.getState().agregarNumeroSorteado(15)
    useSesionStore.getState().agregarNumeroSorteado(15)
    expect(useSesionStore.getState().numerosSorteados).toHaveLength(1)
  })

  it('acumula múltiples números', () => {
    useSesionStore.getState().agregarNumeroSorteado(1)
    useSesionStore.getState().agregarNumeroSorteado(16)
    useSesionStore.getState().agregarNumeroSorteado(31)
    expect(useSesionStore.getState().numerosSorteados).toEqual([1, 16, 31])
  })

  it('ignora si no hay sesión iniciada', () => {
    resetSesion()
    useSesionStore.getState().agregarNumeroSorteado(5)
    expect(useSesionStore.getState().numerosSorteados).toEqual([])
  })
})

describe('deshacerUltimoNumero', () => {
  beforeEach(() => {
    resetSesion()
    useSesionStore.getState().reiniciarSesion()
  })

  it('elimina el último número sorteado', () => {
    useSesionStore.setState((s) => ({ ...s, numerosSorteados: [1, 16, 31] }))
    useSesionStore.getState().deshacerUltimoNumero()
    expect(useSesionStore.getState().numerosSorteados).toEqual([1, 16])
  })

  it('no hace nada si la lista está vacía', () => {
    useSesionStore.getState().deshacerUltimoNumero()
    expect(useSesionStore.getState().numerosSorteados).toEqual([])
  })

  it('no hace nada si no hay sesión', () => {
    resetSesion()
    useSesionStore.setState((s) => ({ ...s, numerosSorteados: [1, 2] }))
    useSesionStore.getState().deshacerUltimoNumero()
    expect(useSesionStore.getState().numerosSorteados).toEqual([1, 2])
  })
})

describe('cargarSesion', () => {
  beforeEach(resetSesion)

  it('no modifica el estado si localStorage devuelve null', async () => {
    const { leerSesion } = await import('@/core/almacenamiento')
    vi.mocked(leerSesion).mockReturnValueOnce(null)
    useSesionStore.getState().cargarSesion()
    expect(useSesionStore.getState().iniciadaEn).toBeNull()
  })

  it('carga la sesión desde localStorage', async () => {
    const { leerSesion } = await import('@/core/almacenamiento')
    vi.mocked(leerSesion).mockReturnValueOnce({
      numerosSorteados: [5, 10],
      iniciadaEn: '2026-01-01T10:00:00Z',
      condicionActiva: { tipo: 'n_marcados', valor: 7 },
    })
    useSesionStore.getState().cargarSesion()
    const state = useSesionStore.getState()
    expect(state.numerosSorteados).toEqual([5, 10])
    expect(state.iniciadaEn).toBe('2026-01-01T10:00:00Z')
    expect(state.condicionVictoria).toEqual({ tipo: 'n_marcados', valor: 7 })
  })
})

describe('rankingComputed — integración', () => {
  beforeEach(() => {
    resetSesion()
    useSesionStore.getState().reiniciarSesion()
    useCartonesStore.setState({ cartones: [], error: null })
    usePatronesStore.setState({ patrones: [], error: null })
  })

  it('retorna lista vacía si no hay cartones', () => {
    const ranking = useSesionStore.getState().rankingComputed()
    expect(ranking).toEqual([])
  })

  it('calcula ranking con 2 cartones y condición cartonLleno', () => {
    useCartonesStore.setState({ cartones: [cartonA, cartonB], error: null })
    const ranking = useSesionStore.getState().rankingComputed()
    expect(ranking).toHaveLength(2)
    expect(ranking[0].ganado).toBe(false)
    expect(ranking[0].faltan).toBeGreaterThan(0)
  })

  it('con 3 números sorteados, refleja las casillas marcadas', () => {
    useCartonesStore.setState({ cartones: [cartonA, cartonB], error: null })
    useSesionStore.setState((s) => ({ ...s, numerosSorteados: [1, 2, 3] }))
    const ranking = useSesionStore.getState().rankingComputed()
    // cartonA tiene B:[1,2,3,4,5] así que 3 columna-B marcadas + FREE = 4 marcadas
    // cartonB tiene B:[6,7,8,...] así que solo FREE = 1 marcada
    // cartonA tiene faltan menor → va primero en el ranking
    expect(ranking[0].cartonId).toBe(cartonA.id)
  })

  it('con patrón específico, usa calcularRanking del motor', () => {
    const patron: Patron = {
      id: 'pat-1',
      nombre: 'Línea horizontal',
      grilla: [
        [true, true, true, true, true],
        [false, false, false, false, false],
        [false, false, true, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
      ],
      creadoEn: '2026-01-01T00:00:00Z',
    }
    useCartonesStore.setState({ cartones: [cartonA], error: null })
    usePatronesStore.setState({ patrones: [patron], error: null })
    useSesionStore.getState().establecerCondicion({ tipo: 'patron', patronId: 'pat-1' })
    const ranking = useSesionStore.getState().rankingComputed()
    expect(ranking).toHaveLength(1)
    expect(ranking[0].cartonId).toBe(cartonA.id)
  })
})
