/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlatformPills } from '../PlatformPills'

describe('PlatformPills', () => {
  it('renders 3 visible platform pills by default', () => {
    render(
      <PlatformPills
        selected="Meta"
        onSelect={vi.fn()}
        format="video"
      />,
    )
    expect(screen.getByText('Meta')).toBeInTheDocument()
    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('renders "More +" button when collapsed', () => {
    render(
      <PlatformPills selected="Meta" onSelect={vi.fn()} format="video" />,
    )
    expect(screen.getByText('More +')).toBeInTheDocument()
  })

  it('expands to show all platforms when "More +" is clicked', () => {
    render(
      <PlatformPills selected="Meta" onSelect={vi.fn()} format="video" />,
    )
    fireEvent.click(screen.getByText('More +'))
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
    expect(screen.queryByText('More +')).not.toBeInTheDocument()
  })

  it('always renders format pills (Video/Static)', () => {
    render(
      <PlatformPills selected="Meta" onSelect={vi.fn()} format="video" />,
    )
    expect(screen.getByText('Video')).toBeInTheDocument()
    expect(screen.getByText('Static')).toBeInTheDocument()
  })

  it('calls onSelect when a platform pill is clicked', () => {
    const onSelect = vi.fn()
    render(
      <PlatformPills selected="Meta" onSelect={onSelect} format="video" />,
    )
    fireEvent.click(screen.getByText('TikTok'))
    expect(onSelect).toHaveBeenCalledWith('TikTok')
  })

  it('has radiogroup role for accessibility', () => {
    render(
      <PlatformPills selected="Meta" onSelect={vi.fn()} format="video" />,
    )
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})
