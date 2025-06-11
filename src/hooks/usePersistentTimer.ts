
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TimerState = 'idle' | 'running' | 'paused';

interface TimerStorage {
  sessionId: string | null;
  startTime: number;
  pausedDuration: number;
  state: TimerState;
  date: string;
}

export const usePersistentTimer = () => {
  const { user } = useAuth();
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const STORAGE_KEY = 'hourforge-timer';

  // Get current date in IST
  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  // Get current time in IST
  const getCurrentTimeIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset).toISOString();
  };

  // Save timer state to localStorage
  const saveTimerState = useCallback((timerData: TimerStorage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData));
  }, []);

  // Load timer state from localStorage
  const loadTimerState = useCallback((): TimerStorage | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Clear timer state
  const clearTimerState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // Calculate elapsed seconds based on timestamps
  const calculateElapsedSeconds = useCallback(() => {
    if (!startTimeRef.current) return 0;
    const now = Date.now();
    return Math.floor((now - startTimeRef.current) / 1000);
  }, []);

  // Update timer display using timestamp calculation
  const updateTimerDisplay = useCallback(() => {
    if (state === 'running' && startTimeRef.current) {
      const elapsed = calculateElapsedSeconds();
      setSeconds(elapsed);
    }
  }, [state, calculateElapsedSeconds]);

  // Start the interval for real-time updates
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      updateTimerDisplay();
    }, 1000);
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

    if (stored && stored.date === today && stored.state === 'running' && stored.startTime) {
      const now = Date.now();
      const elapsedMs = now - stored.startTime - stored.pausedDuration;
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      startTimeRef.current = stored.startTime;
      setSeconds(elapsedSeconds);
      setState('running');
      setSessionId(stored.sessionId);
      
      startInterval();
      toast.success('Timer resumed from where you left off!');
    } else if (stored && stored.date !== today) {
      clearTimerState();
    }
  }, [user, loadTimerState, clearTimerState, startInterval]);

  // Start timer
  const start = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to use the timer');
      return;
    }

    const stored = loadTimerState();
    const today = getCurrentDateIST();
    
    if (stored && stored.date === today && stored.state === 'running') {
      toast.error('Timer is already running!');
      return;
    }

    try {
      const startTime = getCurrentTimeIST();
      const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user.id,
          start_time: startTime,
          date: today,
        })
        .select()
        .single();

      if (error) throw error;

      const now = Date.now();
      startTimeRef.current = now;

      const timerData: TimerStorage = {
        sessionId: data.id,
        startTime: now,
        pausedDuration: 0,
        state: 'running',
        date: today,
      };

      setSessionId(data.id);
      setState('running');
      setSeconds(0);
      saveTimerState(timerData);
      
      startInterval();
      toast.success('Timer started! 🚀');
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer. Please try again.');
    }
  }, [user, loadTimerState, saveTimerState, startInterval]);

  // Pause timer
  const pause = useCallback(() => {
    stopInterval();
    
    const stored = loadTimerState();
    if (stored && startTimeRef.current) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const updatedData: TimerStorage = {
        ...stored,
        state: 'paused',
        pausedDuration: stored.pausedDuration + elapsedMs,
      };
      saveTimerState(updatedData);
    }
    
    setState('paused');
    toast.info('Timer paused ⏸️');
  }, [loadTimerState, saveTimerState, stopInterval]);

  // Resume timer
  const resume = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    
    setState('running');
    startInterval();

    const stored = loadTimerState();
    if (stored) {
      const updatedData: TimerStorage = {
        ...stored,
        state: 'running',
        startTime: now,
      };
      saveTimerState(updatedData);
    }

    toast.success('Timer resumed! ▶️');
  }, [loadTimerState, saveTimerState, startInterval]);

  // End timer and save session - CRITICAL ROBUST SAVE ROUTINE
  const end = useCallback(async () => {
    if (!user || !sessionId) {
      toast.error('No active session to save');
      return;
    }

    stopInterval();

    try {
      const endTime = getCurrentTimeIST();
      const finalSeconds = calculateElapsedSeconds();
      const hours = finalSeconds / 3600;
      
      if (finalSeconds < 60) {
        toast.error('Session too short (less than 1 minute). Not saved.');
        // Reset timer without saving
        setSeconds(0);
        setState('idle');
        setSessionId(null);
        startTimeRef.current = null;
        clearTimerState();
        return;
      }

      // First, update the timer session
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .update({
          end_time: endTime,
          duration_seconds: finalSeconds,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) throw sessionError;

      // Then, update or create daily log entry
      const today = getCurrentDateIST();
      const roundedHours = Math.round(hours * 100) / 100;
      
      if (roundedHours > 0) {
        const { data: existingLog } = await supabase
          .from('daily_logs')
          .select('hours')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        const currentHours = existingLog?.hours || 0;
        const newTotal = currentHours + roundedHours;

        if (newTotal > 12) {
          toast.error(`Adding ${roundedHours.toFixed(2)} hours would exceed the 12-hour daily limit. Current: ${currentHours.toFixed(2)}h`);
          return;
        }

        const { error: logError } = await supabase
          .from('daily_logs')
          .upsert({
            user_id: user.id,
            date: today,
            hours: newTotal,
            notes: `Logged via Timer - ${roundedHours.toFixed(2)}h session`,
          });

        if (logError) throw logError;

        toast.success(`Session saved successfully! ✅\nAdded ${roundedHours.toFixed(2)} hours to your daily log.\nTotal today: ${newTotal.toFixed(2)}h`);
      }

      // Reset timer completely
      setSeconds(0);
      setState('idle');
      setSessionId(null);
      startTimeRef.current = null;
      clearTimerState();

      // Force refresh of all data to sync across views
      window.dispatchEvent(new CustomEvent('timer-saved'));

    } catch (error: any) {
      console.error('Error ending timer:', error);
      toast.error('Failed to save session. Please try again.');
    }
  }, [user, sessionId, stopInterval, calculateElapsedSeconds, clearTimerState]);

  // Reset timer
  const reset = useCallback(() => {
    stopInterval();
    setSeconds(0);
    setState('idle');
    setSessionId(null);
    startTimeRef.current = null;
    clearTimerState();
    toast.info('Timer reset 🔄');
  }, [stopInterval, clearTimerState]);

  // Toggle between start/pause
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

  // Format time display
  const formattedTime = useCallback(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  return {
    seconds,
    hours: seconds / 3600,
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
