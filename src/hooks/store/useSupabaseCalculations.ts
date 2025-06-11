
export const useSupabaseCalculations = () => {
  const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const getYearlyProgress = (dailyLogs: any[]) => {
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

  const getDailyTarget = (dailyLogs: any[]) => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365;
    const daysRemaining = daysInYear - daysPassed + 1;
    
    const progress = getYearlyProgress(dailyLogs);
    const dailyTarget = progress.remaining / daysRemaining;
    
    return {
      target: Math.max(0, dailyTarget),
      daysRemaining
    };
  };

  return {
    getCurrentDateIST,
    getYearlyProgress,
    getDailyTarget,
  };
};
