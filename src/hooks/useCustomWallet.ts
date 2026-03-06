import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomWalletBalance {
  usd: number;
  usdc: number;
}

export interface CustomTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  recipient?: string;
  description?: string;
}

export const useCustomWallet = () => {
  const [balance, setBalance] = useState<CustomWalletBalance | null>(null);
  const [transactions, setTransactions] = useState<CustomTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('custom-wallet-proxy', {
        body: { 
          action: 'get_balance',
          userId: session.user.id 
        },
      });

      if (fnError) throw fnError;
      setBalance(data.balance);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit = 50) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('custom-wallet-proxy', {
        body: { 
          action: 'get_transactions',
          userId: session.user.id,
          limit 
        },
      });

      if (fnError) throw fnError;
      setTransactions(data.transactions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(message);
      console.error('Transactions fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (payment: PaymentRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error: fnError } = await supabase.functions.invoke('custom-wallet-proxy', {
        body: { 
          action: 'process_payment',
          userId: session.user.id,
          ...payment 
        },
      });

      if (fnError) throw fnError;
      
      if (data.success) {
        toast.success('Payment processed successfully');
        await fetchBalance(); // Refresh balance
        await fetchTransactions(); // Refresh transactions
      } else {
        toast.error(data.error || 'Payment failed');
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance, fetchTransactions]);

  const deposit = useCallback(async (amount: number, currency: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error: fnError } = await supabase.functions.invoke('custom-wallet-proxy', {
        body: { 
          action: 'deposit',
          userId: session.user.id,
          amount,
          currency 
        },
      });

      if (fnError) throw fnError;
      
      if (data.success) {
        toast.success('Deposit successful');
        await fetchBalance();
        await fetchTransactions();
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance, fetchTransactions]);

  const withdraw = useCallback(async (amount: number, currency: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error: fnError } = await supabase.functions.invoke('custom-wallet-proxy', {
        body: { 
          action: 'withdraw',
          userId: session.user.id,
          amount,
          currency 
        },
      });

      if (fnError) throw fnError;
      
      if (data.success) {
        toast.success('Withdrawal successful');
        await fetchBalance();
        await fetchTransactions();
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance, fetchTransactions]);

  // Load initial data
  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    isLoading,
    error,
    fetchBalance,
    fetchTransactions,
    processPayment,
    deposit,
    withdraw,
    refresh: () => {
      fetchBalance();
      fetchTransactions();
    },
  };
};

export default useCustomWallet;
