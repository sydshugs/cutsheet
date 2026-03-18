import { useState } from 'react'
import { Film, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Scene } from '../services/analyzerService'

interface Props {
  scenes: Scene[]
}

export default function SceneBreakdown({ scenes }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (!scenes || scenes.length === 0) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 16, marginTop: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Film size={14} color="#71717a" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>Scene Breakdown</span>
      </div>

      {/* Scenes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {scenes.map((scene, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0' }} />}

            {/* Collapsed header — always visible */}
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)',
                borderRadius: 9999, padding: '2px 8px', fontFamily: 'monospace',
                flexShrink: 0, whiteSpace: 'nowrap',
              }}>
                {scene.timestamp}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', flex: 1 }}>
                {scene.title}
              </span>
              <ChevronDown
                size={14} color="#52525b"
                style={{ transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
            </button>

            {/* Expanded detail */}
            <AnimatePresence initial={false}>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingBottom: 12, paddingLeft: 4 }}>
                    {scene.visual && (
                      <p style={{ fontSize: 12, color: '#71717a', fontStyle: 'italic', margin: '0 0 8px 0' }}>
                        {scene.visual}
                      </p>
                    )}
                    {scene.working && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                        <CheckCircle size={10} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#a1a1aa' }}>{scene.working}</span>
                      </div>
                    )}
                    {scene.improve && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <AlertCircle size={10} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#a1a1aa' }}>{scene.improve}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
