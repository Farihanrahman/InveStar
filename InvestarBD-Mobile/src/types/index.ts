export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  verified: boolean;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'bond' | 'mutual_fund' | 'crypto' | 'etf' | 'reit';
  currentPrice: number;
  change: number;
  changePercent: number;
  quantity: number;
  totalValue: number;
  logo?: string;
}

export interface Portfolio {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  investments: Investment[];
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  asset?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  fee?: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  completed: boolean;
  progress: number; // 0-100
  thumbnail?: string;
  category: string;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  logo?: string;
}

export interface WalletBalance {
  currency: string;
  balance: number;
  usdValue: number;
  logo?: string;
}