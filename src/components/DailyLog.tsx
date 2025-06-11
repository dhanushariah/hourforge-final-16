
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { Clock, Target, TrendingUp } from "lucide-react";

const DailyLog = () => {
  const { dailyLogs, getTodayLog, getCurrentDateIST, loadUserData } = useSupabaseStore();
  const todayLog = getTodayLog();

  // Listen for timer saves to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      loadUserData();
    };
    
    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);

  const recentLogs = dailyLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const totalWeekHours = recentLogs.reduce((sum, log) => sum + log.hours, 0);
  const averageDaily = recentLogs.length > 0 ? totalWeekHours / recentLogs.length : 0;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Log</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your productivity hours</p>
      </div>

      {/* Today's Summary */}
      <Card className="p-4 sm:p-6 glassmorphism border-primary/20">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Hours
            </h3>
            <div className="text-3xl sm:text-4xl font-bold gradient-text">
              {todayLog.hours.toFixed(1)}h
            </div>
            <Badge variant="secondary" className="glossy-gradient">
              {todayLog.hours >= 12 ? '🎯 Goal Reached!' : 
               todayLog.hours >= 8 ? '👍 Great Progress' : 
               todayLog.hours >= 4 ? '📈 Making Progress' : 
               '🚀 Start Your Day!'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <div className="text-xl font-bold text-primary">12h</div>
              <div className="text-xs text-muted-foreground">Daily Goal</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <div className="text-xl font-bold text-foreground">
                {Math.max(0, 12 - todayLog.hours).toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-accent/20 p-2 rounded-lg">
            ⏱️ Hours are automatically logged from timer sessions
          </div>
        </div>
      </Card>

      {/* Weekly Overview */}
      <Card className="p-4 sm:p-6 glassmorphism border-accent/20">
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Week Overview
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-primary/10">
              <div className="text-lg font-bold text-primary">{totalWeekHours.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground">Total Week</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <div className="text-lg font-bold text-foreground">{averageDaily.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground">Daily Avg</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-accent/20">
              <div className="text-lg font-bold text-accent">{recentLogs.length}</div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent History */}
      <Card className="p-4 sm:p-6 glassmorphism border-border/50">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Target className="w-5 h-5" />
          Recent History
        </h3>
        
        {recentLogs.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            No timer sessions yet. Start your first session! ⏱️
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const date = new Date(log.date);
              const isToday = log.date === getCurrentDateIST();
              const progressPercentage = Math.min(100, (log.hours / 12) * 100);
              
              return (
                <div
                  key={log.date}
                  className={`p-4 rounded-2xl border ${
                    isToday 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-secondary/30 border-border/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-medium text-foreground">
                        {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.tasks.length} task{log.tasks.length !== 1 ? 's' : ''} • 
                        {log.notes ? ' Automated Timer Sessions' : ' No sessions'}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {log.hours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.hours >= 12 ? '🎯' : log.hours >= 8 ? '👍' : log.hours >= 4 ? '📈' : '🚀'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    {progressPercentage.toFixed(0)}% of daily goal
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DailyLog;
