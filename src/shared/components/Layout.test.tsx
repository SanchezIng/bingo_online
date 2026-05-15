import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('renderiza los tres links de navegación', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis Cartones' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Jugar' })).toBeInTheDocument()
  })

  it('muestra el título en el header', () => {
    renderLayout()
    expect(screen.getByText(/Bingo Digital/i)).toBeInTheDocument()
  })
})
