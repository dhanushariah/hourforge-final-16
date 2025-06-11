import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DailyLog {
  id?: string;
  date: string;
  hours: number;
  notes?: string;
  tasks: Task[];
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string;
  created_at?: string;
}

export interface YearlyGoal {
  id?: string;
  title: string;
  description: string;
  estimated_hours: number;
  logged_hours: number;
  year: number;
  created_at?: string;
}

export interface TimerSession {
  id?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  date: string;
}

const YEARLY_GOAL = 4380; // 12 hours * 365 days

export const useSupabaseStore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [loading, setLoading] = useState(false);

  // Get current date in IST
  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setDailyLogs([]);
      setYearlyGoals([]);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load daily logs
      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (logsError) throw logsError;

      // Load tasks for each day
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Group tasks by date
      const tasksByDate: Record<string, Task[]> = {};
      tasks?.forEach(task => {
        if (!tasksByDate[task.date]) {
          tasksByDate[task.date] = [];
        }
        tasksByDate[task.date].push(task);
      });

      // Combine logs with tasks
      const logsWithTasks: DailyLog[] = logs?.map(log => ({
        ...log,
        tasks: tasksByDate[log.date] || []
      })) || [];

      // Also include days that have tasks but no logged hours
      Object.keys(tasksByDate).forEach(date => {
        if (!logsWithTasks.find(log => log.date === date)) {
          logsWithTasks.push({
            date,
            hours: 0,
            tasks: tasksByDate[date]
          });
        }
      });

      // Sort by date descending
      logsWithTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailyLogs(logsWithTasks);

      // Load yearly goals
      const { data: goals, error: goalsError } = await supabase
        .from('yearly_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      setYearlyGoals(goals || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDailyHours = async (date: string, hours: number, notes?: string) => {
    if (!user || hours > 12) {
      toast({
        title: "Invalid hours",
        description: "Cannot log more than 12 hours per day",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          date,
          hours,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setDailyLogs(prev => {
        const existingIndex = prev.findIndex(log => log.date === date);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], hours, notes };
          return updated;
        } else {
          return [{ ...data, tasks: [] }, ...prev];
        }
      });

      // Reload data to ensure sync
      await loadUserData();

    } catch (error: any) {
      console.error('Error saving hours:', error);
      toast({
        title: "Error saving hours",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTask = async (title: string, description?: string, targetDate?: string) => {
    if (!user) return;

    const today = getCurrentDateIST();
    const taskDate = targetDate === 'tomorrow' ? 
      new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
      today;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          completed: false,
          date: taskDate,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload data to ensure proper sync
      await loadUserData();

    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const moveTaskToTomorrow = async (taskId: string) => {
    if (!user) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ date: tomorrowISO })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload data to ensure proper sync
      await loadUserData();

      toast({
        title: "Task moved",
        description: "Task moved to tomorrow",
      });

    } catch (error: any) {
      console.error('Error moving task:', error);
      toast({
        title: "Error moving task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;

    try {
      // Find the task first
      const task = dailyLogs
        .flatMap(log => log.tasks)
        .find(t => t.id === taskId);

      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setDailyLogs(prev =>
        prev.map(log => ({
          ...log,
          tasks: log.tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        }))
      );

    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addYearlyGoal = async (title: string, description: string, estimatedHours: number) => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    try {
      const { data, error } = await supabase
        .from('yearly_goals')
        .insert({
          user_id: user.id,
          title,
          description,
          estimated_hours: estimatedHours,
          logged_hours: 0,
          year: currentYear,
        })
        .select()
        .single();

      if (error) throw error;

      setYearlyGoals(prev => [data, ...prev]);

    } catch (error: any) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error adding goal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateYearlyGoalHours = async (goalId: string, loggedHours: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('yearly_goals')
        .update({ logged_hours: loggedHours })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setYearlyGoals(prev =>
        prev.map(goal =>
          goal.id === goalId ? { ...goal, logged_hours: loggedHours } : goal
        )
      );

    } catch (error: any) {
      console.error('Error updating goal hours:', error);
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTodayLog = (): DailyLog => {
    const today = getCurrentDateIST();
    return dailyLogs.find(log => log.date === today) || {
      date: today,
      hours: 0,
      tasks: []
    };
  };

  const getYearlyProgress = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalHoursInYear = dailyLogs.reduce((sum, log) => sum + log.hours, 0);
    const yearlyGoal = 4380; // 12 hours * 365 days
    const expectedHours = daysPassed * 12; // 12 hours per day expected
    const expectedPercentage = Math.min(100, (expectedHours / yearlyGoal) * 100);
    const actualPercentage = Math.min(100, (totalHoursInYear / yearlyGoal) * 100);
    const hoursBehindOrAhead = totalHoursInYear - expectedHours;
    const isAhead = hoursBehindOrAhead >= 0;

    return {
      completed: totalHoursInYear,
      remaining: Math.max(0, yearlyGoal - totalHoursInYear),
      percentage: actualPercentage,
      goal: yearlyGoal,
      expectedHours,
      daysPassed,
      expectedPercentage,
      hoursBehindOrAhead: Math.abs(hoursBehindOrAhead),
      isAhead
    };
  };

  const getDailyTarget = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365; // Simplified
    const daysRemaining = daysInYear - daysPassed + 1;
    
    const progress = getYearlyProgress();
    const dailyTarget = progress.remaining / daysRemaining;
    
    return {
      target: Math.max(0, dailyTarget),
      daysRemaining
    };
  };

  return {
    dailyLogs,
    yearlyGoals,
    loading,
    addDailyHours,
    addTask,
    toggleTask,
    moveTaskToTomorrow,
    addYearlyGoal,
    updateYearlyGoalHours,
    getTodayLog,
    getYearlyProgress,
    getDailyTarget,
    getCurrentDateIST,
    loadUserData,
    YEARLY_GOAL
  };
};
