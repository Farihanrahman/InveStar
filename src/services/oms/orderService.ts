/**
 * Order Service
 * Handles all order management API calls
 */

import { omsClient } from '@/lib/api/client';
import { objectToApiQueryString } from '@/lib/api/utils';
import type { AxiosResponse } from 'axios';
import type { QueryOptions } from '@/lib/api/types';

const RESOURCE_NAME = '/oms/v1/orders';

export interface CreateOrderPayload {
  symbol: string;
  clientCode: string;
  type: 'LIMIT' | 'MARKET';
  timeInForce: 'DAY' | 'FOK' | 'IOC' | 'GTC';
  securitySubType: string;
  side: 'BUY' | 'SELL';
  assetClass: string;
  companyCategory?: string;
  marketStatus?: string;
  quantity: number;
  price?: number;
  [key: string]: unknown;
}

export interface CreateOrderResponse {
  id: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  clientOrderId: string;
  clientCode: string;
  senderSubId: string;
  ownerDealerId: string;
  messageType: string;
  boId: string;
  symbol: string;
  isin: string;
  securitySubType: string;
  quantity: number;
  fillQuantity: number;
  type: string;
  price: number;
  side: string;
  status: string;
  timeInForce: string;
  accountType: string;
  rawMessage: string;
  parties: Array<{
    id: number;
    version: number;
    createdAt: string;
    updatedAt: string;
    partyId: string;
  }>;
  orderExecutionReports: unknown[];
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  title: string;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  timestamp: string;
  status: number;
  title: string;
  message: string;
  size: number;
  page: number;
  totalPages: number;
  totalRecords: number;
  data: T[];
}

export interface ReplaceOrderPayload {
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}

export interface Order {
  id: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  clientOrderId: string;
  clientCode: string;
  dseOrderId?: string;
  senderSubId: string;
  ownerDealerId: string;
  messageType: string;
  boId: string;
  symbol: string;
  isin: string;
  securitySubType: string;
  quantity: number;
  fillQuantity: number;
  leavesQuantity: number;
  type: string;
  price: number;
  side: string;
  status: string;
  executionType: string;
  fillType?: string;
  timeInForce: string;
  accountType: string;
  transactTime?: string;
  tradeDate?: string;
  settlementDate?: string;
  rawMessage?: string;
  [key: string]: unknown;
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  executedOrders: number;
  [key: string]: unknown;
}

export interface ExecutionReport {
  id: string;
  orderId: string;
  symbol: string;
  executedQuantity: number;
  executedPrice: number;
  [key: string]: unknown;
}

const orderService = {
  /**
   * Create a new order
   */
  createOrder: (payload: CreateOrderPayload): Promise<AxiosResponse<ApiResponse<CreateOrderResponse>>> => {
    return omsClient.post(RESOURCE_NAME, payload, {
      showNotification: false,
    });
  },

  /**
   * Submit order to exchange
   */
  submitToExchange: (orderId: number, opts: QueryOptions = {}): Promise<AxiosResponse<ApiResponse<CreateOrderResponse>>> => {
    return omsClient.get(
      `${RESOURCE_NAME}/submit-to-exchange/${orderId}${objectToApiQueryString(opts)}`
    );
  },

  /**
   * Create and submit order to exchange in one flow
   */
  createAndSubmitOrder: async (payload: CreateOrderPayload): Promise<ApiResponse<CreateOrderResponse>> => {
    // Step 1: Create the order
    const createResponse = await omsClient.post<ApiResponse<CreateOrderResponse>>(RESOURCE_NAME, payload, {
      showNotification: false,
    });

    const orderId = createResponse.data.data.id;

    // Step 2: Submit to exchange
    const submitResponse = await omsClient.get<ApiResponse<CreateOrderResponse>>(
      `${RESOURCE_NAME}/submit-to-exchange/${orderId}`
    );

    return submitResponse.data;
  },

  /**
   * Get orders with optional filters
   */
  getOrders: (opts: QueryOptions = {}): Promise<AxiosResponse<PaginatedApiResponse<Order>>> => {
    return omsClient.get(`${RESOURCE_NAME}${objectToApiQueryString(opts)}`);
  },

  /**
   * Cancel an order
   */
  cancelOrder: (id: string): Promise<AxiosResponse<Order>> => {
    return omsClient.patch(`${RESOURCE_NAME}/${id}/cancel`);
  },

  /**
   * Replace/Modify an order
   */
  replaceOrder: (
    id: string,
    payload: ReplaceOrderPayload,
    isRelease = false
  ): Promise<AxiosResponse<Order>> => {
    return omsClient.put(`${RESOURCE_NAME}/${id}?isRelease=${isRelease}`, payload, {
      showNotification: false,
    });
  },

  /**
   * Get order summary
   */
  getOrderSummary: (opts: QueryOptions = {}): Promise<AxiosResponse<OrderSummary>> => {
    return omsClient.get(`${RESOURCE_NAME}/order-summary${objectToApiQueryString(opts)}`);
  },

  /**
   * Get symbol order summary
   */
  getSymbolOrderSummary: (opts: QueryOptions = {}): Promise<AxiosResponse<OrderSummary>> => {
    return omsClient.get(`${RESOURCE_NAME}/symbol/order-summary${objectToApiQueryString(opts)}`);
  },

  /**
   * Cancel all orders
   */
  cancelAllOrders: (): Promise<AxiosResponse<{ message: string }>> => {
    return omsClient.patch(`${RESOURCE_NAME}/cancel-all`);
  },

  /**
   * Get execution data/reports
   */
  getExecutionData: (payload: QueryOptions = {}): Promise<AxiosResponse<ExecutionReport[]>> => {
    return omsClient.get(`/oms/v1/execution-reports${objectToApiQueryString(payload)}`, {
      showNotification: false,
    });
  },

  /**
   * Export trade data as XML
   */
  exportTradeData: (): Promise<AxiosResponse<string>> => {
    return omsClient.get('/oms/v1/trade/download.xml', {
      responseType: 'blob',
    });
  },

  /**
   * Check order status
   */
  checkStatus: (orderId: string, opts: QueryOptions = {}): Promise<AxiosResponse<Order>> => {
    return omsClient.get(`${RESOURCE_NAME}/${orderId}/status${objectToApiQueryString(opts)}`);
  },
};

export default orderService;

