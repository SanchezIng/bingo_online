import { useNavigate } from 'react-router-dom'
import { useCartonesStore } from '@/lib/stores/cartones'
import { crearCartonDesdeNumeros } from '@/core/cartones'
import type { NumerosCarton } from '@/core/cartones'
import FormularioCartonManual from '@/modo-presencial/components/FormularioCartonManual'

export default function CrearCartonManual() {
  const navigate = useNavigate()
  const agregarCarton = useCartonesStore((s) => s.agregarCarton)

  function handleGuardar(numeros: NumerosCarton) {
    const result = crearCartonDesdeNumeros(numeros, { fuente: 'manual' })
    if (result.ok) {
      agregarCarton(result.value)
      navigate('/cartones', { state: { mensaje: 'Cartón creado correctamente.' } })
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Crear cartón manualmente</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ingresa los números de tu cartón físico. Columna B: 1–15 · I: 16–30 · N: 31–45 · G: 46–60 ·
        O: 61–75.
      </p>
      <FormularioCartonManual onGuardar={handleGuardar} />
    </div>
  )
}
