/**
 * Core API Client
 * Centralized Axios client with interceptors
 * Similar to Vue.js project's client.js but adapted for React/TypeScript
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getApiUrl, APP_ID, OMS_API_VERSION, getLocalTimeZone } from './constants';
import { extractErrorMessage, isUnauthorizedError, isCancelledRequest } from './utils';
import { getOmsToken, getOmsUser, removeOmsToken } from '@/lib/auth/tokenStorage';
import type { RequestConfig, ServiceName } from './types';

// Extend AxiosRequestConfig to include our custom options
declare module 'axios' {
  export interface AxiosRequestConfig {
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
}

/**
 * Create an Axios client instance for a specific service
 * @param serviceName - Service name ('default', 'oms', or 'itch')
 * @returns Configured Axios instance
 */
export default function createApiClient(serviceName: ServiceName = 'default'): AxiosInstance {
  const baseURL = getApiUrl(serviceName);

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      'Accept': 'application/json',
      'app-id': APP_ID,
      'X-API-VERSION': OMS_API_VERSION,
      'Timezone': getLocalTimeZone(),
      'ngrok-skip-browser-warning': 'true',
    },
  });

  // Request interceptor
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Extract custom config options
      const showNotification = config.showNotification !== false;
      const notifyOptions = config.notifyOptions;
      const requiresAuth = config.requiresAuth !== false;
      const isLocalErrorHandling = config.isLocalErrorHandling === true;
      const triggerLogoutIfUnauthorized = config.triggerLogoutIfUnauthorized !== false;

      // Store these in the config for use in response interceptor
      (config as any)._showNotification = showNotification;
      (config as any)._notifyOptions = notifyOptions;
      (config as any)._isLocalErrorHandling = isLocalErrorHandling;
      (config as any)._triggerLogoutIfUnauthorized = triggerLogoutIfUnauthorized;

      // Get authentication token from OMS
      if (requiresAuth) {
        try {
          const omsToken = getOmsToken();
          if (omsToken) {
            config.headers.Authorization = `Bearer ${omsToken}`;
            
            // Get user info for additional headers
            const user = getOmsUser();
            if (user) {
              config.headers['X-USER-ID'] = user.id;
              // Add senderSubId if available in user data (from API response)
              const senderSubId = (user as any).senderSubId || (user as any).sender_sub_id;
              if (senderSubId) {
                config.headers['X-SENDER-SUB-ID'] = String(senderSubId);
              }
              // Add tenant ID from user data if available
              if (user.tenant_id) {
                config.headers['x-tenant-id'] = user.tenant_id as string;
              }
            }
          } else {
            // Cancel request if auth is required but no token
            return Promise.reject(new Error('Cancelled unauthorized request'));
          }
        } catch (error) {
          if (requiresAuth) {
            return Promise.reject(new Error('Cancelled unauthorized request'));
          }
        }
      }

      // Add tenant ID from localStorage if not already set
      if (typeof window !== 'undefined' && !config.headers['x-tenant-id']) {
        const tenantId = localStorage.getItem('x-tenant-id');
        if (tenantId) {
          config.headers['x-tenant-id'] = tenantId;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      const config = response.config as InternalAxiosRequestConfig & {
        _showNotification?: boolean;
        _notifyOptions?: RequestConfig['notifyOptions'];
      };

      const showNotification = config._showNotification !== false;
      const notifyOptions = config._notifyOptions;

      // Show success notifications based on method
      if (showNotification && config.method) {
        if (config.method === 'post' && notifyOptions) {
          toast.success(notifyOptions.message || 'Successfully Created', {
            description: notifyOptions.description,
          });
        } else if (config.method === 'post') {
          toast.success('Successfully Created');
        } else if (config.method === 'put' && notifyOptions) {
          toast.success(notifyOptions.message || 'Successfully Updated', {
            description: notifyOptions.description,
          });
        } else if (config.method === 'put') {
          toast.success('Successfully Updated');
        } else if (config.method === 'delete' && notifyOptions) {
          toast.success(notifyOptions.message || 'Successfully Deleted', {
            description: notifyOptions.description,
          });
        } else if (config.method === 'delete') {
          toast.success('Successfully Deleted');
        } else if (notifyOptions && config.method === 'get') {
          const toastType = notifyOptions.type || 'success';
          if (toastType === 'success') {
            toast.success(notifyOptions.message || 'Success', {
              description: notifyOptions.description,
            });
          } else if (toastType === 'error') {
            toast.error(notifyOptions.message || 'Error', {
              description: notifyOptions.description,
            });
          } else if (toastType === 'info') {
            toast.info(notifyOptions.message || 'Info', {
              description: notifyOptions.description,
            });
          } else if (toastType === 'warning') {
            toast.warning(notifyOptions.message || 'Warning', {
              description: notifyOptions.description,
            });
          }
        }
      }

      return response;
    },
    async (error) => {
      const config = error.config as (InternalAxiosRequestConfig & {
        _isLocalErrorHandling?: boolean;
        _triggerLogoutIfUnauthorized?: boolean;
      }) | undefined;

      const isLocalErrorHandling = config?._isLocalErrorHandling === true;
      const triggerLogoutIfUnauthorized = config?._triggerLogoutIfUnauthorized !== false;

      // Handle cancelled requests
      if (isCancelledRequest(error) || axios.isCancel(error)) {
        return Promise.reject(error);
      }

      // Skip error handling if local error handling is enabled
      if (isLocalErrorHandling) {
        return Promise.reject(error);
      }

      const message = extractErrorMessage(error);
      const unauthorized = isUnauthorizedError(error);
      const status = error?.response?.status;

      // Handle unauthorized errors
      if (unauthorized && triggerLogoutIfUnauthorized) {
        toast.error('Session expired. Please log in again.');
        // Clear OMS token
        removeOmsToken();
        // Redirect to auth page if we're in a browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      } else if (!unauthorized && status !== 404) {
        // Show error toast for non-unauthorized, non-404 errors
        // 404s are silenced as they typically mean the API endpoint is unavailable
        toast.error(message);
      } else if (status === 404) {
        console.warn('API endpoint not found (404):', error?.config?.url);
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

// Export pre-configured clients for each service
export const apiClient = createApiClient('default');
export const omsClient = createApiClient('oms');
export const itchClient = createApiClient('itch');

