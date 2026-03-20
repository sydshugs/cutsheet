/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SlideSheet } from '../SlideSheet'

describe('SlideSheet', () => {
  it('renders children when open', () => {
    render(
      <SlideSheet open onClose={vi.fn()}>
        <p>Sheet content</p>
      </SlideSheet>,
    )
    expect(screen.getByText('Sheet content')).toBeInTheDocument()
  })

  it('does not render children when closed', () => {
    render(
      <SlideSheet open={false} onClose={vi.fn()}>
        <p>Sheet content</p>
      </SlideSheet>,
    )
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <SlideSheet open onClose={vi.fn()} title="Deep Dive">
        Content
      </SlideSheet>,
    )
    expect(screen.getByText('Deep Dive')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <SlideSheet open onClose={onClose}>
        Content
      </SlideSheet>,
    )
    const backdrop = screen.getByTestId('slidesheet-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders drag handle', () => {
    render(
      <SlideSheet open onClose={vi.fn()}>
        Content
      </SlideSheet>,
    )
    expect(screen.getByTestId('slidesheet-handle')).toBeInTheDocument()
  })
})
