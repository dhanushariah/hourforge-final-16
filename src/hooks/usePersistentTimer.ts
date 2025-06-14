
import { useState, useEffect, useCallback } from 'react';
import { useTimerState, TimerStorage } from './timer/useTimerState';
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
    saveTimerState,
    loadTimerState,
    clearTimerState,
  } = useTimerState();

  const { formatTime, calculateElapsedSeconds, calculateHours, getCurrentDateIST } = useTimerCalculations();
  const { createTimerSession, updateTimerSession, updateDailyLog } = useTimerDatabase();
  const { showNotification } = useTimerNotifications();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);

  // Load persisted timer state on mount
  useEffect(() => {
    const storedState = loadTimerState();
    if (storedState && storedState.state !== 'idle') {
      console.log('Restoring timer state:', storedState);
      
      // Calculate current paused duration if timer was paused
      let currentPausedDuration = storedState.totalPausedDuration;
      if (storedState.state === 'paused' && storedState.lastPauseTime) {
        const pauseTimeSinceLastPause = Date.now() - storedState.lastPauseTime;
        currentPausedDuration += pauseTimeSinceLastPause;
        setPauseStartTime(storedState.lastPauseTime);
      }

      setStartTime(storedState.realStartTime);
      setPausedDuration(currentPausedDuration);
      setSessionId(storedState.sessionId);
      setState(storedState.state);
    }
  }, [loadTimerState, setStartTime, setPausedDuration, setSessionId, setState]);

  // Update current time every second only when running
  useEffect(() => {
    if (state !== 'running') return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // Save timer state whenever it changes
  useEffect(() => {
    if (sessionId && (state === 'running' || state === 'paused')) {
      const timerData: TimerStorage = {
        sessionId,
        realStartTime: startTime,
        totalPausedDuration: pausedDuration,
        state,
        date: getCurrentDateIST(),
        lastPauseTime: state === 'paused' ? (pauseStartTime || currentTime) : undefined,
      };
      saveTimerState(timerData);
    }
  }, [state, startTime, pausedDuration, sessionId, currentTime, pauseStartTime, saveTimerState, getCurrentDateIST]);

  const elapsedSeconds = calculateElapsedSeconds(startTime, currentTime, pausedDuration, state);
  const hours = calculateHours(elapsedSeconds);
  const formattedTime = formatTime(elapsedSeconds);

  const start = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const today = getCurrentDateIST();
      
      const session = await createTimerSession(now, today);
      
      const startTimestamp = Date.now();
      setStartTime(startTimestamp);
      setPausedDuration(0);
      setPauseStartTime(null);
      setSessionId(session.id);
      setState('running');
      
      showNotification('start', 'Timer started! Focus time begins now 🚀');
    } catch (error) {
      console.error('Failed to start timer:', error);
      showNotification('start', 'Failed to start timer. Please try again.');
    }
  }, [createTimerSession, setStartTime, setPausedDuration, setSessionId, setState, showNotification, getCurrentDateIST]);

  const pause = useCallback(() => {
    if (state === 'running') {
      const pauseTime = Date.now();
      setPauseStartTime(pauseTime);
      setState('paused');
      showNotification('pause', 'Timer paused. Take a well-deserved break! ☕');
    }
  }, [state, setState, showNotification]);

  const resume = useCallback(() => {
    if (state === 'paused' && pauseStartTime) {
      const resumeTime = Date.now();
      const pauseLength = resumeTime - pauseStartTime;
      setPausedDuration(prev => prev + pauseLength);
      setPauseStartTime(null);
      setState('running');
      showNotification('resume', 'Timer resumed! Back to productive work 💪');
    }
  }, [state, pauseStartTime, setState, setPausedDuration, showNotification]);

  const end = useCallback(async () => {
    if (!sessionId || (state !== 'running' && state !== 'paused')) return;

    try {
      const endTime = new Date().toISOString();
      let finalPausedDuration = pausedDuration;
      
      // If paused, add current pause duration to final calculation
      if (state === 'paused' && pauseStartTime) {
        finalPausedDuration += Date.now() - pauseStartTime;
      }
      
      // Calculate total elapsed seconds properly including paused time
      const totalElapsed = Math.max(0, Math.floor((Date.now() - startTime - finalPausedDuration) / 1000));
      
      await updateTimerSession(sessionId, endTime, totalElapsed);
      
      const sessionHours = calculateHours(totalElapsed);
      if (sessionHours > 0) {
        const today = getCurrentDateIST();
        await updateDailyLog(today, sessionHours);
        
        showNotification('end', `Session completed! Added ${sessionHours.toFixed(2)}h to your daily log 🎉`);
        
        // Dispatch custom event for components to refresh
        window.dispatchEvent(new CustomEvent('timer-saved'));
      }
      
      // Reset timer state
      setState('idle');
      setStartTime(0);
      setPausedDuration(0);
      setPauseStartTime(null);
      setSessionId(null);
      clearTimerState();
      
    } catch (error: any) {
      console.error('Failed to end timer:', error);
      showNotification('end', error.message || 'Failed to save session. Please try again.');
    }
  }, [
    sessionId,
    state,
    startTime,
    pausedDuration,
    pauseStartTime,
    calculateElapsedSeconds,
    calculateHours,
    updateTimerSession,
    updateDailyLog,
    setState,
    setStartTime,
    setPausedDuration,
    setSessionId,
    clearTimerState,
    showNotification,
    getCurrentDateIST
  ]);

  const reset = useCallback(() => {
    setState('idle');
    setStartTime(0);
    setPausedDuration(0);
    setPauseStartTime(null);
    setSessionId(null);
    clearTimerState();
    showNotification('reset', 'Timer reset. Ready for your next session! 🔄');
  }, [setState, setStartTime, setPausedDuration, setSessionId, clearTimerState, showNotification]);

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
