
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const Dashboard = () => {
  const { getTodayLog, loadUserData } = useSupabaseStore();
  
  const todayLog = getTodayLog();
  const dailyProgress = (todayLog.hours / 12) * 100;

  // Listen for timer saves to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      loadUserData();
    };
    
    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);

  // Calculate yearly progress based on expected completion
  const getYearlyProgress = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInYear = 365;
    const daysRemaining = daysInYear - daysPassed;
    
    const goal = 4380; // 12 hours * 365 days
    const expectedCompleted = daysPassed * 12; // 12 hours per day expected
    const remainingHours = daysRemaining * 12;
    const expectedPercentage = Math.min(100, (expectedCompleted / goal) * 100);

    return {
      goal,
      expectedCompleted,
      remainingHours,
      percentage: expectedPercentage,
      daysPassed,
      daysRemaining
    };
  };

  const yearlyProgress = getYearlyProgress();

  const getDailyTarget = () => {
    return {
      target: 12, // Fixed 12 hours per day target
      daysRemaining: yearlyProgress.daysRemaining
    };
  };

  const dailyTarget = getDailyTarget();

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
          HourForge
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your productive hours</p>
      </div>

      {/* Yearly Progress */}
      <Card className="p-4 sm:p-6 glassmorphism border-primary/20 hover-lift soft-gradient">
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Yearly Progress</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-foreground">
              <span>Expected Progress</span>
              <span className="font-medium">{yearlyProgress.expectedCompleted} hours</span>
            </div>
            <Progress 
              value={yearlyProgress.percentage} 
              className="h-3" 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{yearlyProgress.percentage.toFixed(1)}% Complete</span>
              <span>{yearlyProgress.remainingHours} hours remaining</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {yearlyProgress.goal}
              </div>
              <div className="text-xs text-muted-foreground">Goal</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent">
                {yearlyProgress.expectedCompleted}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {yearlyProgress.remainingHours}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          <div className="text-center p-3 rounded-2xl bg-secondary/50">
            <div className="text-sm text-foreground">
              Day {yearlyProgress.daysPassed} of 365 • {yearlyProgress.daysRemaining} days remaining
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Expected: {yearlyProgress.expectedCompleted} hours ({yearlyProgress.percentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Progress */}
      <Card className="p-4 sm:p-6 glassmorphism border-primary/20 hover-lift soft-gradient">
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Today's Progress</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-foreground">
              <span>Daily Hours</span>
              <span className="font-medium">{todayLog.hours.toFixed(1)} / 12</span>
            </div>
            <Progress value={Math.min(100, dailyProgress)} className="h-3" />
            <div className="text-xs text-muted-foreground text-center">
              {dailyProgress >= 100 ? "Daily goal achieved! 🎉" : `${(12 - todayLog.hours).toFixed(1)} hours to go`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {dailyTarget.target}
              </div>
              <div className="text-xs text-muted-foreground">Target/Day</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {dailyTarget.daysRemaining}
              </div>
              <div className="text-xs text-muted-foreground">Days Left</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/20 hover-lift button-press">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {todayLog.tasks.filter(t => t.completed).length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-success/20 to-primary/20 border-success/20 hover-lift button-press">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {Math.floor(yearlyProgress.percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">Year Complete</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
