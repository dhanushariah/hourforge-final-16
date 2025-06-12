
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const useTimerNotifications = () => {
  const lastNotificationRef = useRef<string>('');
  const lastNotificationTimeRef = useRef<number>(0);

  const showNotification = useCallback((type: 'start' | 'pause' | 'resume' | 'end' | 'reset', message: string) => {
    const now = Date.now();
    const notificationKey = `${type}-${message}`;
    
    // Prevent duplicate notifications within 2 seconds
    if (lastNotificationRef.current === notificationKey && (now - lastNotificationTimeRef.current) < 2000) {
      return;
    }
    
    lastNotificationRef.current = notificationKey;
    lastNotificationTimeRef.current = now;
    
    switch (type) {
      case 'start':
        toast.success(message, {
          icon: '▶️',
          duration: 2000,
        });
        break;
      case 'pause':
        toast.info(message, {
          icon: '⏸️',
          duration: 2000,
        });
        break;
      case 'resume':
        toast.success(message, {
          icon: '▶️',
          duration: 2000,
        });
        break;
      case 'end':
        toast.success(message, {
          icon: '✅',
          duration: 3000,
        });
        break;
      case 'reset':
        toast.info(message, {
          icon: '🔄',
          duration: 2000,
        });
        break;
    }
    
    // Clear the last notification after a delay to allow new ones
    setTimeout(() => {
      if (lastNotificationRef.current === notificationKey) {
        lastNotificationRef.current = '';
      }
    }, 2000);
  }, []);

  return { showNotification };
};
