/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { getApiUrl } from '@/lib/api/constants';
import { supabase } from '@/integrations/supabase/client';
import type { AxiosResponse } from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AutoLoginData {
  token?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  status: string;
  message: string;
  companies: Array<{
    id: number;
    company_name: string;
  }>;
  roles: unknown[];
  session: {
    access_token: string;
    session_last_access: number;
    session_start: number;
    senderSubId: string;
  };
  user_info: {
    id: number;
    first_name: string;
    last_name: string;
    user_name: string;
    parent_id: number;
    email: string;
    email_verified_at: string | null;
    is_social: number;
    current_team_id: number | null;
    profile_photo_path: string | null;
    role: string;
    is_blocked: number;
    is_active: number;
    sort_order: number;
    old_id: number | null;
    created_at: string;
    updated_at: string;
    profile_photo_url: unknown;
    recovery_code: string | null;
    phone_mobile: string | null;
    skype_id: string | null;
    user_preference: unknown;
    last_seen: string;
    firebase_token: string | null;
    country_code: string | null;
    otp_code_expired_at: string | null;
    birth_date: string | null;
    blood_group: string;
    deleted_at: string | null;
    senderSubId: string;
    roles: unknown[];
    profile?: unknown;
    tenants?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface SetForgottenPasswordPayload {
  token: string;
  password: string;
  [key: string]: unknown;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  [key: string]: unknown;
}

const toAxiosResponse = <T>(data: T): AxiosResponse<T> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    // AxiosResponse requires this, but we don't have a real axios config here
    config: {} as any,
  }) as AxiosResponse<T>;

const getOmsBaseUrlOverride = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const raw = localStorage.getItem('OMS_API_BASE_URL_OVERRIDE');
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
};

const invokeOmsAuthProxy = async <T>(action: string, payload: unknown): Promise<T> => {
  const baseUrlOverride = getOmsBaseUrlOverride();

  const { data, error } = await supabase.functions.invoke('oms-auth-proxy', {
    body: { action, payload, baseUrlOverride },
  });

  if (error) {
    // supabase-js error objects are not always instances of Error
    throw new Error(error.message || 'OMS auth proxy error');
  }

  // Some upstream failures are returned as JSON with an `error` field
  if (data && typeof data === 'object' && 'error' in (data as any)) {
    throw new Error(String((data as any).error));
  }

  return data as T;
};

const authService = {
  /**
   * Login a user
   */
  login: async (data: LoginCredentials, service?: string): Promise<AxiosResponse<LoginResponse>> => {
    // Prefer backend proxy to avoid browser CORS/network issues
    try {
      const responseData = await invokeOmsAuthProxy<LoginResponse>('login', data);
      return toAxiosResponse(responseData);
    } catch (proxyErr) {
      // Fallback to direct call (useful in environments where OMS is reachable from the browser)
      return apiClient.post('login', data, {
        requiresAuth: false,
        notifyOptions: {
          message: 'Logged in successfully',
          type: 'success',
        },
      });
    }
  },

  /**
   * Auto login with token
   */
  autoLogin: async (data: AutoLoginData, service?: string): Promise<AxiosResponse<LoginResponse>> => {
    try {
      const responseData = await invokeOmsAuthProxy<LoginResponse>('auto_login', data);
      return toAxiosResponse(responseData);
    } catch (proxyErr) {
      return apiClient.post('auto-login', data, {
        requiresAuth: false,
        notifyOptions: {
          message: 'Logged in successfully',
          type: 'success',
        },
      });
    }
  },

  /**
   * Get social login URL
   */
  getSocialLoginUrl: (provider: string, redirectURL: string): string => {
    const baseUrl = getApiUrl('default');
    return `${baseUrl}/login-social/${provider}?frontend_redirect_url=${encodeURIComponent(redirectURL)}`;
  },

  /**
   * Logout current user
   */
  logout: (): Promise<AxiosResponse<void>> => {
    return apiClient.post('logout', null, {
      requiresAuth: false,
      notifyOptions: {
        message: 'User logged out successfully',
        type: 'success',
      },
    });
  },

  /**
   * Request password reset
   */
  forgotPassword: (payload: ForgotPasswordPayload): Promise<AxiosResponse<void>> => {
    return apiClient.get(`forgot-password?email=${encodeURIComponent(payload.email)}`, {
      requiresAuth: false,
      showNotification: false,
    });
  },

  /**
   * Set forgotten password with token
   */
  setForgottenPassword: (payload: SetForgottenPasswordPayload): Promise<AxiosResponse<void>> => {
    return apiClient.post('forgot-password', payload, {
      requiresAuth: false,
      showNotification: false,
    });
  },

  /**
   * Change password for authenticated user
   */
  changePassword: (id: string, payload: ChangePasswordPayload): Promise<AxiosResponse<void>> => {
    return apiClient.post(`change/password/${id}`, payload, {
      requiresAuth: false,
      notifyOptions: {
        message: 'Password changed successfully',
        type: 'success',
      },
    });
  },
};

export default authService;

