
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TimerState = 'idle' | 'running' | 'paused';

interface TimerStorage {
  sessionId: string;
  realStartTime: number; // Actual start timestamp
  totalPausedDuration: number; // Total time paused in milliseconds
  state: TimerState;
  date: string;
  lastPauseTime?: number; // When the current pause started
}

export const usePersistentTimer = () => {
  const { user } = useAuth();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageRef = useRef<TimerStorage | null>(null);

  const STORAGE_KEY = 'hourforge-timer-v2';

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
    storageRef.current = timerData;
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
    storageRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Calculate elapsed seconds based on real timestamps
  const calculateElapsedSeconds = useCallback((storage?: TimerStorage): number => {
    const currentStorage = storage || storageRef.current;
    if (!currentStorage) return 0;

    const now = Date.now();
    let totalElapsed = 0;

    if (currentStorage.state === 'running') {
      // Currently running: total time = (now - start) - total paused time
      totalElapsed = now - currentStorage.realStartTime - currentStorage.totalPausedDuration;
    } else if (currentStorage.state === 'paused' && currentStorage.lastPauseTime) {
      // Currently paused: total time = (last pause - start) - total paused time before current pause
      totalElapsed = currentStorage.lastPauseTime - currentStorage.realStartTime - currentStorage.totalPausedDuration;
    }

    return Math.max(0, Math.floor(totalElapsed / 1000));
  }, []);

  // Update timer display
  const updateTimerDisplay = useCallback(() => {
    if (storageRef.current && state !== 'idle') {
      const elapsed = calculateElapsedSeconds();
      setElapsedSeconds(elapsed);
    }
  }, [state, calculateElapsedSeconds]);

  // Start the real-time update interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      updateTimerDisplay();
    }, 100); // Update every 100ms for smooth display
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
      
      // Calculate and set elapsed time
      const elapsed = calculateElapsedSeconds(stored);
      setElapsedSeconds(elapsed);
      
      if (stored.state === 'running') {
        startInterval();
      }
      
      toast.success('Timer session restored!');
    } else if (stored && stored.date !== today) {
      // Clear old session from different day
      clearTimerState();
    }
  }, [user, loadTimerState, clearTimerState, startInterval, calculateElapsedSeconds]);

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
      
      console.log('Starting new timer session');
      
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
      const timerData: TimerStorage = {
        sessionId: data.id,
        realStartTime: now,
        totalPausedDuration: 0,
        state: 'running',
        date: today,
      };

      setSessionId(data.id);
      setState('running');
      setElapsedSeconds(0);
      saveTimerState(timerData);
      
      startInterval();
      toast.success('Timer started! 🚀');
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer. Please try again.');
    }
  }, [user, state, saveTimerState, startInterval]);

  // Pause timer
  const pause = useCallback(() => {
    if (state !== 'running' || !storageRef.current) return;

    console.log('Pausing timer');
    
    stopInterval();
    
    const now = Date.now();
    const updatedData: TimerStorage = {
      ...storageRef.current,
      state: 'paused',
      lastPauseTime: now,
    };
    
    saveTimerState(updatedData);
    setState('paused');
    toast.info('Timer paused ⏸️');
  }, [state, saveTimerState, stopInterval]);

  // Resume timer
  const resume = useCallback(() => {
    if (state !== 'paused' || !storageRef.current) return;

    console.log('Resuming timer');

    const now = Date.now();
    const pauseDuration = storageRef.current.lastPauseTime ? 
      now - storageRef.current.lastPauseTime : 0;
    
    const updatedData: TimerStorage = {
      ...storageRef.current,
      state: 'running',
      totalPausedDuration: storageRef.current.totalPausedDuration + pauseDuration,
      lastPauseTime: undefined,
    };
    
    saveTimerState(updatedData);
    setState('running');
    startInterval();
    toast.success('Timer resumed! ▶️');
  }, [state, saveTimerState, startInterval]);

  // End timer and save session - FIXED TO HANDLE EXISTING DAILY LOGS
  const end = useCallback(async () => {
    if (!user || !sessionId || !storageRef.current) {
      toast.error('No active session to save');
      return;
    }

    console.log('Ending timer session:', sessionId);
    
    stopInterval();

    try {
      const finalSeconds = calculateElapsedSeconds();
      const hours = finalSeconds / 3600;
      
      console.log(`Final session duration: ${finalSeconds} seconds (${hours.toFixed(2)} hours)`);
      
      if (finalSeconds < 60) {
        toast.error('Session too short (less than 1 minute). Not saved.');
        // Reset timer without saving
        setElapsedSeconds(0);
        setState('idle');
        setSessionId(null);
        clearTimerState();
        return;
      }

      const endTime = getCurrentTimeIST();
      const today = getCurrentDateIST();
      
      // Step 1: Update timer session in database
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .update({
          end_time: endTime,
          duration_seconds: finalSeconds,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Session update error:', sessionError);
        throw new Error(`Failed to update timer session: ${sessionError.message}`);
      }

      // Step 2: FIXED - Check for existing daily log and update it properly
      const roundedHours = Math.round(hours * 100) / 100;
      
      if (roundedHours > 0) {
        // Get current daily log
        const { data: existingLog, error: fetchError } = await supabase
          .from('daily_logs')
          .select('id, hours')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        if (fetchError) {
          console.error('Error fetching existing log:', fetchError);
          throw new Error(`Failed to fetch daily log: ${fetchError.message}`);
        }

        let newTotal;
        
        if (existingLog) {
          // Update existing log
          newTotal = existingLog.hours + roundedHours;
          
          if (newTotal > 12) {
            toast.error(`Adding ${roundedHours.toFixed(2)} hours would exceed the 12-hour daily limit. Current: ${existingLog.hours.toFixed(2)}h`);
            return;
          }

          const { error: updateError } = await supabase
            .from('daily_logs')
            .update({
              hours: newTotal,
              notes: `Automated Timer Session - ${roundedHours.toFixed(2)}h added`,
            })
            .eq('id', existingLog.id);

          if (updateError) {
            console.error('Daily log update error:', updateError);
            throw new Error(`Failed to update daily log: ${updateError.message}`);
          }
        } else {
          // Create new log
          newTotal = roundedHours;
          
          if (newTotal > 12) {
            toast.error(`Session duration ${roundedHours.toFixed(2)} hours exceeds the 12-hour daily limit.`);
            return;
          }

          const { error: insertError } = await supabase
            .from('daily_logs')
            .insert({
              user_id: user.id,
              date: today,
              hours: newTotal,
              notes: `Automated Timer Session - ${roundedHours.toFixed(2)}h`,
            });

          if (insertError) {
            console.error('Daily log insert error:', insertError);
            throw new Error(`Failed to create daily log: ${insertError.message}`);
          }
        }

        console.log(`Successfully saved ${roundedHours.toFixed(2)} hours to daily log`);
        
        toast.success(`Session saved successfully! ✅\nAdded ${roundedHours.toFixed(2)} hours to your daily log.\nTotal today: ${newTotal.toFixed(2)}h`);
      }

      // Step 3: Reset timer state completely
      setElapsedSeconds(0);
      setState('idle');
      setSessionId(null);
      clearTimerState();

      // Step 4: Force refresh of all data across the app
      console.log('Broadcasting timer-saved event');
      window.dispatchEvent(new CustomEvent('timer-saved'));

    } catch (error: any) {
      console.error('Critical error during timer save:', error);
      toast.error(`Failed to save session: ${error.message}. Please contact support if this persists.`);
    }
  }, [user, sessionId, stopInterval, calculateElapsedSeconds, clearTimerState]);

  // Reset timer
  const reset = useCallback(() => {
    console.log('Resetting timer');
    
    stopInterval();
    setElapsedSeconds(0);
    setState('idle');
    setSessionId(null);
    clearTimerState();
    toast.info('Timer reset 🔄');
  }, [stopInterval, clearTimerState]);

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

  // Format time display
  const formattedTime = useCallback(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

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
