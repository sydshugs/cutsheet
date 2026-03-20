/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BenchmarkBadge } from '../BenchmarkBadge'

describe('BenchmarkBadge', () => {
  it('renders positive delta with up arrow', () => {
    render(<BenchmarkBadge delta={0.8} format="static" />)
    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/0.8 pts above avg static ads/)).toBeInTheDocument()
  })
  it('renders negative delta with down arrow', () => {
    render(<BenchmarkBadge delta={-1.2} format="video" />)
    expect(screen.getByText(/↓/)).toBeInTheDocument()
    expect(screen.getByText(/1.2 pts below avg video ads/)).toBeInTheDocument()
  })
  it('renders zero delta as "at avg"', () => {
    render(<BenchmarkBadge delta={0} format="static" />)
    expect(screen.getByText(/at avg static ads/)).toBeInTheDocument()
  })
  it('uses green styling for positive delta', () => {
    const { container } = render(<BenchmarkBadge delta={0.8} format="static" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).toContain('16,185,129')
  })
  it('uses red styling for negative delta', () => {
    const { container } = render(<BenchmarkBadge delta={-0.5} format="video" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).toContain('239,68,68')
  })
})
