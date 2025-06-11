
import { useState } from 'react';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  notes?: string;
  tasks: Task[];
  created_at: string;
  updated_at: string;
}

export interface YearlyGoal {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  estimated_hours: number;
  logged_hours: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface TimerSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  date: string;
  created_at: string;
}

export const useSupabaseData = () => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);

  return {
    dailyLogs,
    setDailyLogs,
    yearlyGoals,
    setYearlyGoals,
    tasks,
    setTasks,
    timerSessions,
    setTimerSessions,
  };
};
