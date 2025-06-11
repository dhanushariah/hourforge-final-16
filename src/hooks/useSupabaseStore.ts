
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSupabaseData, DailyLog, YearlyGoal, Task, TimerSession } from './store/useSupabaseData';
import { useSupabaseCalculations } from './store/useSupabaseCalculations';
import { toast } from 'sonner';

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
    getCurrentDateIST,
    getTodayLog,
    getTodayProgress, 
    getYearlyProgress, 
    getWeeklyProgress,
    getDailyTarget
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
      const [logsData, goalsData, tasksData, sessionsData] = await Promise.all([
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
            return (data || []).map(log => ({
              ...log,
              tasks: [] // Will be populated from tasks table
            }));
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
      ]);
      
      // Group tasks by date and attach to daily logs
      const groupedTasks = tasksData.reduce((acc: { [key: string]: Task[] }, task: Task) => {
        if (!acc[task.date]) acc[task.date] = [];
        acc[task.date].push(task);
        return acc;
      }, {});

      const logsWithTasks = logsData.map((log: DailyLog) => ({
        ...log,
        tasks: groupedTasks[log.date] || []
      }));
      
      setDailyLogs(logsWithTasks);
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

  // Task management functions
  const addTask = async (title: string, description?: string, targetDate?: string) => {
    if (!user) return;
    
    const date = targetDate === 'tomorrow' 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : getCurrentDateIST();

    const { error } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id,
        title,
        description,
        date,
        completed: false
      }]);

    if (error) throw error;
    await loadUserData();
  };

  const updateTask = async (taskId: string, title: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ title })
      .eq('id', taskId);

    if (error) throw error;
    await loadUserData();
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId);

    if (error) throw error;
    await loadUserData();
  };

  const moveTaskToTomorrow = async (taskId: string) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('tasks')
      .update({ date: tomorrow })
      .eq('id', taskId);

    if (error) throw error;
    await loadUserData();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    await loadUserData();
  };

  // Yearly goals functions
  const addYearlyGoal = async (title: string, description: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('yearly_goals')
      .insert([{
        user_id: user.id,
        title,
        description,
        estimated_hours: 0,
        logged_hours: 0,
        year: new Date().getFullYear()
      }]);

    if (error) {
      console.error('Error adding yearly goal:', error);
      toast.error('Failed to add yearly goal');
      return;
    }

    toast.success('Yearly goal added successfully! 🎯');
    await loadUserData();
  };

  const updateYearlyGoal = async (goalId: string, title: string, description: string) => {
    const { error } = await supabase
      .from('yearly_goals')
      .update({ title, description })
      .eq('id', goalId);

    if (error) {
      console.error('Error updating yearly goal:', error);
      toast.error('Failed to update goal');
      return;
    }

    toast.success('Goal updated! ✅');
    await loadUserData();
  };

  const updateYearlyGoalHours = async (goalId: string, loggedHours: number) => {
    const { error } = await supabase
      .from('yearly_goals')
      .update({ logged_hours: loggedHours })
      .eq('id', goalId);

    if (error) {
      console.error('Error updating yearly goal hours:', error);
      toast.error('Failed to update goal hours');
      return;
    }

    toast.success('Goal hours updated! ✅');
    await loadUserData();
  };

  const deleteYearlyGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('yearly_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting yearly goal:', error);
      toast.error('Failed to delete goal');
      return;
    }

    toast.success('Goal deleted! 🗑️');
    await loadUserData();
  };

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
    
    // Task functions
    addTask,
    updateTask,
    toggleTask,
    moveTaskToTomorrow,
    deleteTask,
    
    // Yearly goals functions
    addYearlyGoal,
    updateYearlyGoal,
    updateYearlyGoalHours,
    deleteYearlyGoal,
    
    // Calculations
    getCurrentDateIST,
    getTodayLog,
    getTodayProgress,
    getYearlyProgress,
    getWeeklyProgress,
    getDailyTarget,
  };
};

// Export types for use in other files
export type { DailyLog, YearlyGoal, Task, TimerSession };
