
import { DailyLog, YearlyGoal } from './useSupabaseData';

export const useSupabaseCalculations = (dailyLogs: DailyLog[], yearlyGoals: YearlyGoal[]) => {
  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const getTodayLog = (): DailyLog => {
    const today = getCurrentDateIST();
    const todayLog = dailyLogs.find(log => log.date === today);
    
    if (todayLog) {
      return todayLog;
    }
    
    return {
      id: '',
      user_id: '',
      date: today,
      hours: 0,
      tasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const getTodayProgress = () => {
    const todayLog = getTodayLog();
    const progress = (todayLog.hours / 12) * 100;
    return Math.min(100, progress);
  };

  const getYearlyProgress = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalHoursInYear = dailyLogs.reduce((sum, log) => sum + log.hours, 0);
    const yearlyGoal = 4380;
    const expectedHours = daysPassed * 12;
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

  const getWeeklyProgress = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLogs = dailyLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= oneWeekAgo && logDate <= now;
    });
    
    const totalWeekHours = weeklyLogs.reduce((sum, log) => sum + log.hours, 0);
    const averageDaily = weeklyLogs.length > 0 ? totalWeekHours / weeklyLogs.length : 0;
    
    return {
      totalHours: totalWeekHours,
      averageDaily,
      activeDays: weeklyLogs.length
    };
  };

  const getDailyTarget = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365;
    const daysRemaining = daysInYear - daysPassed + 1;
    
    const progress = getYearlyProgress();
    const dailyTarget = progress.remaining / daysRemaining;
    
    return {
      target: Math.max(0, dailyTarget),
      daysRemaining
    };
  };

  return {
    getCurrentDateIST,
    getTodayLog,
    getTodayProgress,
    getYearlyProgress,
    getWeeklyProgress,
    getDailyTarget,
  };
};
