import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import QuickSearch from '../components/Patient/Dashboard/QuickSearch'

// Mock useNavigate from react-router-dom
const mockedUsedNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}))

describe('QuickSearch', () => {
  it('navigates to search results on submit', () => {
    render(<QuickSearch />)
    const input = screen.getByPlaceholderText(/Search for medications/i)
    const button = screen.getByRole('button', { name: /search/i })

    fireEvent.change(input, { target: { value: 'Paracetamol' } })
    fireEvent.click(button)

    expect(mockedUsedNavigate).toHaveBeenCalledWith('/patient/search?q=Paracetamol')
  })

  it('popular search button sets the input value', () => {
    render(<QuickSearch />)
    const popularButton = screen.getByRole('button', { name: /Paracetamol/i })
    const input = screen.getByPlaceholderText(/Search for medications/i)

    fireEvent.click(popularButton)
    expect(input.value).toBe('Paracetamol')
  })
})
