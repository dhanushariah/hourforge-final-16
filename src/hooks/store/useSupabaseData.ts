
import { useState } from 'react';
import { DailyLog, YearlyGoal } from '../useSupabaseStore';

export const useSupabaseData = () => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);

  return {
    dailyLogs,
    setDailyLogs,
    yearlyGoals,
    setYearlyGoals,
  };
};
