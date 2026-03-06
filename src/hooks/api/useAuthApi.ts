/**
 * Authentication API Hooks
 * TanStack Query hooks for authentication operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import authService, {
  type LoginCredentials,
  type AutoLoginData,
  type ForgotPasswordPayload,
  type SetForgottenPasswordPayload,
  type ChangePasswordPayload,
} from '@/services/oms/authService';
import { setOmsToken, setOmsUser, type OmsUser } from '@/lib/auth/tokenStorage';
import { useOmsAuth } from '@/lib/auth/omsAuthContext';
import { toast } from 'sonner';

/**
 * Hook for user login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const response = await authService.login(data);
      return response.data; // Return just the data part
    },
    onSuccess: async (data) => {
      // Extract token from session.access_token and user from user_info
      const token = data?.session?.access_token;
      const userInfo = data?.user_info as Record<string, unknown> | undefined;
      
      // Store OMS token and user data
      if (token) {
        setOmsToken(token);
      }
      
      if (userInfo) {
        // Get tenant info if available
        const tenants = userInfo.tenants as Array<{ id?: number | string }> | undefined;
        const tenantId = tenants?.[0]?.id;
        
        // Map user_info to OmsUser format
        const user: OmsUser = {
          id: String(userInfo.id ?? ''),
          email: userInfo.email as string | undefined,
          first_name: userInfo.first_name as string | undefined,
          last_name: userInfo.last_name as string | undefined,
          user_name: userInfo.user_name as string | undefined,
          role: userInfo.role as string | undefined,
          senderSubId: userInfo.senderSubId as string | undefined,
          tenant_id: tenantId ? String(tenantId) : undefined,
          ...userInfo,
        };
        setOmsUser(user);
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      // Avoid logging full Axios error objects (they may include credentials in config)
      const safeMessage =
        error instanceof Error ? error.message : (error as any)?.message || 'Login failed';
      console.error('Login error:', safeMessage);
    },
  });
};

/**
 * Hook for auto login
 */
export const useAutoLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AutoLoginData) => authService.autoLogin(data),
    onSuccess: async (response) => {
      const { data } = response;
      
      // Extract token from session.access_token and user from user_info
      const token = data?.session?.access_token;
      const userInfo = data?.user_info as Record<string, unknown> | undefined;
      
      // Store OMS token and user data
      if (token) {
        setOmsToken(token);
      }
      
      if (userInfo) {
        // Get tenant info if available
        const tenants = userInfo.tenants as Array<{ id?: number | string }> | undefined;
        const tenantId = tenants?.[0]?.id;
        
        // Map user_info to OmsUser format
        const user: OmsUser = {
          id: String(userInfo.id ?? ''),
          email: userInfo.email as string | undefined,
          first_name: userInfo.first_name as string | undefined,
          last_name: userInfo.last_name as string | undefined,
          user_name: userInfo.user_name as string | undefined,
          role: userInfo.role as string | undefined,
          senderSubId: userInfo.senderSubId as string | undefined,
          tenant_id: tenantId ? String(tenantId) : undefined,
          ...userInfo,
        };
        setOmsUser(user);
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearAuth, authProvider } = useOmsAuth();

  const clearAuthAndRedirect = async () => {
    // Clear auth (and Supabase session when provider is Google), then redirect
    await clearAuth();
    queryClient.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  };

  return useMutation({
    // Skip OMS logout API for Google users (no OMS session; would 404)
    mutationFn: (): Promise<void> =>
      authProvider === 'google' ? Promise.resolve() : authService.logout().then(() => undefined),
    onSuccess: () => {
      void clearAuthAndRedirect();
    },
    onError: () => {
      // Even if logout API fails, clear local auth state and redirect
      void clearAuthAndRedirect();
    },
  });
};

/**
 * Hook for forgot password
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.');
    },
    onError: (error) => {
      console.error('Forgot password error:', error);
    },
  });
};

/**
 * Hook for setting forgotten password
 */
export const useSetForgottenPassword = () => {
  return useMutation({
    mutationFn: (payload: SetForgottenPasswordPayload) =>
      authService.setForgottenPassword(payload),
    onSuccess: () => {
      toast.success('Password reset successfully. You can now log in.');
    },
    onError: (error) => {
      console.error('Set forgotten password error:', error);
    },
  });
};

/**
 * Hook for changing password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & ChangePasswordPayload) =>
      authService.changePassword(id, payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      console.error('Change password error:', error);
    },
  });
};

