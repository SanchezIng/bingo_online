import { useNavigate } from 'react-router-dom'
import type { CondicionVictoria } from '@/core/motor-juego'
import { useSesionStore } from '@/lib/stores/sesion'
import SelectorCondicion from '@/modo-presencial/components/SelectorCondicion'

export default function ConfiguracionJuego() {
  const navigate = useNavigate()
  const { establecerCondicion, reiniciarSesion } = useSesionStore()

  function handleIniciar(condicion: CondicionVictoria) {
    establecerCondicion(condicion)
    reiniciarSesion()
    navigate('/jugar')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Configurar juego</h1>
      <SelectorCondicion textoBoton="Iniciar sesión de juego" onConfirmar={handleIniciar} />
    </div>
  )
}
