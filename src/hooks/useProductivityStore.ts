
import { useState, useEffect } from 'react';

export interface DailyLog {
  date: string;
  hours: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

export interface YearlyGoal {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
}

const YEARLY_GOAL = 4380; // 12 hours * 365 days
const STORAGE_KEY = 'hourforge-data';

interface ProductivityData {
  dailyLogs: DailyLog[];
  yearlyGoals: YearlyGoal[];
  currentYearTotal: number;
}

export const useProductivityStore = () => {
  const [data, setData] = useState<ProductivityData>({
    dailyLogs: [],
    yearlyGoals: [],
    currentYearTotal: 0
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        setData(parsedData);
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const addDailyHours = (date: string, hours: number) => {
    setData(prev => {
      const existingLogIndex = prev.dailyLogs.findIndex(log => log.date === date);
      const updatedLogs = [...prev.dailyLogs];
      
      if (existingLogIndex >= 0) {
        updatedLogs[existingLogIndex] = {
          ...updatedLogs[existingLogIndex],
          hours
        };
      } else {
        updatedLogs.push({
          date,
          hours,
          tasks: []
        });
      }

      // Recalculate yearly total
      const currentYear = getCurrentYear();
      const yearlyTotal = updatedLogs
        .filter(log => log.date.startsWith(currentYear.toString()))
        .reduce((sum, log) => sum + log.hours, 0);

      return {
        ...prev,
        dailyLogs: updatedLogs,
        currentYearTotal: yearlyTotal
      };
    });
  };

  const addTask = (title: string, description?: string) => {
    const today = getCurrentDate();
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setData(prev => {
      const existingLogIndex = prev.dailyLogs.findIndex(log => log.date === today);
      const updatedLogs = [...prev.dailyLogs];
      
      if (existingLogIndex >= 0) {
        updatedLogs[existingLogIndex] = {
          ...updatedLogs[existingLogIndex],
          tasks: [...updatedLogs[existingLogIndex].tasks, newTask]
        };
      } else {
        updatedLogs.push({
          date: today,
          hours: 0,
          tasks: [newTask]
        });
      }

      return {
        ...prev,
        dailyLogs: updatedLogs
      };
    });
  };

  const toggleTask = (taskId: string) => {
    const today = getCurrentDate();
    setData(prev => {
      const updatedLogs = prev.dailyLogs.map(log => {
        if (log.date === today) {
          return {
            ...log,
            tasks: log.tasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          };
        }
        return log;
      });

      return {
        ...prev,
        dailyLogs: updatedLogs
      };
    });
  };

  const addYearlyGoal = (title: string, description: string, estimatedHours: number) => {
    const newGoal: YearlyGoal = {
      id: Date.now().toString(),
      title,
      description,
      estimatedHours,
      loggedHours: 0,
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      yearlyGoals: [...prev.yearlyGoals, newGoal]
    }));
  };

  const getTodayLog = () => {
    const today = getCurrentDate();
    return data.dailyLogs.find(log => log.date === today) || {
      date: today,
      hours: 0,
      tasks: []
    };
  };

  const getYearlyProgress = () => {
    const completed = data.currentYearTotal;
    const remaining = Math.max(0, YEARLY_GOAL - completed);
    const percentage = Math.min(100, (completed / YEARLY_GOAL) * 100);
    
    return {
      completed,
      remaining,
      percentage,
      goal: YEARLY_GOAL
    };
  };

  const getDailyTarget = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = new Date(now.getFullYear(), 11, 31).getDate() === 31 ? 365 : 366;
    const daysRemaining = daysInYear - daysPassed + 1;
    
    const progress = getYearlyProgress();
    const dailyTarget = progress.remaining / daysRemaining;
    
    return {
      target: Math.max(0, dailyTarget),
      daysRemaining
    };
  };

  return {
    data,
    addDailyHours,
    addTask,
    toggleTask,
    addYearlyGoal,
    getTodayLog,
    getYearlyProgress,
    getDailyTarget,
    YEARLY_GOAL
  };
};
