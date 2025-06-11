
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type TimerState = 'idle' | 'running' | 'paused';

export const useEnhancedTimer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current date in IST
  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  // Get current time in IST
  const getCurrentTimeIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset).toISOString();
  };

  // Start timer
  const start = useCallback(async () => {
    if (!user) return;

    try {
      const startTime = getCurrentTimeIST();
      const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user.id,
          start_time: startTime,
          date: getCurrentDateIST(),
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setState('running');
      
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error starting timer",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Pause timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState('paused');
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  }, []);

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

      // Calculate hours and add to daily log
      const hours = Math.round((seconds / 3600) * 100) / 100; // Round to 2 decimal places
      
      if (hours > 0) {
        // Get existing daily log hours
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
          toast({
            title: "Daily limit exceeded",
            description: `Adding ${hours.toFixed(2)} hours would exceed the 12-hour daily limit. Current: ${currentHours.toFixed(2)}h`,
            variant: "destructive",
          });
        } else {
          // Add hours to daily log
          await supabase
            .from('daily_logs')
            .upsert({
              user_id: user.id,
              date: today,
              hours: newTotal,
            });

          toast({
            title: "Session completed!",
            description: `Added ${hours.toFixed(2)} hours to your daily log. Total today: ${newTotal.toFixed(2)}h`,
          });
        }
      }

      // Reset timer
      setSeconds(0);
      setState('idle');
      setSessionId(null);

    } catch (error: any) {
      console.error('Error ending timer:', error);
      toast({
        title: "Error ending timer",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, sessionId, seconds, toast]);

  // Reset timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
    setState('idle');
    setSessionId(null);
  }, []);

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

  // Get current session hours
  const hours = seconds / 3600;

  return {
    seconds,
    hours,
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
