/**
 * Dashboard Service
 * Handles dashboard data, indices, and news API calls
 */

import { itchClient, omsClient } from '@/lib/api/client';
import { objectToApiQueryString } from '@/lib/api/utils';
import type { AxiosResponse } from 'axios';
import type { QueryOptions } from '@/lib/api/types';

export interface DseIndex {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  [key: string]: unknown;
}

export interface DseIndexSymbol {
  id: string;
  indexId: string;
  symbol: string;
  weight?: number;
  [key: string]: unknown;
}

export interface CreateDseIndexSymbolPayload {
  indexId: string;
  symbol: string;
  weight?: number;
  [key: string]: unknown;
}

export interface UpdateDseIndexSymbolPayload {
  symbol?: string;
  weight?: number;
  [key: string]: unknown;
}

export interface TradeInformation {
  id: string;
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  [key: string]: unknown;
}

export interface News {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  source?: string;
  [key: string]: unknown;
}

const dashboardService = {
  /**
   * Get DSE indices
   */
  getDseIndices: (opts: QueryOptions = {}): Promise<AxiosResponse<DseIndex[]>> => {
    return itchClient.get(`/itch/dse-indices/filter${objectToApiQueryString(opts)}`);
  },

  /**
   * Get DSE index symbols
   */
  getDseIndexSymbols: (opts: QueryOptions = {}): Promise<AxiosResponse<DseIndexSymbol[]>> => {
    return itchClient.get(`/itch/dse-index-symbol${objectToApiQueryString(opts)}`);
  },

  /**
   * Create DSE index symbol
   */
  createDseIndexSymbol: (
    payload: CreateDseIndexSymbolPayload
  ): Promise<AxiosResponse<DseIndexSymbol>> => {
    return itchClient.post('/itch/dse-index-symbol', payload);
  },

  /**
   * Update DSE index symbol
   */
  updateDseIndexSymbol: (
    id: string,
    payload: UpdateDseIndexSymbolPayload
  ): Promise<AxiosResponse<DseIndexSymbol>> => {
    return itchClient.patch(`/itch/dse-index-symbol/${id}`, payload);
  },

  /**
   * Delete DSE index symbol
   */
  deleteDseIndexSymbol: (id: string): Promise<AxiosResponse<void>> => {
    return itchClient.delete(`/itch/dse-index-symbol/${id}`);
  },

  /**
   * Get trade informations
   */
  getTradeInformations: (opts: QueryOptions = {}): Promise<AxiosResponse<TradeInformation[]>> => {
    return itchClient.get(`/itch/trade-informations${objectToApiQueryString(opts)}`);
  },

  /**
   * Get trade informations by security codes (POST with body)
   */
  getTradeInformationsBySecurities: (
    securities: Array<{ securityCode: string; securitySubType: string }>,
    opts: QueryOptions = {}
  ): Promise<AxiosResponse<TradeInformation[]>> => {
    return itchClient.post(`/itch/trade-informations${objectToApiQueryString(opts)}`, securities);
  },

  /**
   * Get trade informations (light version - optimized payload)
   */
  getTradeInformationsLight: (opts: QueryOptions = {}): Promise<AxiosResponse<TradeInformation[]>> => {
    return itchClient.get(`/itch/trade-informations/light${objectToApiQueryString(opts)}`);
  },

  /**
   * Get single trade information
   */
  getSingleTradeInformation: (
    id: string,
    opts: QueryOptions = {}
  ): Promise<AxiosResponse<TradeInformation>> => {
    return omsClient.get(`/oms/trade-informations/${id}${objectToApiQueryString(opts)}`);
  },

  /**
   * Get news
   */
  getNews: (opts: QueryOptions = {}): Promise<AxiosResponse<News[]>> => {
    return itchClient.get(`/itch/news${objectToApiQueryString(opts)}`);
  },
};

export default dashboardService;

