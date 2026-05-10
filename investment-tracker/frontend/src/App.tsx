import { useState } from 'react'
import { LayoutDashboard, ArrowLeftRight, Bot, FileBarChart } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import AgentChat from './components/AgentChat'
import Reports from './components/Reports'

type Tab = 'dashboard' | 'transactions' | 'agent' | 'reports'

const tabs = [
  { id: 'dashboard' as Tab, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'transactions' as Tab, label: 'Transazioni', Icon: ArrowLeftRight },
  { id: 'agent' as Tab, label: 'Agente AI', Icon: Bot },
  { id: 'reports' as Tab, label: 'Report', Icon: FileBarChart },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220, background: '#1a1d27', borderRight: '1px solid #2a2d3a',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2a2d3a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileBarChart size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>InvestTrack</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>AI Portfolio Manager</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 12px', flex: 1 }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
                background: activeTab === id ? '#6366f120' : 'transparent',
                color: activeTab === id ? '#6366f1' : '#94a3b8',
                cursor: 'pointer', fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                marginBottom: 4, transition: 'all 0.15s',
              }}
            >
              <Icon size={18} />
              {label}
              {id === 'agent' && (
                <span style={{
                  marginLeft: 'auto', background: '#6366f1', color: '#fff',
                  fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                }}>AI</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2d3a' }}>
          <div style={{ fontSize: 11, color: '#3a3d4a', lineHeight: 1.5 }}>
            Powered by Claude claude-opus-4-7<br />
            MPT · Fama-French · Factor Investing
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'agent' && <AgentChat />}
        {activeTab === 'reports' && <Reports />}
      </main>
    </div>
  )
}
