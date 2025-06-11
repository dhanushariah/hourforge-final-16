
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const DailyLog = () => {
  const { dailyLogs, addDailyHours, getTodayLog, getCurrentDateIST } = useSupabaseStore();
  const [hoursInput, setHoursInput] = useState("");
  const todayLog = getTodayLog();

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
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <p className="text-muted-foreground">Log and track your daily hours</p>
      </div>

      {/* Today's Entry */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Today's Hours</h3>
            <div className="text-3xl font-bold gradient-bg bg-clip-text text-transparent">
              {todayLog.hours.toFixed(1)}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours">Update Today's Hours</Label>
            <div className="flex space-x-2">
              <Input
                id="hours"
                type="number"
                step="0.1"
                min="0"
                max="12"
                placeholder="Enter hours (max 12)"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                className="bg-background/50 border-border/50"
              />
              <Button type="submit" className="px-6 gradient-bg">
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
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-semibold mb-4">Recent History</h3>
        
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                  className={`flex justify-between items-center p-3 rounded-xl ${
                    isToday 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-secondary/50'
                  }`}
                >
                  <div>
                    <div className="font-medium">
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
                    <div className="text-lg font-bold">
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
