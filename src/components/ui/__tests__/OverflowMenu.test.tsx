/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OverflowMenu } from '../OverflowMenu'

describe('OverflowMenu', () => {
  it('renders the trigger button', () => {
    render(<OverflowMenu items={[{ label: 'Action', onClick: vi.fn() }]} />)
    expect(screen.getByLabelText('More actions')).toBeInTheDocument()
  })
  it('shows items when opened', () => {
    render(<OverflowMenu items={[{ label: 'Export PDF', onClick: vi.fn() }]} />)
    fireEvent.click(screen.getByLabelText('More actions'))
    expect(screen.getByText('Export PDF')).toBeInTheDocument()
  })
  it('renders destructive items with red text', () => {
    render(<OverflowMenu items={[{ label: 'Start Over', onClick: vi.fn(), destructive: true }]} />)
    fireEvent.click(screen.getByLabelText('More actions'))
    const item = screen.getByText('Start Over')
    expect(item.closest('button')?.style.color).toBe('rgb(239, 68, 68)')
  })
  it('shows error state and allows retry', () => {
    render(<OverflowMenu items={[{ label: 'Generate Brief', onClick: vi.fn(), error: 'API failed' }]} />)
    fireEvent.click(screen.getByLabelText('More actions'))
    expect(screen.getByText('API failed')).toBeInTheDocument()
  })
  it('shows loading state with loadingLabel', () => {
    render(<OverflowMenu items={[{ label: 'Generate Brief', onClick: vi.fn(), loading: true, loadingLabel: 'Generating...' }]} />)
    fireEvent.click(screen.getByLabelText('More actions'))
    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })
  it('renders a divider before destructive items', () => {
    const { container } = render(
      <OverflowMenu items={[
        { label: 'Export', onClick: vi.fn() },
        { label: 'Start Over', onClick: vi.fn(), destructive: true },
      ]} />
    )
    fireEvent.click(screen.getByLabelText('More actions'))
    const dividers = container.querySelectorAll('[data-divider]')
    expect(dividers.length).toBeGreaterThanOrEqual(1)
  })
})
