/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '../button'

describe('Button pill variant', () => {
  it('renders with pill size classes', () => {
    const { container } = render(<Button size="pill">Get Started</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('rounded-full')
    expect(btn.className).toContain('h-12')
    expect(btn.className).toContain('px-8')
  })

  it('still renders default size without pill classes', () => {
    const { container } = render(<Button>Default</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('h-10')
    expect(btn.className).not.toContain('rounded-full')
  })
})
