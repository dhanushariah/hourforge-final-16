
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const Dashboard = () => {
  const { getYearlyProgress, getDailyTarget, getTodayLog } = useSupabaseStore();
  
  const yearlyProgress = getYearlyProgress();
  const dailyTarget = getDailyTarget();
  const todayLog = getTodayLog();
  const dailyProgress = (todayLog.hours / 12) * 100;

  console.log('Yearly Progress Data:', yearlyProgress); // Debug log

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">
          HourForge
        </h1>
        <p className="text-muted-foreground">Track your productive hours</p>
      </div>

      {/* Yearly Progress */}
      <Card className="p-6 glassmorphism border-primary/20 hover-lift soft-gradient">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Yearly Progress</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-foreground">
              <span>Hours Completed</span>
              <span className="font-medium">{yearlyProgress.completed.toFixed(1)}</span>
            </div>
            <Progress 
              value={yearlyProgress.percentage} 
              className="h-3" 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{yearlyProgress.percentage.toFixed(1)}% Complete</span>
              <span>{Math.max(0, yearlyProgress.remaining).toFixed(0)} hours remaining</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {yearlyProgress.goal}
              </div>
              <div className="text-xs text-muted-foreground">Goal</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {yearlyProgress.expectedHours.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Expected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent">
                {yearlyProgress.completed.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Actual</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${yearlyProgress.isAhead ? 'text-success' : 'text-warning'}`}>
                {yearlyProgress.isAhead ? '+' : '-'}{yearlyProgress.hoursBehindOrAhead.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Difference</div>
            </div>
          </div>

          <div className="text-center p-3 rounded-2xl bg-secondary/50">
            <div className="text-sm text-foreground">
              You're {yearlyProgress.isAhead ? 'ahead by' : 'behind by'}{' '}
              <span className={`font-bold ${yearlyProgress.isAhead ? 'text-success' : 'text-warning'}`}>
                {yearlyProgress.hoursBehindOrAhead.toFixed(1)} hours
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Day {yearlyProgress.daysPassed} of 365 • Expected: {yearlyProgress.expectedPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Progress */}
      <Card className="p-6 glassmorphism border-primary/20 hover-lift soft-gradient">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Today's Progress</h2>
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
              <div className="text-2xl font-bold text-primary">
                {dailyTarget.target.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Target/Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
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
