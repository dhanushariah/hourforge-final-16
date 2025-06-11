
import { useState, useCallback } from 'react';

export type TimerState = 'idle' | 'running' | 'paused';

interface TimerStorage {
  sessionId: string;
  realStartTime: number;
  totalPausedDuration: number;
  state: TimerState;
  date: string;
  lastPauseTime?: number;
}

export const useTimerState = () => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const STORAGE_KEY = 'hourforge-timer-v2';

  const saveTimerState = useCallback((timerData: TimerStorage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData));
  }, []);

  const loadTimerState = useCallback((): TimerStorage | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const clearTimerState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const formattedTime = useCallback(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  return {
    elapsedSeconds,
    setElapsedSeconds,
    state,
    setState,
    sessionId,
    setSessionId,
    saveTimerState,
    loadTimerState,
    clearTimerState,
    formattedTime,
  };
};

export type { TimerStorage };
