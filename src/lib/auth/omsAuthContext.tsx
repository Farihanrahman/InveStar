/**
 * OMS Authentication Context
 * Provides OMS authentication state and methods throughout the app
 * Supports both OMS email/password login and Google OAuth login
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getOmsToken, getOmsUser, setOmsToken, setOmsUser, removeOmsToken,
  getAuthProvider, setAuthProvider,
  type OmsUser, type AuthProvider,
} from './tokenStorage';
import { supabase } from '@/integrations/supabase/client';

interface OmsAuthContextType {
  isAuthenticated: boolean;
  user: OmsUser | null;
  token: string | null;
  authProvider: AuthProvider | null;
  setAuth: (token: string, user: OmsUser, provider?: AuthProvider) => void;
  clearAuth: () => void | Promise<void>;
  isLoading: boolean;
}

const OmsAuthContext = createContext<OmsAuthContextType | undefined>(undefined);

export const useOmsAuth = () => {
  const context = useContext(OmsAuthContext);
  if (context === undefined) {
    throw new Error('useOmsAuth must be used within an OmsAuthProvider');
  }
  return context;
};

interface OmsAuthProviderProps {
  children: ReactNode;
}

export const OmsAuthProvider = ({ children }: OmsAuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<OmsUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [provider, setProvider] = useState<AuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      // First check localStorage for existing OMS/Google token
      const storedToken = getOmsToken();
      const storedUser = getOmsUser();
      const storedProvider = getAuthProvider();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setProvider(storedProvider);
        setIsAuthenticated(true);
      } else {
        // No stored OMS auth: check for Supabase session (e.g. after Google OAuth redirect)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const googleUser: OmsUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
            };
            setToken(session.access_token);
            setUser(googleUser);
            setProvider('google');
            setIsAuthenticated(true);
            setOmsToken(session.access_token);
            setOmsUser(googleUser);
            setAuthProvider('google');
          }
        } catch {
          // Session check failed, remain unauthenticated
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const setAuth = (newToken: string, newUser: OmsUser, newProvider: AuthProvider = 'oms') => {
    setOmsToken(newToken);
    setOmsUser(newUser);
    setAuthProvider(newProvider);
    setToken(newToken);
    setUser(newUser);
    setProvider(newProvider);
    setIsAuthenticated(true);
  };

  const clearAuth = async () => {
    if (provider === 'google') {
      try {
        await supabase.auth.signOut();
      } catch {
        // Best effort: clear local state even if signOut fails
      }
    }
    removeOmsToken();
    setToken(null);
    setUser(null);
    setProvider(null);
    setIsAuthenticated(false);
  };

  const value: OmsAuthContextType = {
    isAuthenticated,
    user,
    token,
    authProvider: provider,
    setAuth,
    clearAuth,
    isLoading,
  };

  return <OmsAuthContext.Provider value={value}>{children}</OmsAuthContext.Provider>;
};
