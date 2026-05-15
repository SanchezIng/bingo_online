import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('muestra el título Bingo Digital en el header', () => {
    render(<App />)
    expect(screen.getAllByText(/Bingo Digital/i).length).toBeGreaterThan(0)
  })
})
