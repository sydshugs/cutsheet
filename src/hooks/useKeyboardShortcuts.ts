import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts(
  onShowShortcuts: () => void,
  onClearAnalysis?: () => void
) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire when user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'k') { e.preventDefault(); navigate('/app/paid') }
      if (meta && e.key === '1') { e.preventDefault(); navigate('/app/paid') }
      if (meta && e.key === '2') { e.preventDefault(); navigate('/app/organic') }
      if (meta && e.key === '3') { e.preventDefault(); navigate('/app/ab-test') }
      if (e.key === 'Escape' && onClearAnalysis) { onClearAnalysis() }
      if (e.key === '?' && !meta) { e.preventDefault(); onShowShortcuts() }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, onShowShortcuts, onClearAnalysis])
}
