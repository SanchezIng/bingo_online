import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renderiza el botón Crear cartón', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /Crear cartón/i })).toBeInTheDocument()
  })

  it('renderiza el botón Empezar a jugar', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /Empezar a jugar/i })).toBeInTheDocument()
  })
})
