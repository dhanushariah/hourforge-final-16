
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSupabaseData } from './store/useSupabaseData';
import { useSupabaseCalculations } from './store/useSupabaseCalculations';

export const useSupabaseStore = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const {
    dailyLogs,
    setDailyLogs,
    yearlyGoals,
    setYearlyGoals,
    tasks,
    setTasks,
    timerSessions,
    setTimerSessions,
  } = useSupabaseData();

  const { 
    getTodayProgress, 
    getYearlyProgress, 
    getWeeklyProgress 
  } = useSupabaseCalculations(dailyLogs, yearlyGoals);

  const loadUserData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // Load all data in parallel with error handling for each
      const promises = [
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load daily logs:', error);
              return [];
            }
            return data || [];
          }),

        supabase
          .from('yearly_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load yearly goals:', error);
              return [];
            }
            return data || [];
          }),

        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load tasks:', error);
              return [];
            }
            return data || [];
          }),

        supabase
          .from('timer_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(50)
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load timer sessions:', error);
              return [];
            }
            return data || [];
          }),
      ];

      const [logsData, goalsData, tasksData, sessionsData] = await Promise.all(promises);
      
      setDailyLogs(logsData);
      setYearlyGoals(goalsData);
      setTasks(tasksData);
      setTimerSessions(sessionsData);

    } catch (error) {
      console.error('Error loading user data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, setDailyLogs, setYearlyGoals, setTasks, setTimerSessions]);

  // Load data when component mounts or user changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Listen for timer-saved events to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      loadUserData();
    };

    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);

  return {
    // Data
    dailyLogs,
    yearlyGoals,
    tasks,
    timerSessions,
    
    // State
    isLoading,
    hasError,
    
    // Actions
    loadUserData,
    
    // Calculations
    getTodayProgress,
    getYearlyProgress,
    getWeeklyProgress,
  };
};
