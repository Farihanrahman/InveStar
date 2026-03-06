/**
 * Portfolio API Hooks
 * TanStack Query hooks for portfolio and transaction operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import portfolioService, {
  type FundTransactionPayload,
} from '@/services/oms/portfolioService';
import type { QueryOptions } from '@/lib/api/types';

/**
 * Hook for fetching transactions
 */
export const useTransactions = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['transactions', opts],
    queryFn: () => portfolioService.getTransactions(opts).then((res) => res.data),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for fetching portfolio
 */
export const usePortfolio = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['portfolio', opts],
    queryFn: () => portfolioService.getPortfolio(opts).then((res) => res.data),
    staleTime: 30000,
  });
};

/**
 * Hook for fetching portfolio details
 */
export const usePortfolioDetails = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['portfolioDetails', opts],
    queryFn: () => portfolioService.getPortfolioDetails(opts).then((res) => res.data),
    staleTime: 30000,
  });
};

/**
 * Hook for creating fund transaction (deposit/withdrawal)
 */
export const useFundTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientCode,
      ...payload
    }: { clientCode: string } & FundTransactionPayload) =>
      portfolioService.fundTransaction(clientCode, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] });
    },
  });
};

/**
 * Hook for uploading position file
 */
export const useUploadPositionFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => portfolioService.uploadPositionFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] });
    },
  });
};

