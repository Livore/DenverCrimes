export interface Holding {
  ticker: string
  name: string
  asset_type: string
  quantity: number
  avg_cost: number
  current_price: number
  current_value: number
  total_invested: number
  pnl: number
  pnl_pct: number
  weight: number
}

export interface PortfolioSummary {
  holdings: Holding[]
  total_value: number
  total_invested: number
  total_pnl: number
  total_pnl_pct: number
}

export interface Transaction {
  id: number
  asset_type: string
  ticker: string
  name: string
  quantity: number
  price: number
  total_value: number
  transaction_type: string
  date: string
  notes?: string
}

export interface AllocationItem {
  name: string
  value: number
  percentage: number
}

export interface Allocation {
  by_type: AllocationItem[]
  by_asset: AllocationItem[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Report {
  id: number
  content: string
  report_type: string
  created_at: string
}
