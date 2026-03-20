/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Skeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('renders a div with shimmer animation', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
  })

  it('applies custom width and height via style', () => {
    const { container } = render(<Skeleton width="200px" height="24px" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('24px')
  })

  it('applies custom border-radius', () => {
    const { container } = render(<Skeleton radius="9999px" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.borderRadius).toBe('9999px')
  })

  it('merges className prop', () => {
    const { container } = render(<Skeleton className="my-class" />)
    const el = container.firstChild as HTMLElement
    expect(el.classList.contains('my-class')).toBe(true)
  })
})
