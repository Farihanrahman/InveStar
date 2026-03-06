/**
 * Order API Hooks
 * TanStack Query hooks for order management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService, {
  type CreateOrderPayload,
  type ReplaceOrderPayload,
  type Order,
  type PaginatedApiResponse,
} from '@/services/oms/orderService';
import type { QueryOptions } from '@/lib/api/types';
import { toast } from 'sonner';

/**
 * Hook for fetching orders
 */
export const useOrders = (opts: QueryOptions = {}) => {
  return useQuery<PaginatedApiResponse<Order>>({
    queryKey: ['orders', opts],
    queryFn: () => orderService.getOrders(opts).then((res) => res.data),
    staleTime: 30000, // 30 seconds
    enabled: !!opts.client_code, // Only fetch if client_code is provided
  });
};

/**
 * Hook for fetching order summary
 */
export const useOrderSummary = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['orderSummary', opts],
    queryFn: () => orderService.getOrderSummary(opts).then((res) => res.data),
    staleTime: 30000,
  });
};

/**
 * Hook for fetching symbol order summary
 */
export const useSymbolOrderSummary = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['symbolOrderSummary', opts],
    queryFn: () => orderService.getSymbolOrderSummary(opts).then((res) => res.data),
    staleTime: 30000,
  });
};

/**
 * Hook for fetching execution data
 */
export const useExecutionData = (payload: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['executionData', payload],
    queryFn: () => orderService.getExecutionData(payload).then((res) => res.data),
    staleTime: 10000, // 10 seconds for execution data
  });
};

/**
 * Hook for checking order status
 */
export const useOrderStatus = (orderId: string, opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ['orderStatus', orderId, opts],
    queryFn: () => orderService.checkStatus(orderId, opts).then((res) => res.data),
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

/**
 * Hook for creating an order
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSummary'] });
      queryClient.invalidateQueries({ queryKey: ['symbolOrderSummary'] });
    },
  });
};

/**
 * Hook for creating and submitting order to exchange (complete flow)
 */
export const useCreateAndSubmitOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.createAndSubmitOrder(payload),
    onSuccess: (response) => {
      const orderId = response?.data?.clientOrderId || response?.data?.id || 'Order';
      toast.success(`Order ${orderId} submitted successfully`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSummary'] });
      queryClient.invalidateQueries({ queryKey: ['symbolOrderSummary'] });
    },
    onError: (error: Error) => {
      toast.error(`Order failed: ${error.message}`);
    },
  });
};

/**
 * Hook for submitting order to exchange
 */
export const useSubmitToExchange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, opts }: { orderId: number; opts?: QueryOptions }) =>
      orderService.submitToExchange(orderId, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStatus'] });
    },
  });
};

/**
 * Hook for canceling an order
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSummary'] });
      queryClient.invalidateQueries({ queryKey: ['orderStatus'] });
    },
  });
};

/**
 * Hook for canceling all orders
 */
export const useCancelAllOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => orderService.cancelAllOrders(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSummary'] });
      queryClient.invalidateQueries({ queryKey: ['orderStatus'] });
    },
  });
};

/**
 * Hook for replacing/modifying an order
 */
export const useReplaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      isRelease = false,
    }: {
      id: string;
      payload: ReplaceOrderPayload;
      isRelease?: boolean;
    }) => orderService.replaceOrder(id, payload, isRelease),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStatus'] });
    },
  });
};

/**
 * Hook for exporting trade data
 */
export const useExportTradeData = () => {
  return useMutation({
    mutationFn: () => orderService.exportTradeData(),
    onSuccess: (response) => {
      // Create download link for blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trade-data.xml');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};

