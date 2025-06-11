
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const useTimerNotifications = () => {
  const lastNotificationRef = useRef<string>('');

  const showNotification = useCallback((type: 'start' | 'pause' | 'resume' | 'end' | 'reset', message: string) => {
    // Prevent duplicate notifications
    const notificationKey = `${type}-${Date.now()}`;
    if (lastNotificationRef.current === `${type}-${message}`) {
      return;
    }
    
    lastNotificationRef.current = `${type}-${message}`;
    
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
      lastNotificationRef.current = '';
    }, 1000);
  }, []);

  return { showNotification };
};
