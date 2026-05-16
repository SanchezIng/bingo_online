import type { CondicionVictoria } from '@/core/motor-juego'
import { useSesionStore } from '@/lib/stores/sesion'
import Modal from '@/shared/components/Modal'
import SelectorCondicion from './SelectorCondicion'

interface ModalSeleccionarCondicionProps {
  modo: 'iniciar' | 'cambiar'
  condicionInicial?: CondicionVictoria
  onClose: () => void
  /** Callback opcional ejecutado tras confirmar (después de aplicar la condición). */
  onConfirmado?: () => void
  /**
   * Callback para el botón "Ir a elegir patrón →" dentro del selector.
   * Pensado para que el caller navegue a /patrones. Se propaga al
   * SelectorCondicion. Si no se provee, el selector usa el `<select>` clásico.
   */
  onElegirPatron?: () => void
}

/**
 * Modal que envuelve el SelectorCondicion compartido y dispara la acción
 * adecuada del store según el modo:
 *
 * - `iniciar`: establece la condición y reinicia la sesión (números → []).
 *   Usado cuando el usuario entra a /jugar sin sesión activa.
 * - `cambiar`: solo establece la nueva condición. Los números sorteados y
 *   el progreso se preservan. Usado desde el panel flotante durante el juego.
 */
export default function ModalSeleccionarCondicion({
  modo,
  condicionInicial,
  onClose,
  onConfirmado,
  onElegirPatron,
}: ModalSeleccionarCondicionProps) {
  const { establecerCondicion, reiniciarSesion } = useSesionStore()

  const titulo = modo === 'iniciar' ? 'Configurar juego' : 'Cambiar patrón'
  const textoBoton = modo === 'iniciar' ? 'Iniciar sesión' : 'Aplicar cambio'

  function handleConfirmar(condicion: CondicionVictoria) {
    establecerCondicion(condicion)
    if (modo === 'iniciar') reiniciarSesion()
    onConfirmado?.()
    onClose()
  }

  return (
    <Modal titulo={titulo} onClose={onClose}>
      <SelectorCondicion
        condicionInicial={condicionInicial}
        textoBoton={textoBoton}
        onConfirmar={handleConfirmar}
        onCancelar={onClose}
        onElegirPatron={onElegirPatron}
      />
    </Modal>
  )
}
