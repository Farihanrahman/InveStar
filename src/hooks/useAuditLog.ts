import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ActionType = 'auth' | 'wallet' | 'trading' | 'settings' | 'security' | 'admin' | 'navigation';

interface AuditLogDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export const useAuditLog = () => {
  const logAction = useCallback(async (
    action: string,
    actionType: ActionType,
    details?: AuditLogDetails
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('Cannot log action: User not authenticated');
        return false;
      }

      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action,
          actionType,
          details: details || {},
        },
      });

      if (error) {
        console.error('Failed to log action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Audit log error:', error);
      return false;
    }
  }, []);

  // Convenience methods for common actions
  const logAuth = useCallback((action: string, details?: AuditLogDetails) => 
    logAction(action, 'auth', details), [logAction]);
  
  const logWallet = useCallback((action: string, details?: AuditLogDetails) => 
    logAction(action, 'wallet', details), [logAction]);
  
  const logTrading = useCallback((action: string, details?: AuditLogDetails) => 
    logAction(action, 'trading', details), [logAction]);
  
  const logSettings = useCallback((action: string, details?: AuditLogDetails) => 
    logAction(action, 'settings', details), [logAction]);
  
  const logSecurity = useCallback((action: string, details?: AuditLogDetails) => 
    logAction(action, 'security', details), [logAction]);

  return {
    logAction,
    logAuth,
    logWallet,
    logTrading,
    logSettings,
    logSecurity,
  };
};

export default useAuditLog;