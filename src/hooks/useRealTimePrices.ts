/**
 * useRealTimePrices Hook
 * Fetches and manages real-time price data for stocks
 * Centralizes the duplicated price fetching logic
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
}

interface UseRealTimePricesOptions {
  symbols: string[];
  refreshInterval?: number; // milliseconds, default 30000
  enabled?: boolean;
}

interface UseRealTimePricesReturn {
  prices: Record<string, StockPrice>;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useRealTimePrices = ({
  symbols,
  refreshInterval = 30000,
  enabled = true,
}: UseRealTimePricesOptions): UseRealTimePricesReturn => {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!enabled || symbols.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-real-time-prices', {
        body: { symbols }
      });

      if (fetchError) throw fetchError;

      if (data?.prices) {
        setPrices(data.prices);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching real-time prices:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch prices'));
    } finally {
      setIsLoading(false);
    }
  }, [symbols, enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchPrices();
    
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval, enabled]);

  return {
    prices,
    lastUpdated,
    isLoading,
    error,
    refresh: fetchPrices,
  };
};

/**
 * Helper to get price data for a stock with fallback
 */
export const getStockPriceData = (
  symbol: string,
  realTimePrices: Record<string, StockPrice>,
  basePrice: number,
  baseChange: number,
  isBDT = false
) => {
  const rtPrice = realTimePrices[symbol];
  const price = rtPrice?.price ?? basePrice;
  const change = rtPrice?.change ?? baseChange;
  const previousClose = price - change;
  const changePercent = rtPrice?.changePercent ?? (previousClose > 0 ? ((change / previousClose) * 100) : 0);
  
  const currencySymbol = isBDT ? "৳" : "$";
  
  return {
    price,
    change,
    changePercent,
    formattedPrice: `${currencySymbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedChange: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
    formattedChangePercent: change >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
    isPositive: change >= 0,
  };
};

export default useRealTimePrices;
