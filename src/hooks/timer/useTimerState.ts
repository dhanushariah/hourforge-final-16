
import { useState, useCallback } from 'react';

export type TimerState = 'idle' | 'running' | 'paused';

export interface TimerStorage {
  sessionId: string;
  realStartTime: number;
  totalPausedDuration: number;
  state: TimerState;
  date: string;
  lastPauseTime?: number;
}

export const useTimerState = () => {
  const [state, setState] = useState<TimerState>('idle');
  const [startTime, setStartTime] = useState(0);
  const [pausedDuration, setPausedDuration] = useState(0);
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

  return {
    state,
    setState,
    startTime,
    setStartTime,
    pausedDuration,
    setPausedDuration,
    sessionId,
    setSessionId,
    saveTimerState,
    loadTimerState,
    clearTimerState,
  };
};
