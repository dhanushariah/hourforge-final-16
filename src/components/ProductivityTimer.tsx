
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useProductivityStore } from "@/hooks/useProductivityStore";
import { useEffect } from "react";

const ProductivityTimer = () => {
  const timer = useTimer();
  const { addDailyHours, getTodayLog } = useProductivityStore();
  const todayLog = getTodayLog();

  // Auto-save timer hours when stopping
  useEffect(() => {
    if (!timer.isRunning && timer.seconds > 0) {
      const hoursToAdd = timer.hours;
      if (hoursToAdd > 0) {
        const today = new Date().toISOString().split('T')[0];
        addDailyHours(today, todayLog.hours + hoursToAdd);
        timer.reset();
      }
    }
  }, [timer.isRunning]);

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Productivity Timer</h1>
        <p className="text-muted-foreground">Track your focused work time</p>
      </div>

      {/* Timer Display */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold tracking-tight gradient-bg bg-clip-text text-transparent">
            {timer.formattedTime}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={timer.toggle}
              size="lg"
              className={`px-8 py-3 rounded-2xl transition-all duration-300 ${
                timer.isRunning 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'gradient-bg hover:opacity-90'
              }`}
            >
              {timer.isRunning ? 'Stop Timer' : 'Start Timer'}
            </Button>
            
            {timer.seconds > 0 && (
              <Button
                onClick={timer.reset}
                variant="outline"
                size="lg"
                className="px-8 py-3 rounded-2xl"
              >
                Reset
              </Button>
            )}
          </div>

          {timer.isRunning && (
            <div className="text-sm text-muted-foreground animate-pulse-gentle">
              Timer is running... Stay focused! 🎯
            </div>
          )}
        </div>
      </Card>

      {/* Session Info */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Session Info</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="text-xl font-bold text-primary">
                {timer.hours.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Current Session</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="text-xl font-bold">
                {todayLog.hours.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Today's Total</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {timer.isRunning 
              ? "Hours will be automatically logged when you stop the timer"
              : "Start the timer to begin tracking your productive hours"
            }
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductivityTimer;
