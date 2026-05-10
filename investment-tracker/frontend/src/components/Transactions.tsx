import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { transactionsApi } from '../hooks/useApi'
import type { Transaction } from '../types'

const inputStyle: React.CSSProperties = {
  background: '#0f1117',
  border: '1px solid #2a2d3a',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

const ASSET_TYPES = [
  { value: 'stock', label: 'Azione' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Crypto' },
]

const POPULAR = {
  stock: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'],
  etf: ['SPY', 'QQQ', 'VTI', 'VXUS', 'BND', 'VWO'],
  crypto: ['BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP'],
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [form, setForm] = useState({
    asset_type: 'stock',
    ticker: '',
    name: '',
    quantity: '',
    price: '',
    transaction_type: 'buy',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const load = () => {
    transactionsApi.list().then(setTransactions)
  }

  useEffect(() => { load() }, [])

  const fetchPrice = async () => {
    if (!form.ticker || !form.asset_type) return
    setFetchingPrice(true)
    try {
      const data = await transactionsApi.getPrice(form.asset_type, form.ticker.toUpperCase())
      setForm(f => ({ ...f, price: data.price.toString() }))
    } catch {
      // price not found
    } finally {
      setFetchingPrice(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await transactionsApi.add({
        asset_type: form.asset_type,
        ticker: form.ticker.toUpperCase(),
        name: form.name || form.ticker.toUpperCase(),
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        transaction_type: form.transaction_type,
        date: form.date,
        notes: form.notes || undefined,
      } as any)
      setShowForm(false)
      setForm({ asset_type: 'stock', ticker: '', name: '', quantity: '', price: '', transaction_type: 'buy', date: new Date().toISOString().slice(0, 10), notes: '' })
      load()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa transazione?')) return
    await transactionsApi.delete(id)
    load()
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Transazioni</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          <Plus size={16} /> Nuova Transazione
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#e2e8f0' }}>Aggiungi Transazione</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Tipo Asset</label>
                <select
                  style={inputStyle}
                  value={form.asset_type}
                  onChange={e => setForm(f => ({ ...f, asset_type: e.target.value, ticker: '', name: '' }))}
                >
                  {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Ticker</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="es. AAPL, BTC"
                    value={form.ticker}
                    onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={fetchPrice}
                    disabled={fetchingPrice || !form.ticker}
                    style={{
                      background: '#2a2d3a', border: '1px solid #3a3d4a', borderRadius: 8,
                      padding: '0 12px', cursor: 'pointer', color: '#94a3b8', flexShrink: 0,
                    }}
                    title="Ottieni prezzo corrente"
                  >
                    <RefreshCw size={14} style={{ animation: fetchingPrice ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Nome Asset</label>
                <input
                  style={inputStyle}
                  placeholder="Nome descrittivo"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>

            {/* Quick select */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Popolari:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(POPULAR[form.asset_type as keyof typeof POPULAR] || []).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, ticker: t, name: t }))}
                    style={{
                      background: form.ticker === t ? '#6366f1' : '#2a2d3a',
                      border: 'none', borderRadius: 6, padding: '4px 10px',
                      color: '#e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Tipo</label>
                <select style={inputStyle} value={form.transaction_type} onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))}>
                  <option value="buy">Acquisto</option>
                  <option value="sell">Vendita</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Quantità</label>
                <input style={inputStyle} type="number" step="any" min="0" placeholder="0.00" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Prezzo (USD)</label>
                <input style={inputStyle} type="number" step="any" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Data</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>

            {form.quantity && form.price && (
              <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#94a3b8', fontSize: 14 }}>
                Totale: <strong style={{ color: '#f1f5f9' }}>${(parseFloat(form.quantity || '0') * parseFloat(form.price || '0')).toFixed(2)}</strong>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Note (opzionale)</label>
              <input style={inputStyle} placeholder="Note aggiuntive..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >{loading ? 'Salvataggio...' : 'Salva Transazione'}</button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: '#2a2d3a', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
              >Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            Nessuna transazione. Aggiungi la tua prima operazione!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3a' }}>
                {['Data', 'Tipo', 'Asset', 'Quantità', 'Prezzo', 'Totale', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #1e2130', background: i % 2 === 0 ? 'transparent' : '#161820' }}>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>
                    {new Date(tx.date).toLocaleDateString('it-IT')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: tx.transaction_type === 'buy' ? '#1a2e1a' : '#2e1a1a',
                      color: tx.transaction_type === 'buy' ? '#10b981' : '#f43f5e',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    }}>{tx.transaction_type === 'buy' ? 'ACQUISTO' : 'VENDITA'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{tx.ticker}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{tx.asset_type}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{tx.quantity}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>${tx.price.toFixed(4)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>${tx.total_value.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
