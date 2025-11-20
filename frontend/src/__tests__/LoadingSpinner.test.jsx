import React from 'react'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../components/Shared/UI/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders the spinner element', () => {
    render(<LoadingSpinner />)
    const spinner = document.querySelector('.loading-spinner')
    expect(spinner).toBeInTheDocument()
  })
})
