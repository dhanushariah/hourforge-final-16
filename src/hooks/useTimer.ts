
import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
  isRunning: boolean;
  seconds: number;
  startTime: number | null;
}

export const useTimer = (initialSeconds: number = 0) => {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    seconds: initialSeconds,
    startTime: null
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - (prev.seconds * 1000)
    }));
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      startTime: null
    }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      seconds: 0,
      startTime: null
    });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (state.isRunning) {
      stop();
    } else {
      start();
    }
  }, [state.isRunning, start, stop]);

  useEffect(() => {
    if (state.isRunning && state.startTime) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          seconds: Math.floor((Date.now() - prev.startTime!) / 1000)
        }));
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [state.isRunning, state.startTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    start,
    stop,
    reset,
    toggle,
    formattedTime: formatTime(state.seconds),
    hours: state.seconds / 3600
  };
};
