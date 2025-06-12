
import { useCallback } from 'react';

export const useTimerCalculations = () => {
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const calculateElapsedSeconds = useCallback((startTime: number, currentTime: number, pausedDuration: number, state: string): number => {
    if (!startTime || state === 'idle') return 0;
    
    if (state === 'running') {
      return Math.max(0, Math.floor((currentTime - startTime - pausedDuration) / 1000));
    } else if (state === 'paused') {
      // When paused, don't count current time, use the time when it was paused
      return Math.max(0, Math.floor((currentTime - startTime - pausedDuration) / 1000));
    }
    
    return 0;
  }, []);

  const calculateHours = useCallback((seconds: number): number => {
    return seconds / 3600;
  }, []);

  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const getCurrentTimeIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset).toISOString();
  };

  return {
    formatTime,
    calculateElapsedSeconds,
    calculateHours,
    getCurrentDateIST,
    getCurrentTimeIST,
  };
};
