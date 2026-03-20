/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeepDiveTabGroup, type Tab } from '../DeepDiveTabGroup'

const TABS: Tab[] = [
  { id: 'copy', label: 'Copy Breakdown' },
  { id: 'emotional', label: 'Emotional Tone' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'hashtags', label: 'Hashtags' },
  { id: 'adchecks', label: 'Ad Checks' },
]

describe('DeepDiveTabGroup', () => {
  it('renders all tabs', () => {
    render(
      <DeepDiveTabGroup tabs={TABS} activeTab="copy" onTabChange={vi.fn()} />,
    )
    TABS.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument()
    })
  })

  it('highlights the active tab', () => {
    render(
      <DeepDiveTabGroup tabs={TABS} activeTab="scenes" onTabChange={vi.fn()} />,
    )
    const activeBtn = screen.getByText('Scenes').closest('button')!
    expect(activeBtn.style.fontWeight).toBe('600')
  })

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn()
    render(
      <DeepDiveTabGroup tabs={TABS} activeTab="copy" onTabChange={onTabChange} />,
    )
    fireEvent.click(screen.getByText('Hashtags'))
    expect(onTabChange).toHaveBeenCalledWith('hashtags')
  })

  it('has a tab list role for accessibility', () => {
    render(
      <DeepDiveTabGroup tabs={TABS} activeTab="copy" onTabChange={vi.fn()} />,
    )
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})
