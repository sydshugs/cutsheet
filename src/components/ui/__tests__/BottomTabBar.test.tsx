/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BottomTabBar } from '../BottomTabBar'

describe('BottomTabBar', () => {
  it('renders all 4 tabs', () => {
    render(<BottomTabBar activeTab="analyze" onTabChange={vi.fn()} />)
    expect(screen.getByText('Analyze')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Swipe File')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    render(<BottomTabBar activeTab="history" onTabChange={vi.fn()} />)
    const historyTab = screen.getByText('History').closest('button')!
    expect(historyTab.style.color).toBe('var(--accent)')
  })

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn()
    render(<BottomTabBar activeTab="analyze" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('Settings'))
    expect(onTabChange).toHaveBeenCalledWith('settings')
  })

  it('has nav role for accessibility', () => {
    render(<BottomTabBar activeTab="analyze" onTabChange={vi.fn()} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
