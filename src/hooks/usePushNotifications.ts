import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOmsAuth } from '@/lib/auth/omsAuthContext';

export const usePushNotifications = () => {
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;

  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!userId) {
      console.log('No user logged in, skipping token save');
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      // Upsert the token (insert or update if exists)
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          { user_id: userId, token, platform },
          { onConflict: 'user_id,token' }
        );

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, [userId]);

  useEffect(() => {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    const initPushNotifications = async () => {
      try {
        // Request permission
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
          console.log('Push notifications registered');
        } else {
          console.log('Push notification permission denied');
        }

        // Listen for registration
        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          await saveTokenToDatabase(token.value);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error: ', error);
        });

        // Listen for push notifications received
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          toast.info(notification.title || 'New notification', {
            description: notification.body
          });
        });

        // Listen for push notification actions
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed: ', notification);
        });

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [saveTokenToDatabase]);

  return null;
};
