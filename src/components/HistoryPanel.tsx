import { useEffect, useState } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import { getAnalysisHistory, deleteAnalysis, type AnalysisRecord } from '../services/historyService'

interface Props {
  onSelect: (record: AnalysisRecord) => void
  refreshKey?: number  // increment to trigger refresh
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color,
      flexShrink: 0,
    }}>
      {score}
    </div>
  )
}

export default function HistoryPanel({ onSelect, refreshKey }: Props) {
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await getAnalysisHistory(10)
    setHistory(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteAnalysis(id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 8 }}>
        <Clock size={32} color="#52525b" />
        <span style={{ fontSize: 13, color: '#52525b' }}>No analyses yet</span>
        <span style={{ fontSize: 13, color: '#52525b' }}>Your scored ads will appear here</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, maxHeight: 400, overflowY: 'auto',
    }}>
      {history.map((item, i) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            cursor: 'pointer', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ScoreDot score={Math.round(item.overall_score)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(item.file_name || 'Untitled').slice(0, 24)}{(item.file_name || '').length > 24 ? '…' : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.08)', borderRadius: 9999, padding: '1px 7px' }}>
                {item.mode === 'paid' ? 'Paid' : 'Organic'}
              </span>
              <span style={{ fontSize: 11, color: '#52525b' }}>{item.platform || 'All'}</span>
              <span style={{ fontSize: 11, color: '#52525b' }}>{item.created_at ? timeAgo(item.created_at) : ''}</span>
            </div>
          </div>
          <button
            onClick={e => item.id && handleDelete(e, item.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 4, flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
