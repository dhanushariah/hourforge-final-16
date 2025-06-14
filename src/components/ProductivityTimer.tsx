
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 animate-fade-in font-poppins">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Productivity Timer</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your focused work sessions</p>
      </div>

      {/* Timer Display */}
      <Card className="p-4 sm:p-8 glow-card hover-lift">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <div className="text-4xl sm:text-6xl font-bold gradient-text font-mono tracking-wider break-all">
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

          {/* Control Buttons - Color Coded */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            {state === 'idle' ? (
              <Button
                onClick={start}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-medium min-h-[48px] w-full sm:w-auto transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggle}
                  size="lg"
                  className={`${
                    state === 'running' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-white'
                  } px-4 sm:px-6 py-3 min-h-[48px] flex-1 sm:flex-none transition-all duration-200`}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white px-4 sm:px-6 py-3 min-h-[48px] flex-1 sm:flex-none transition-all duration-200"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End & Save
                </Button>
                
                <Button
                  onClick={reset}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white px-4 sm:px-6 py-3 min-h-[48px] flex-1 sm:flex-none transition-all duration-200"
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
      <Card className="p-4 sm:p-6 glow-card">
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Session Info</h3>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 rounded-2xl glassmorphism">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                12h
              </div>
              <div className="text-xs text-muted-foreground">Daily Goal</div>
            </div>
            
            <div className="text-center p-3 rounded-2xl glassmorphism">
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {hours.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Current Session</div>
            </div>
          </div>

          <div className="text-center text-xs sm:text-sm text-muted-foreground px-2">
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
