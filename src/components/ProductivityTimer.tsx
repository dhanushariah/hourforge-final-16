
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnhancedTimer } from "@/hooks/useEnhancedTimer";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

const ProductivityTimer = () => {
  const timer = useEnhancedTimer();
  const { getTodayLog } = useSupabaseStore();
  const todayLog = getTodayLog();

  // Calculate progress ring
  const todayHours = todayLog.hours;
  const dailyGoal = 12;
  const progressPercentage = Math.min(100, (todayHours / dailyGoal) * 100);
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Productivity Timer</h1>
        <p className="text-muted-foreground">Track your focused work time</p>
      </div>

      {/* Timer Display with Progress Ring */}
      <Card className="p-8 glassmorphism border-primary/20">
        <div className="text-center space-y-6">
          {/* Progress Ring around Timer */}
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted-foreground/20"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="transparent"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-in-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className="stop-color-primary" />
                  <stop offset="100%" className="stop-color-accent" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold tracking-tight text-foreground">
                {timer.formattedTime}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {timer.isRunning ? 'Running' : timer.isPaused ? 'Paused' : 'Ready'}
              </div>
            </div>
          </div>
          
          {/* Fixed Timer Controls Container */}
          <div className="sticky bottom-4 z-10">
            <div className="flex flex-wrap justify-center gap-3 p-4 bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50">
              {timer.isIdle && (
                <Button
                  onClick={timer.start}
                  size="lg"
                  className="px-8 py-3 rounded-2xl gradient-bg hover:opacity-90 flex items-center gap-2 text-primary-foreground"
                >
                  <Play size={20} />
                  Start Timer
                </Button>
              )}
              
              {timer.isRunning && (
                <>
                  <Button
                    onClick={timer.pause}
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-2xl flex items-center gap-2 text-foreground"
                  >
                    <Pause size={20} />
                    Pause
                  </Button>
                  <Button
                    onClick={timer.end}
                    size="lg"
                    className="px-6 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 flex items-center gap-2 text-destructive-foreground"
                  >
                    <Square size={20} />
                    End & Save
                  </Button>
                </>
              )}
              
              {timer.isPaused && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={timer.resume}
                    size="lg"
                    className="px-6 py-3 rounded-2xl gradient-bg hover:opacity-90 flex items-center gap-2 text-primary-foreground"
                  >
                    <Play size={20} />
                    Resume
                  </Button>
                  <Button
                    onClick={timer.end}
                    size="lg"
                    className="px-6 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 flex items-center gap-2 text-destructive-foreground"
                  >
                    <Square size={20} />
                    End & Save
                  </Button>
                  <Button
                    onClick={timer.reset}
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-2xl flex items-center gap-2 text-foreground"
                  >
                    <RotateCcw size={20} />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </div>

          {timer.isRunning && (
            <div className="text-sm text-muted-foreground animate-pulse-gentle">
              Timer is running... Stay focused! 🎯
            </div>
          )}
        </div>
      </Card>

      {/* Session Info */}
      <Card className="p-6 glassmorphism border-border/50">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Today's Progress</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <div className="text-xl font-bold text-primary">
                {timer.hours.toFixed(2)}h
              </div>
              <div className="text-xs text-muted-foreground">Current Session</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <div className="text-xl font-bold text-foreground">
                {todayLog.hours.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Today's Total</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <div className="text-xl font-bold text-accent">
                {Math.max(0, dailyGoal - todayLog.hours).toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {progressPercentage >= 100 
              ? "🎉 Daily goal achieved! Excellent work!"
              : timer.isRunning 
                ? "Hours will be automatically logged when you end the timer"
                : "Start the timer to begin tracking your productive hours"
            }
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductivityTimer;
