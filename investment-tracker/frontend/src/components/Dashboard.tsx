import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { portfolioApi } from '../hooks/useApi'
import type { PortfolioSummary, Allocation } from '../types'

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#fb923c', '#34d399']

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2a2d3a',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 13,
          marginTop: 4,
          color: positive === undefined ? '#94a3b8' : positive ? '#10b981' : '#f43f5e',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {positive !== undefined && (positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
          {sub}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [allocation, setAllocation] = useState<Allocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([portfolioApi.getSummary(), portfolioApi.getAllocation()])
      .then(([s, a]) => { setSummary(s); setAllocation(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, color: '#94a3b8' }}>Caricamento dati portafoglio...</div>
  if (!summary || summary.holdings.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <PieChart size={48} style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, marginBottom: 8 }}>Portafoglio vuoto</div>
        <div style={{ fontSize: 14 }}>Aggiungi la tua prima transazione per iniziare</div>
      </div>
    )
  }

  const isPositive = summary.total_pnl >= 0

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#f1f5f9' }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard
          label="Valore Totale"
          value={`$${summary.total_value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          sub="Portfolio attuale"
        />
        <StatCard
          label="Investito"
          value={`$${summary.total_invested.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          sub="Capitale investito"
        />
        <StatCard
          label="P&L Totale"
          value={`${isPositive ? '+' : ''}$${summary.total_pnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          sub={`${isPositive ? '+' : ''}${summary.total_pnl_pct.toFixed(2)}% rendimento`}
          positive={isPositive}
        />
        <StatCard
          label="Asset"
          value={`${summary.holdings.length}`}
          sub="Asset in portafoglio"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Allocation chart */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>Allocazione per Tipo</h3>
          {allocation && allocation.by_type.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={allocation.by_type}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {allocation.by_type.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Valore']} />
              </RechartsPie>
            </ResponsiveContainer>
          ) : <div style={{ color: '#64748b', fontSize: 14 }}>Nessun dato</div>}
        </div>

        {/* Holdings pie */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>Top Holdings</h3>
          {allocation && allocation.by_asset.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={allocation.by_asset.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="ticker"
                >
                  {allocation.by_asset.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Valore']} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          ) : <div style={{ color: '#64748b', fontSize: 14 }}>Nessun dato</div>}
        </div>
      </div>

      {/* Holdings table */}
      <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2d3a' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Portafoglio</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3a' }}>
                {['Asset', 'Tipo', 'Quantità', 'Costo Medio', 'Prezzo', 'Valore', 'P&L', 'Peso'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.holdings.map((h, i) => (
                <tr key={h.ticker} style={{ borderBottom: '1px solid #1e2130', background: i % 2 === 0 ? 'transparent' : '#161820' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{h.ticker}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{h.name}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: h.asset_type === 'crypto' ? '#1e293b' : h.asset_type === 'etf' ? '#1a2e1a' : '#1a1a2e',
                      color: h.asset_type === 'crypto' ? '#f59e0b' : h.asset_type === 'etf' ? '#10b981' : '#6366f1',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>{h.asset_type.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{h.quantity.toFixed(4)}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>${h.avg_cost.toFixed(4)}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>${h.current_price.toFixed(4)}</td>
                  <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600 }}>${h.current_value.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: h.pnl >= 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                      {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: h.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                      {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{h.weight.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
