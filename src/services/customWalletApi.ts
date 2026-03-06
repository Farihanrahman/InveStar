// Custom Wallet Backend API Service
// This service handles all communication with your external wallet backend

export interface WalletBalance {
  usd: number;
  usdc: number;
  currency?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
  recipient?: string;
  sender?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  recipient?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

// This will be called via Edge Function to keep the API URL secure
// Even though auth isn't required, we still proxy through Edge Functions
// to avoid exposing your backend URL in the frontend

export const customWalletApi = {
  // Get wallet balance
  getBalance: async (userId: string): Promise<WalletBalance> => {
    const response = await fetch('/api/wallet/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  },

  // Get transaction history
  getTransactions: async (userId: string, limit = 50): Promise<Transaction[]> => {
    const response = await fetch('/api/wallet/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit }),
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  // Process a payment
  processPayment: async (userId: string, payment: PaymentRequest): Promise<PaymentResponse> => {
    const response = await fetch('/api/wallet/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payment }),
    });
    if (!response.ok) throw new Error('Payment failed');
    return response.json();
  },

  // Deposit funds
  deposit: async (userId: string, amount: number, currency: string): Promise<PaymentResponse> => {
    const response = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, currency }),
    });
    if (!response.ok) throw new Error('Deposit failed');
    return response.json();
  },

  // Withdraw funds
  withdraw: async (userId: string, amount: number, currency: string): Promise<PaymentResponse> => {
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, currency }),
    });
    if (!response.ok) throw new Error('Withdrawal failed');
    return response.json();
  },
};
