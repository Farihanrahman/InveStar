/**
 * useUserInfo Hook
 * Extracts and formats user information from OMS auth context
 * Centralizes the duplicated user name extraction logic
 */

import { useOmsAuth } from '@/lib/auth/omsAuthContext';

interface UserInfo {
  userName: string;
  userEmail: string | null;
  userInitial: string;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useUserInfo = (fallbackName = 'User'): UserInfo => {
  const { isAuthenticated, user, isLoading } = useOmsAuth();

  const userName = user?.full_name as string | undefined || 
    (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : undefined) ||
    user?.name as string | undefined || 
    user?.user_name as string | undefined ||
    user?.email?.split('@')[0] || 
    fallbackName;

  const userEmail = user?.email || null;
  const userInitial = userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U';
  const userId = user?.id ? String(user.id) : null;

  return {
    userName,
    userEmail,
    userInitial,
    userId,
    isAuthenticated,
    isLoading,
  };
};

export default useUserInfo;
