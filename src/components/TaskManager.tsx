
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { ArrowRight, Calendar, CalendarPlus } from "lucide-react";

const TaskManager = () => {
  const { addTask, toggleTask, getTodayLog, moveTaskToTomorrow } = useSupabaseStore();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  
  const todayLog = getTodayLog();
  const completedTasks = todayLog.tasks.filter(task => task.completed).length;
  const totalTasks = todayLog.tasks.length;
  const incompleteTasks = todayLog.tasks.filter(task => !task.completed);
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      const targetDate = activeTab === 'today' ? undefined : 'tomorrow';
      addTask(taskTitle.trim(), taskDescription.trim() || undefined, targetDate);
      setTaskTitle("");
      setTaskDescription("");
    }
  };

  const handleMoveToTomorrow = (taskId: string) => {
    moveTaskToTomorrow(taskId);
  };

  const renderTaskList = (tasks: any[], showMoveButton: boolean = false) => (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`p-4 rounded-2xl border transition-all duration-200 ${
            task.completed
              ? 'glassmorphism border-success/30 text-muted-foreground'
              : 'glassmorphism border-border/50 hover:border-primary/30'
          }`}
        >
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id!)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-foreground ${
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

            <div className="flex items-center gap-2">
              {showMoveButton && !task.completed && (
                <Button
                  onClick={() => handleMoveToTomorrow(task.id!)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                >
                  <ArrowRight size={16} />
                </Button>
              )}
              {task.completed && (
                <div className="text-success text-xl">✓</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
        <p className="text-muted-foreground">Organize your productive hours</p>
      </div>

      {/* Task Stats */}
      <Card className="p-6 glassmorphism border-primary/20">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold text-foreground">
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

      {/* Tab Navigation */}
      <div className="flex space-x-2 p-1 bg-secondary/50 rounded-2xl">
        <Button
          onClick={() => setActiveTab('today')}
          variant={activeTab === 'today' ? 'default' : 'ghost'}
          className={`flex-1 rounded-xl transition-all duration-200 ${
            activeTab === 'today' 
              ? 'gradient-bg text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          Today ({todayLog.tasks.length})
        </Button>
        <Button
          onClick={() => setActiveTab('tomorrow')}
          variant={activeTab === 'tomorrow' ? 'default' : 'ghost'}
          className={`flex-1 rounded-xl transition-all duration-200 ${
            activeTab === 'tomorrow' 
              ? 'gradient-bg text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarPlus size={16} className="mr-2" />
          Tomorrow (0)
        </Button>
      </div>

      {/* Add New Task */}
      <Card className="p-6 glassmorphism border-border/50">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Add New Task</h3>
            <Badge variant="outline" className="text-xs">
              {activeTab === 'today' ? 'Today' : 'Tomorrow'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="bg-background/50 border-border/50 text-foreground"
            />
            
            <Textarea
              placeholder="Description (optional)..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[80px] text-foreground"
            />
          </div>
          
          <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={!taskTitle.trim()}>
            Add Task to {activeTab === 'today' ? 'Today' : 'Tomorrow'}
          </Button>
        </form>
      </Card>

      {/* Task List */}
      <Card className="p-6 glassmorphism border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {activeTab === 'today' ? "Today's Tasks" : "Tomorrow's Tasks"}
          </h3>
          {activeTab === 'today' && incompleteTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {incompleteTasks.length} incomplete
            </Badge>
          )}
        </div>
        
        {activeTab === 'today' ? (
          todayLog.tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks yet. Add your first task above! ✨
            </div>
          ) : (
            renderTaskList(todayLog.tasks, true)
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No tasks scheduled for tomorrow yet. Plan ahead! 📅
          </div>
        )}

        {activeTab === 'today' && todayLog.tasks.length > 0 && (
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
