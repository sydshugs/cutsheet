import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
const mod = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { keys: ['⌘', 'K'], label: 'New analysis' },
  { keys: ['⌘', '1'], label: 'Paid Ad' },
  { keys: ['⌘', '2'], label: 'Organic' },
  { keys: ['⌘', '3'], label: 'A/B Test' },
  { keys: [mod, '↵'], label: 'Run analysis' },
  { keys: [mod, 'H'], label: 'Open history' },
  { keys: [mod, 'S'], label: 'Save to Saved Ads' },
  { keys: ['Esc'], label: 'Clear analysis' },
  { keys: ['?'], label: 'Show shortcuts' },
]

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  const trapRef = useFocusTrap(open)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        style={{
          background: '#18181b', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', margin: '0 16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span id="shortcuts-modal-title" style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5' }}>Keyboard shortcuts</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcuts.map(({ keys, label }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#a1a1aa' }}>{label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.map(k => (
                  <kbd key={k} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', fontSize: 12, color: '#a1a1aa',
                  }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
