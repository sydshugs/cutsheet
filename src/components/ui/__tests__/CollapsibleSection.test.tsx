/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CollapsibleSection } from '../CollapsibleSection'

const MockIcon = () => <svg data-testid="mock-icon" />

describe('CollapsibleSection', () => {
  it('renders title text', () => {
    render(<CollapsibleSection title="Hook Analysis">Content</CollapsibleSection>)
    expect(screen.getByText('Hook Analysis')).toBeInTheDocument()
  })
  it('renders icon when provided', () => {
    render(<CollapsibleSection title="Hook Analysis" icon={<MockIcon />}>Content</CollapsibleSection>)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })
  it('shows children when defaultOpen is true', () => {
    render(<CollapsibleSection title="Hook Analysis" defaultOpen><p>Inner content</p></CollapsibleSection>)
    expect(screen.getByText('Inner content')).toBeInTheDocument()
  })
  it('hides children when defaultOpen is false', () => {
    render(<CollapsibleSection title="Hook Analysis" defaultOpen={false}><p>Inner content</p></CollapsibleSection>)
    expect(screen.queryByText('Inner content')).not.toBeInTheDocument()
  })
  it('toggles open/closed on click', () => {
    render(<CollapsibleSection title="Hook Analysis" defaultOpen={false}><p>Inner content</p></CollapsibleSection>)
    fireEvent.click(screen.getByText('Hook Analysis'))
    expect(screen.getByText('Inner content')).toBeInTheDocument()
  })
})
