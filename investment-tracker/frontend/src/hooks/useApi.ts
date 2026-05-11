import axios from 'axios'
import type { PortfolioSummary, Transaction, Allocation, ChatMessage, Report } from '../types'

const api = axios.create({ baseURL: '/api' })

export const portfolioApi = {
  getSummary: (): Promise<PortfolioSummary> =>
    api.get('/portfolio/summary').then(r => r.data),
  getAllocation: (): Promise<Allocation> =>
    api.get('/portfolio/allocation').then(r => r.data),
}

export const transactionsApi = {
  list: (): Promise<Transaction[]> =>
    api.get('/transactions/').then(r => r.data),
  add: (tx: Omit<Transaction, 'id' | 'total_value'>): Promise<{ id: string }> =>
    api.post('/transactions/', tx).then(r => r.data),
  delete: (id: string): Promise<void> =>
    api.delete(`/transactions/${id}`).then(r => r.data),
  getPrice: (assetType: string, ticker: string): Promise<{ ticker: string; price: number }> =>
    api.get(`/transactions/price/${assetType}/${ticker}`).then(r => r.data),
}

export const agentApi = {
  chat: (message: string, history: ChatMessage[]): Promise<{ response: string }> =>
    api.post('/agent/chat', {
      message,
      history: history.map(m => ({ role: m.role, content: m.content })),
    }).then(r => r.data),
  generateReport: (): Promise<Report> =>
    api.post('/agent/report').then(r => r.data),
  listReports: (): Promise<Report[]> =>
    api.get('/agent/reports').then(r => r.data),
}
