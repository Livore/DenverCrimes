import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Lightbulb } from 'lucide-react'
import { agentApi } from '../hooks/useApi'
import type { ChatMessage } from '../types'

const SUGGESTIONS = [
  'Analizza la diversificazione del mio portafoglio secondo la Modern Portfolio Theory',
  'Qual è il rischio di concentrazione del mio portafoglio?',
  'Cosa dice il modello Fama-French sui miei investimenti?',
  'Dovrei ribilanciare il portafoglio? Secondo quali criteri?',
  'Come posso ridurre la volatilità mantenendo il rendimento atteso?',
  'Analizza i miei asset peggiori: devo venderli o tenerli?',
]

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#6366f1' : '#1e2a3a',
        border: `1px solid ${isUser ? '#6366f1' : '#2a3a4a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#22d3ee" />}
      </div>
      <div style={{
        maxWidth: '78%',
        background: isUser ? '#3730a3' : '#1a1d27',
        border: `1px solid ${isUser ? '#4338ca' : '#2a2d3a'}`,
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        padding: '12px 16px',
        color: '#e2e8f0',
        fontSize: 14,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Ciao! Sono il tuo agente di analisi finanziaria. Ho studiato le principali strategie accademiche di investimento: Modern Portfolio Theory (Markowitz), CAPM (Sharpe), Fama-French Factor Model, Efficient Market Hypothesis, e molto altro.\n\nPosso analizzare il tuo portafoglio, calcolare metriche di rischio, e darti consigli basati sull\'evidenza accademica. Come posso aiutarti?',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const apiHistory = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
      const data = await agentApi.chat(msg, apiHistory)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore nella comunicazione con l\'agente. Riprova.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#f1f5f9', flexShrink: 0 }}>
        Agente AI — Analisi Finanziaria
      </h2>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#64748b', fontSize: 13 }}>
            <Lightbulb size={14} /> Suggerimenti
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  background: '#1a1d27', border: '1px solid #2a2d3a',
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                  color: '#94a3b8', fontSize: 13, textAlign: 'left',
                  transition: 'border-color 0.2s',
                }}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#0f1117',
        border: '1px solid #2a2d3a', borderRadius: 12, padding: '20px',
        marginBottom: 16,
      }}>
        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2a3a', border: '1px solid #2a3a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#22d3ee" />
            </div>
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '12px 12px 12px 4px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#22d3ee',
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        <input
          style={{
            flex: 1, background: '#1a1d27', border: '1px solid #2a2d3a',
            borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none',
          }}
          placeholder="Chiedi un'analisi del portafoglio, consigli di investimento..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            background: '#6366f1', border: 'none', borderRadius: 10,
            padding: '12px 20px', cursor: 'pointer', color: '#fff',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
