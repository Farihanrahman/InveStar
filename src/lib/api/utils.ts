/**
 * API Utility Functions
 * Helper functions for API operations
 */

import type { QueryOptions } from './types';

/**
 * Convert object to API query string
 * Similar to Vue.js project's objectToApiQuaryString
 */
export const objectToApiQueryString = (obj: QueryOptions = {}): string => {
  const _obj = JSON.parse(JSON.stringify(obj));
  
  // Remove null, undefined, and empty string values
  Object.keys(_obj).forEach((k) => {
    if (_obj[k] == null || _obj[k] === '') {
      delete _obj[k];
    }
  });

  const string = Object.keys(_obj)
    .map((key) => {
      // Convert objects to JSON strings
      if (typeof _obj[key] === 'object') {
        _obj[key] = JSON.stringify(_obj[key]);
      }
      const value = _obj[key];
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');

  return string ? `?${string}` : '';
};

/**
 * Extract error message from API error
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          error?: {
            message?: string;
          };
        };
        status?: number;
      };
      message?: string;
    };

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }

    if (axiosError.response?.status) {
      return `Error with status code ${axiosError.response.status}`;
    }
  }

  if (error instanceof Error) {
    return `${error.message}. Please check your internet connection or, the contents might be blocked by your Browser.`;
  }

  return 'Something went wrong.';
};

/**
 * Check if error is unauthorized (401)
 */
export const isUnauthorizedError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    return axiosError.response?.status === 401;
  }
  return false;
};

/**
 * Check if request was cancelled
 */
export const isCancelledRequest = (error: unknown): boolean => {
  // Axios cancellation check
  if (error && typeof error === 'object') {
    return 'message' in error && 
           typeof error.message === 'string' && 
           (error.message.includes('cancel') || error.message === 'Cancelled unauthorized request');
  }
  return false;
};

