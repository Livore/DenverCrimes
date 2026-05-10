import { useEffect, useState } from 'react'
import { FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { agentApi } from '../hooks/useApi'
import type { Report } from '../types'

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = () => agentApi.listReports().then(setReports)

  useEffect(() => { load() }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await agentApi.generateReport()
      setReports(prev => [r, ...prev])
      setExpanded(r.id)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Report AI</h2>
        <button
          onClick={generate}
          disabled={generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: generating ? '#4338ca' : '#6366f1',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 18px', cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
          {generating ? 'Generazione in corso...' : 'Genera Nuovo Report'}
        </button>
      </div>

      <div style={{
        background: '#1a1d27', border: '1px solid #2a2d3a',
        borderRadius: 12, padding: 20, marginBottom: 24, color: '#94a3b8', fontSize: 14,
      }}>
        <strong style={{ color: '#e2e8f0' }}>Come funziona:</strong> Il report AI analizza il tuo portafoglio applicando
        le teorie accademiche di Markowitz (MPT), Fama-French (Factor Investing), Malkiel/Bogle (passive investing)
        e la Behavioral Finance. Riceverai un'analisi completa con metriche di rischio e raccomandazioni concrete.
      </div>

      {reports.length === 0 ? (
        <div style={{
          background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12,
          padding: 60, textAlign: 'center', color: '#64748b',
        }}>
          <FileText size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 18, marginBottom: 8 }}>Nessun report</div>
          <div style={{ fontSize: 14 }}>Clicca "Genera Nuovo Report" per creare la tua prima analisi AI</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => (
            <div key={r.id} style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={18} color="#6366f1" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Report del {new Date(r.created_at).toLocaleString('it-IT')}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {r.content.substring(0, 100)}...
                    </div>
                  </div>
                </div>
                {expanded === r.id ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
              </button>
              {expanded === r.id && (
                <div style={{
                  borderTop: '1px solid #2a2d3a', padding: '20px 24px',
                  color: '#e2e8f0', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap',
                  background: '#161820',
                }}>
                  {r.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
