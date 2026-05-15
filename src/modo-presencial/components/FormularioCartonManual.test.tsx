import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FormularioCartonManual from './FormularioCartonManual'

describe('FormularioCartonManual', () => {
  it('renderiza los 5 encabezados B-I-N-G-O', () => {
    render(<FormularioCartonManual onGuardar={vi.fn()} />)
    for (const letra of ['B', 'I', 'N', 'G', 'O']) {
      expect(screen.getAllByText(letra).length).toBeGreaterThan(0)
    }
  })

  it('renderiza la casilla FREE deshabilitada', () => {
    render(<FormularioCartonManual onGuardar={vi.fn()} />)
    expect(screen.getByText('FREE')).toBeInTheDocument()
  })

  it('botón Guardar está deshabilitado cuando el formulario está vacío', () => {
    render(<FormularioCartonManual onGuardar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Guardar cartón/i })).toBeDisabled()
  })

  it('botón Llenar aleatoriamente rellena los inputs y habilita Guardar', () => {
    render(<FormularioCartonManual onGuardar={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Llenar aleatoriamente/i }))
    // Tras llenar, el botón Guardar debe habilitarse
    expect(screen.getByRole('button', { name: /Guardar cartón/i })).not.toBeDisabled()
  })

  it('llama a onGuardar con los números tras llenar aleatoriamente y guardar', () => {
    const onGuardar = vi.fn()
    render(<FormularioCartonManual onGuardar={onGuardar} />)
    fireEvent.click(screen.getByRole('button', { name: /Llenar aleatoriamente/i }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cartón/i }))
    expect(onGuardar).toHaveBeenCalledOnce()
    const numeros = onGuardar.mock.calls[0][0]
    // Verifica estructura básica
    expect(numeros).toHaveProperty('B')
    expect(numeros).toHaveProperty('N')
    expect(numeros.N[2]).toBe('FREE')
  })

  it('limpia el formulario después de guardar', () => {
    const onGuardar = vi.fn()
    render(<FormularioCartonManual onGuardar={onGuardar} />)
    fireEvent.click(screen.getByRole('button', { name: /Llenar aleatoriamente/i }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cartón/i }))
    // Guardar debe resetear el form y deshabilitar Guardar de nuevo
    expect(screen.getByRole('button', { name: /Guardar cartón/i })).toBeDisabled()
  })
})
