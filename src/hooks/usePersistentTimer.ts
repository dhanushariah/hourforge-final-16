
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TimerState = 'idle' | 'running' | 'paused';

interface TimerStorage {
  sessionId: string | null;
  startTime: string | null;
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
  }, []);

  // Restore timer on mount
  useEffect(() => {
    if (!user) return;

    const stored = loadTimerState();
    const today = getCurrentDateIST();

    if (stored && stored.date === today && stored.state === 'running' && stored.startTime) {
      const startTime = new Date(stored.startTime);
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime() - stored.pausedDuration;
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      setSeconds(elapsedSeconds);
      setState('running');
      setSessionId(stored.sessionId);

      // Start interval for real-time updates
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

      toast.success('Timer resumed from where you left off!');
    } else if (stored && stored.date !== today) {
      // Clear old timer data from previous day
      clearTimerState();
    }
  }, [user, loadTimerState, clearTimerState]);

  // Start timer
  const start = useCallback(async () => {
    if (!user) return;

    // Prevent multiple timers for the same day
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

      const timerData: TimerStorage = {
        sessionId: data.id,
        startTime,
        pausedDuration: 0,
        state: 'running',
        date: today,
      };

      setSessionId(data.id);
      setState('running');
      setSeconds(0);
      saveTimerState(timerData);
      
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

      toast.success('Timer started!');
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  }, [user, loadTimerState, saveTimerState]);

  // Pause timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const stored = loadTimerState();
    if (stored) {
      const updatedData: TimerStorage = {
        ...stored,
        state: 'paused',
        pausedDuration: stored.pausedDuration + (seconds * 1000),
      };
      saveTimerState(updatedData);
    }
    
    setState('paused');
    toast.info('Timer paused');
  }, [seconds, loadTimerState, saveTimerState]);

  // Resume timer
  const resume = useCallback(() => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    const stored = loadTimerState();
    if (stored) {
      const updatedData: TimerStorage = {
        ...stored,
        state: 'running',
      };
      saveTimerState(updatedData);
    }

    toast.success('Timer resumed!');
  }, [loadTimerState, saveTimerState]);

  // End timer and save session
  const end = useCallback(async () => {
    if (!user || !sessionId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      const endTime = getCurrentTimeIST();
      const { error } = await supabase
        .from('timer_sessions')
        .update({
          end_time: endTime,
          duration_seconds: seconds,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      const hours = Math.round((seconds / 3600) * 100) / 100;
      
      if (hours > 0) {
        const today = getCurrentDateIST();
        const { data: existingLog } = await supabase
          .from('daily_logs')
          .select('hours')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        const currentHours = existingLog?.hours || 0;
        const newTotal = currentHours + hours;

        if (newTotal > 12) {
          toast.error(`Adding ${hours.toFixed(2)} hours would exceed the 12-hour daily limit. Current: ${currentHours.toFixed(2)}h`);
        } else {
          await supabase
            .from('daily_logs')
            .upsert({
              user_id: user.id,
              date: today,
              hours: newTotal,
            });

          toast.success(`Session completed! Added ${hours.toFixed(2)} hours to your daily log. Total today: ${newTotal.toFixed(2)}h`);
        }
      }

      // Reset timer
      setSeconds(0);
      setState('idle');
      setSessionId(null);
      clearTimerState();

    } catch (error: any) {
      console.error('Error ending timer:', error);
      toast.error('Failed to end timer');
    }
  }, [user, sessionId, seconds, clearTimerState]);

  // Reset timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
    setState('idle');
    setSessionId(null);
    clearTimerState();
    toast.info('Timer reset');
  }, [clearTimerState]);

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
