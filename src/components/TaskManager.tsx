
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const TaskManager = () => {
  const { addTask, toggleTask, getTodayLog } = useSupabaseStore();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  
  const todayLog = getTodayLog();
  const completedTasks = todayLog.tasks.filter(task => task.completed).length;
  const totalTasks = todayLog.tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      addTask(taskTitle.trim(), taskDescription.trim() || undefined);
      setTaskTitle("");
      setTaskDescription("");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Daily Tasks</h1>
        <p className="text-muted-foreground">Organize your productive hours</p>
      </div>

      {/* Task Stats */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold gradient-bg bg-clip-text text-transparent">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-sm text-muted-foreground">Tasks Completed Today</div>
          
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {completionRate.toFixed(0)}% completion rate
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add New Task */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <form onSubmit={handleAddTask} className="space-y-4">
          <h3 className="text-lg font-semibold">Add New Task</h3>
          
          <div className="space-y-2">
            <Input
              placeholder="Task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            
            <Textarea
              placeholder="Description (optional)..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[80px]"
            />
          </div>
          
          <Button type="submit" className="w-full gradient-bg" disabled={!taskTitle.trim()}>
            Add Task
          </Button>
        </form>
      </Card>

      {/* Task List */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-semibold mb-4">Today's Tasks</h3>
        
        {todayLog.tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Add your first task above! ✨
          </div>
        ) : (
          <div className="space-y-3">
            {todayLog.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  task.completed
                    ? 'bg-success/10 border-success/30 text-muted-foreground'
                    : 'bg-secondary/50 border-border/50 hover:bg-secondary/70'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id!)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {task.title}
                    </div>
                    
                    {task.description && (
                      <div className={`text-sm mt-1 ${
                        task.completed ? 'line-through text-muted-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  {task.completed && (
                    <div className="text-success text-xl">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {todayLog.tasks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
            {completionRate === 100 
              ? "All tasks completed! Great work! 🎉"
              : `${totalTasks - completedTasks} task${totalTasks - completedTasks !== 1 ? 's' : ''} remaining`
            }
          </div>
        )}
      </Card>
    </div>
  );
};

export default TaskManager;
