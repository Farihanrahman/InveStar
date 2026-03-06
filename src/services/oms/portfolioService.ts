/**
 * Portfolio Service
 * Handles all portfolio and transaction-related API calls
 */

import { omsClient } from '@/lib/api/client';
import { objectToApiQueryString } from '@/lib/api/utils';
import type { AxiosResponse } from 'axios';
import type { QueryOptions } from '@/lib/api/types';

const RESOURCE_NAME = '/oms/v1/client';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Portfolio {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  [key: string]: unknown;
}

export interface PortfolioDetails {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  positions: Portfolio[];
  [key: string]: unknown;
}

export interface FundTransactionPayload {
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  [key: string]: unknown;
}

export interface PositionFileUploadPayload {
  file: File | Blob;
  [key: string]: unknown;
}

const portfolioService = {
  /**
   * Get transactions
   */
  getTransactions: (opts: QueryOptions = {}): Promise<AxiosResponse<Transaction[]>> => {
    return omsClient.get(`${RESOURCE_NAME}/transaction${objectToApiQueryString(opts)}`);
  },

  /**
   * Get portfolio
   */
  getPortfolio: (opts: QueryOptions = {}): Promise<AxiosResponse<Portfolio[]>> => {
    return omsClient.get(`${RESOURCE_NAME}/portfolio${objectToApiQueryString(opts)}`);
  },

  /**
   * Get portfolio details
   */
  getPortfolioDetails: (opts: QueryOptions = {}): Promise<AxiosResponse<PortfolioDetails>> => {
    return omsClient.get(`${RESOURCE_NAME}/portfolio-details${objectToApiQueryString(opts)}`);
  },

  /**
   * Create fund transaction (deposit/withdrawal)
   */
  fundTransaction: (
    clientCode: string,
    body: FundTransactionPayload
  ): Promise<AxiosResponse<Transaction>> => {
    return omsClient.post(
      `${RESOURCE_NAME}/fund-transaction${objectToApiQueryString({ clientCode })}`,
      body
    );
  },

  /**
   * Upload position file
   */
  uploadPositionFile: (payload: FormData): Promise<AxiosResponse<{ message: string }>> => {
    return omsClient.post(`${RESOURCE_NAME}/import/position`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default portfolioService;

