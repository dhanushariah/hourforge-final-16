
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTimerState } from './timer/useTimerState';
import { useTimerCalculations } from './timer/useTimerCalculations';
import { useTimerDatabase } from './timer/useTimerDatabase';
import { useAuth } from '@/hooks/useAuth';

export const usePersistentTimer = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageRef = useRef<any>(null);

  const {
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
  } = useTimerState();

  const { calculateElapsedSeconds, getCurrentDateIST, getCurrentTimeIST } = useTimerCalculations();
  const { createTimerSession, updateTimerSession, updateDailyLog } = useTimerDatabase();

  // Update timer display
  const updateTimerDisplay = useCallback(() => {
    if (storageRef.current && state !== 'idle') {
      const elapsed = calculateElapsedSeconds(storageRef.current);
      setElapsedSeconds(elapsed);
    }
  }, [state, calculateElapsedSeconds, setElapsedSeconds]);

  // Start the real-time update interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      updateTimerDisplay();
    }, 100);
  }, [updateTimerDisplay]);

  // Stop the interval
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Restore timer on mount
  useEffect(() => {
    if (!user) return;

    const stored = loadTimerState();
    const today = getCurrentDateIST();

    if (stored && stored.date === today && stored.state !== 'idle') {
      console.log('Restoring timer session:', stored);
      
      storageRef.current = stored;
      setSessionId(stored.sessionId);
      setState(stored.state);
      
      const elapsed = calculateElapsedSeconds(stored);
      setElapsedSeconds(elapsed);
      
      if (stored.state === 'running') {
        startInterval();
      }
      
      toast.success('Timer session restored!');
    } else if (stored && stored.date !== today) {
      clearTimerState();
    }
  }, [user, loadTimerState, clearTimerState, startInterval, calculateElapsedSeconds, getCurrentDateIST, setSessionId, setState, setElapsedSeconds]);

  // Start timer
  const start = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to use the timer');
      return;
    }

    if (state !== 'idle') {
      toast.error('Timer is already running or paused');
      return;
    }

    try {
      const startTime = getCurrentTimeIST();
      const today = getCurrentDateIST();
      
      const data = await createTimerSession(startTime, today);

      const now = Date.now();
      const timerData = {
        sessionId: data.id,
        realStartTime: now,
        totalPausedDuration: 0,
        state: 'running' as const,
        date: today,
      };

      setSessionId(data.id);
      setState('running');
      setElapsedSeconds(0);
      saveTimerState(timerData);
      storageRef.current = timerData;
      
      startInterval();
      toast.success('Timer started! 🚀');
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer. Please try again.');
    }
  }, [user, state, getCurrentTimeIST, getCurrentDateIST, createTimerSession, setSessionId, setState, setElapsedSeconds, saveTimerState, startInterval]);

  // Pause timer
  const pause = useCallback(() => {
    if (state !== 'running' || !storageRef.current) return;

    stopInterval();
    
    const now = Date.now();
    const updatedData = {
      ...storageRef.current,
      state: 'paused' as const,
      lastPauseTime: now,
    };
    
    saveTimerState(updatedData);
    storageRef.current = updatedData;
    setState('paused');
    toast.info('Timer paused ⏸️');
  }, [state, saveTimerState, stopInterval, setState]);

  // Resume timer
  const resume = useCallback(() => {
    if (state !== 'paused' || !storageRef.current) return;

    const now = Date.now();
    const pauseDuration = storageRef.current.lastPauseTime ? 
      now - storageRef.current.lastPauseTime : 0;
    
    const updatedData = {
      ...storageRef.current,
      state: 'running' as const,
      totalPausedDuration: storageRef.current.totalPausedDuration + pauseDuration,
      lastPauseTime: undefined,
    };
    
    saveTimerState(updatedData);
    storageRef.current = updatedData;
    setState('running');
    startInterval();
    toast.success('Timer resumed! ▶️');
  }, [state, saveTimerState, startInterval, setState]);

  // End timer and save session
  const end = useCallback(async () => {
    if (!user || !sessionId || !storageRef.current) {
      toast.error('No active session to save');
      return;
    }

    stopInterval();

    try {
      const finalSeconds = calculateElapsedSeconds(storageRef.current);
      const hours = finalSeconds / 3600;
      
      if (finalSeconds < 60) {
        toast.error('Session too short (less than 1 minute). Not saved.');
        setElapsedSeconds(0);
        setState('idle');
        setSessionId(null);
        clearTimerState();
        storageRef.current = null;
        return;
      }

      const endTime = getCurrentTimeIST();
      const today = getCurrentDateIST();
      
      await updateTimerSession(sessionId, endTime, finalSeconds);
      const newTotal = await updateDailyLog(today, hours);

      const roundedHours = Math.round(hours * 100) / 100;
      toast.success(`Session saved successfully! ✅\nAdded ${roundedHours.toFixed(2)} hours to your daily log.\nTotal today: ${newTotal.toFixed(2)}h`);

      setElapsedSeconds(0);
      setState('idle');
      setSessionId(null);
      clearTimerState();
      storageRef.current = null;

      window.dispatchEvent(new CustomEvent('timer-saved'));
    } catch (error: any) {
      console.error('Critical error during timer save:', error);
      toast.error(`Failed to save session: ${error.message}. Please contact support if this persists.`);
    }
  }, [user, sessionId, stopInterval, calculateElapsedSeconds, getCurrentTimeIST, getCurrentDateIST, updateTimerSession, updateDailyLog, setElapsedSeconds, setState, setSessionId, clearTimerState]);

  // Reset timer
  const reset = useCallback(() => {
    stopInterval();
    setElapsedSeconds(0);
    setState('idle');
    setSessionId(null);
    clearTimerState();
    storageRef.current = null;
    toast.info('Timer reset 🔄');
  }, [stopInterval, setElapsedSeconds, setState, setSessionId, clearTimerState]);

  // Toggle between start/pause/resume
  const toggle = useCallback(() => {
    if (state === 'idle') {
      start();
    } else if (state === 'running') {
      pause();
    } else if (state === 'paused') {
      resume();
    }
  }, [state, start, pause, resume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    seconds: elapsedSeconds,
    hours: elapsedSeconds / 3600,
    formattedTime: formattedTime(),
    state,
    isRunning: state === 'running',
    isPaused: state === 'paused',
    isIdle: state === 'idle',
    start,
    pause,
    resume,
    end,
    reset,
    toggle,
  };
};
