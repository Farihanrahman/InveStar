/**
 * Dashboard API Hooks
 * TanStack Query hooks for dashboard data, indices, and news
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dashboardService, {
  type CreateDseIndexSymbolPayload,
  type UpdateDseIndexSymbolPayload,
} from "@/services/oms/dashboardService";
import type { QueryOptions } from "@/lib/api/types";

/**
 * Hook for fetching DSE indices
 */
export const useDseIndices = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["dseIndices", opts],
    queryFn: () => dashboardService.getDseIndices(opts).then((res) => res.data),
    staleTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });
};

/**
 * Hook for fetching DSE index symbols
 */
export const useDseIndexSymbols = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["dseIndexSymbols", opts],
    queryFn: () => dashboardService.getDseIndexSymbols(opts).then((res) => res.data),
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook for fetching trade informations
 */
export const useTradeInformations = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tradeInformations", opts],
    queryFn: () => dashboardService.getTradeInformations(opts).then((res) => res.data),
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds for live data
  });
};

/**
 * Watchlist item for localStorage storage
 */
export interface WatchlistSecurityItem {
  securityCode: string;
  securitySubType: string;
}

/**
 * Hook for fetching trade informations by security codes (for watchlist)
 */
export const useTradeInformationsBySecurities = (securities: WatchlistSecurityItem[], opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tradeInformationsBySecurities", securities, opts],
    queryFn: () => dashboardService.getTradeInformationsBySecurities(securities, opts).then((res) => res.data),
    enabled: securities.length > 0,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds for live data
  });
};

/**
 * Hook for fetching trade informations (light version - optimized payload)
 */
export const useTradeInformationsLight = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tradeInformationsLight", opts],
    queryFn: () => dashboardService.getTradeInformationsLight(opts).then((res) => res.data),
    staleTime: 10000, // 10 seconds
    // refetchInterval: 15000, // Refetch every 15 seconds for live data
    refetchInterval: false, // disable polling
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

/**
 * Hook for fetching single trade information
 */
export const useSingleTradeInformation = (id: string, opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tradeInformation", id, opts],
    queryFn: () => dashboardService.getSingleTradeInformation(id, opts).then((res) => res.data),
    enabled: !!id,
    staleTime: 10000,
  });
};

/**
 * Hook for fetching news
 */
export const useNews = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["news", opts],
    queryFn: () => dashboardService.getNews(opts).then((res) => res.data),
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook for creating DSE index symbol
 */
export const useCreateDseIndexSymbol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDseIndexSymbolPayload) => dashboardService.createDseIndexSymbol(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dseIndexSymbols"] });
    },
  });
};

/**
 * Hook for updating DSE index symbol
 */
export const useUpdateDseIndexSymbol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateDseIndexSymbolPayload) =>
      dashboardService.updateDseIndexSymbol(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dseIndexSymbols"] });
    },
  });
};

/**
 * Hook for deleting DSE index symbol
 */
export const useDeleteDseIndexSymbol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dashboardService.deleteDseIndexSymbol(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dseIndexSymbols"] });
    },
  });
};
