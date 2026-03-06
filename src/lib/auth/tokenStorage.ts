/**
 * OMS Token Storage Utility
 * Manages OMS authentication token in localStorage
 */

const OMS_TOKEN_KEY = 'oms_auth_token';
const OMS_USER_KEY = 'oms_user_data';
const AUTH_PROVIDER_KEY = 'auth_provider';

export type AuthProvider = 'oms' | 'google';

export interface OmsUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

/**
 * Store OMS authentication token
 */
export const setOmsToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OMS_TOKEN_KEY, token);
  }
};

/**
 * Get OMS authentication token
 */
export const getOmsToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(OMS_TOKEN_KEY);
  }
  return null;
};

/**
 * Remove OMS authentication token
 */
export const removeOmsToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OMS_TOKEN_KEY);
    localStorage.removeItem(OMS_USER_KEY);
    localStorage.removeItem(AUTH_PROVIDER_KEY);
  }
};

/**
 * Check if OMS token exists
 */
export const hasOmsToken = (): boolean => {
  return getOmsToken() !== null;
};

/**
 * Store OMS user data
 */
export const setOmsUser = (user: OmsUser): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OMS_USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get OMS user data
 */
export const getOmsUser = (): OmsUser | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem(OMS_USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData) as OmsUser;
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Store auth provider type
 */
export const setAuthProvider = (provider: AuthProvider): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_PROVIDER_KEY, provider);
  }
};

/**
 * Get auth provider type
 */
export const getAuthProvider = (): AuthProvider | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_PROVIDER_KEY) as AuthProvider | null;
  }
  return null;
};


