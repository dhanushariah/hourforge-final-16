
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { usePersistentTimer } from "@/hooks/usePersistentTimer";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { useEffect } from "react";

const ProductivityTimer = () => {
  const {
    formattedTime,
    state,
    hours,
    start,
    pause,
    resume,
    end,
    reset,
    toggle,
  } = usePersistentTimer();
  
  const { loadUserData } = useSupabaseStore();

  // Refresh data when timer ends to sync with today's progress
  useEffect(() => {
    if (state === 'idle') {
      loadUserData();
    }
  }, [state, loadUserData]);

  const getTimerStateColor = () => {
    switch (state) {
      case 'running':
        return 'text-success';
      case 'paused':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTimerStateText = () => {
    switch (state) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Productivity Timer</h1>
        <p className="text-muted-foreground">Track your focused work sessions</p>
      </div>

      {/* Timer Display */}
      <Card className="p-8 glassmorphism border-primary/20 hover-lift">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-6xl font-bold gradient-text font-mono tracking-wider">
              {formattedTime}
            </div>
            <div className={`text-sm font-medium ${getTimerStateColor()}`}>
              {getTimerStateText()}
            </div>
            {hours > 0 && (
              <div className="text-sm text-muted-foreground">
                {hours.toFixed(2)} hours
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {state === 'idle' ? (
              <Button
                onClick={start}
                size="lg"
                className="glossy-gradient text-primary-foreground px-8 py-3 text-lg font-medium"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggle}
                  size="lg"
                  variant="outline"
                  className="glossy-gradient border-primary/30 px-6 py-3"
                >
                  {state === 'running' ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={end}
                  size="lg"
                  className="glossy-gradient bg-success text-success-foreground px-6 py-3"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End & Save
                </Button>
                
                <Button
                  onClick={reset}
                  size="lg"
                  variant="outline"
                  className="glossy-gradient border-destructive/30 text-destructive px-6 py-3"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Session Info */}
      <Card className="p-6 glassmorphism border-border/50">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Session Info</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-2xl bg-secondary/50">
              <div className="text-2xl font-bold text-primary">
                12h
              </div>
              <div className="text-xs text-muted-foreground">Daily Goal</div>
            </div>
            
            <div className="text-center p-3 rounded-2xl bg-secondary/50">
              <div className="text-2xl font-bold text-foreground">
                {hours.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Current Session</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {state === 'running' && "Focus on your productive work! 🚀"}
            {state === 'paused' && "Take a break, you've earned it! ☕"}
            {state === 'idle' && "Ready to start your next productive session!"}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductivityTimer;
