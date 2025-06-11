
import { useState, useEffect, useCallback } from 'react';
import { useTimerState } from './timer/useTimerState';
import { useTimerCalculations } from './timer/useTimerCalculations';
import { useTimerDatabase } from './timer/useTimerDatabase';
import { useTimerNotifications } from './timer/useTimerNotifications';

export const usePersistentTimer = () => {
  const {
    state,
    setState,
    startTime,
    setStartTime,
    pausedDuration,
    setPausedDuration,
    sessionId,
    setSessionId,
  } = useTimerState();

  const { formatTime, calculateElapsedSeconds, calculateHours } = useTimerCalculations();
  const { createTimerSession, updateTimerSession, updateDailyLog } = useTimerDatabase();
  const { showNotification } = useTimerNotifications();

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = calculateElapsedSeconds(startTime, currentTime, pausedDuration, state);
  const hours = calculateHours(elapsedSeconds);
  const formattedTime = formatTime(elapsedSeconds);

  const start = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      const session = await createTimerSession(now, today);
      
      setStartTime(Date.now());
      setPausedDuration(0);
      setSessionId(session.id);
      setState('running');
      
      showNotification('start', 'Timer started! Focus time begins now 🚀');
    } catch (error) {
      console.error('Failed to start timer:', error);
      showNotification('start', 'Failed to start timer. Please try again.');
    }
  }, [createTimerSession, setStartTime, setPausedDuration, setSessionId, setState, showNotification]);

  const pause = useCallback(() => {
    if (state === 'running') {
      setState('paused');
      showNotification('pause', 'Timer paused. Take a well-deserved break! ☕');
    }
  }, [state, setState, showNotification]);

  const resume = useCallback(() => {
    if (state === 'paused') {
      setState('running');
      showNotification('resume', 'Timer resumed! Back to productive work 💪');
    }
  }, [state, setState, showNotification]);

  const end = useCallback(async () => {
    if (!sessionId || (state !== 'running' && state !== 'paused')) return;

    try {
      const endTime = new Date().toISOString();
      const totalElapsed = calculateElapsedSeconds(startTime, Date.now(), pausedDuration, 'idle');
      
      await updateTimerSession(sessionId, endTime, totalElapsed);
      
      const sessionHours = calculateHours(totalElapsed);
      if (sessionHours > 0) {
        const today = new Date().toISOString().split('T')[0];
        const newTotal = await updateDailyLog(today, sessionHours);
        
        showNotification('end', `Session completed! Added ${sessionHours.toFixed(2)}h to your daily log 🎉`);
        
        // Dispatch custom event for components to refresh
        window.dispatchEvent(new CustomEvent('timer-saved'));
      }
      
      // Reset timer state
      setState('idle');
      setStartTime(0);
      setPausedDuration(0);
      setSessionId(null);
      
    } catch (error: any) {
      console.error('Failed to end timer:', error);
      showNotification('end', error.message || 'Failed to save session. Please try again.');
    }
  }, [
    sessionId,
    state,
    startTime,
    pausedDuration,
    calculateElapsedSeconds,
    calculateHours,
    updateTimerSession,
    updateDailyLog,
    setState,
    setStartTime,
    setPausedDuration,
    setSessionId,
    showNotification
  ]);

  const reset = useCallback(() => {
    setState('idle');
    setStartTime(0);
    setPausedDuration(0);
    setSessionId(null);
    showNotification('reset', 'Timer reset. Ready for your next session! 🔄');
  }, [setState, setStartTime, setPausedDuration, setSessionId, showNotification]);

  const toggle = useCallback(() => {
    if (state === 'running') {
      pause();
    } else if (state === 'paused') {
      resume();
    }
  }, [state, pause, resume]);

  return {
    formattedTime,
    state,
    hours,
    start,
    pause,
    resume,
    end,
    reset,
    toggle,
  };
};
