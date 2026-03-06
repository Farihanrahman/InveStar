/**
 * API Type Definitions
 * Shared types for API requests and responses
 */

import type { AxiosRequestConfig } from 'axios';

/**
 * Service name type for API clients
 */
export type ServiceName = 'default' | 'oms' | 'itch';

/**
 * Request configuration options
 */
export interface RequestConfig extends AxiosRequestConfig {
  showNotification?: boolean;
  notifyOptions?: {
    message?: string;
    description?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
  };
  requiresAuth?: boolean;
  isLocalErrorHandling?: boolean;
  triggerLogoutIfUnauthorized?: boolean;
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
  status?: number;
}

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}

/**
 * Generic API Response
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters (generic object)
 */
export type FilterParams = Record<string, unknown>;

/**
 * Query options combining pagination, sort, and filters
 */
export interface QueryOptions extends PaginationParams, SortParams {
  [key: string]: unknown;
}

