
import { useCallback } from 'react';
import { TimerStorage } from './useTimerState';

export const useTimerCalculations = () => {
  const calculateElapsedSeconds = useCallback((storage: TimerStorage): number => {
    if (!storage) return 0;

    const now = Date.now();
    let totalElapsed = 0;

    if (storage.state === 'running') {
      totalElapsed = now - storage.realStartTime - storage.totalPausedDuration;
    } else if (storage.state === 'paused' && storage.lastPauseTime) {
      totalElapsed = storage.lastPauseTime - storage.realStartTime - storage.totalPausedDuration;
    }

    return Math.max(0, Math.floor(totalElapsed / 1000));
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
    calculateElapsedSeconds,
    getCurrentDateIST,
    getCurrentTimeIST,
  };
};
