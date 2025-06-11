
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const DailyLog = () => {
  const { dailyLogs, addDailyHours, getTodayLog, getCurrentDateIST, loadUserData } = useSupabaseStore();
  const [hoursInput, setHoursInput] = useState("");
  const todayLog = getTodayLog();

  // Listen for timer saves to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      loadUserData();
    };
    
    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursInput);
    if (!isNaN(hours) && hours >= 0 && hours <= 12) {
      const today = getCurrentDateIST();
      addDailyHours(today, hours);
      setHoursInput("");
    }
  };

  const recentLogs = dailyLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Log</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Log and track your daily hours</p>
      </div>

      {/* Today's Entry */}
      <Card className="p-4 sm:p-6 glassmorphism border-primary/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Today's Hours</h3>
            <div className="text-2xl sm:text-3xl font-bold gradient-text">
              {todayLog.hours.toFixed(1)}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours" className="text-foreground">Update Today's Hours</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="hours"
                type="number"
                step="0.1"
                min="0"
                max="12"
                placeholder="Enter hours (max 12)"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                className="bg-background/50 border-border/50 text-foreground"
              />
              <Button 
                type="submit" 
                className="glossy-gradient text-primary-foreground px-4 sm:px-6 min-h-[40px] whitespace-nowrap"
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum 12 hours per day allowed
            </p>
          </div>
        </form>
      </Card>

      {/* Recent History */}
      <Card className="p-4 sm:p-6 glassmorphism border-border/50">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-foreground">Recent History</h3>
        
        {recentLogs.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            No entries yet. Start logging your hours! 📝
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const date = new Date(log.date);
              const isToday = log.date === getCurrentDateIST();
              
              return (
                <div
                  key={log.date}
                  className={`flex justify-between items-center p-3 rounded-2xl ${
                    isToday 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-secondary/50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.tasks.length} task{log.tasks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {log.hours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.hours >= 12 ? '🎯' : log.hours >= 8 ? '👍' : '📈'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recentLogs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="text-center text-sm text-muted-foreground">
              Week Average: {(recentLogs.reduce((sum, log) => sum + log.hours, 0) / recentLogs.length).toFixed(1)} hours/day
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DailyLog;
