
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { CheckCircle2, Circle, ArrowRight, Plus, Edit2, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TaskManager = () => {
  const { getTodayLog, addTask, toggleTask, moveTaskToTomorrow, deleteTask, loadUserData } = useSupabaseStore();
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  
  const todayLog = getTodayLog();
  
  // Listen for timer saves to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      loadUserData();
    };
    
    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);
  
  // Get tomorrow's tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  const { dailyLogs } = useSupabaseStore();
  const tomorrowLog = dailyLogs.find(log => log.date === tomorrowDate) || {
    date: tomorrowDate,
    hours: 0,
    tasks: []
  };

  const handleAddTask = async (targetDate?: string) => {
    if (!newTask.trim()) return;
    
    await addTask(newTask.trim(), undefined, targetDate);
    setNewTask("");
    toast.success("Task added successfully! ✅");
  };

  const handleEditTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(currentTitle);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTaskTitle.trim()) return;
    
    try {
      await updateTask(taskId, editingTaskTitle.trim());
      setEditingTaskId(null);
      setEditingTaskTitle("");
      toast.success("Task updated! ✅");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const handleMoveToTomorrow = async (taskId: string) => {
    await moveTaskToTomorrow(taskId);
    toast.success("Task moved to tomorrow ✅");
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    toast.success("Task deleted successfully! 🗑️");
  };

  const TaskItem = ({ task, showMoveButton = true }: { task: any, showMoveButton?: boolean }) => (
    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
      <button
        onClick={() => toggleTask(task.id)}
        className="text-primary hover:text-primary/80 transition-colors min-w-[20px]"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        {editingTaskId === task.id ? (
          <div className="flex items-center space-x-2">
            <Input
              value={editingTaskTitle}
              onChange={(e) => setEditingTaskTitle(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(task.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <Button
              size="sm"
              onClick={() => handleSaveEdit(task.id)}
              className="glossy-gradient h-8 w-8 p-0"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-sm break-words ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </span>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditTask(task.id, task.title)}
                className="h-8 w-8 p-0 hover:bg-primary/20 min-w-[32px]"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive min-w-[32px]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{task.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {showMoveButton && !task.completed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMoveToTomorrow(task.id)}
                  className="h-8 w-8 p-0 hover:bg-accent/20 min-w-[32px]"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Task Manager</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Organize your daily tasks</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glassmorphism">
          <TabsTrigger value="today" className="data-[state=active]:glossy-gradient text-sm">
            Today ({todayLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="data-[state=active]:glossy-gradient text-sm">
            Tomorrow ({tomorrowLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card className="p-4 sm:p-6 glassmorphism border-primary/20">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Today's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient self-start sm:self-auto">
                  {todayLog.tasks.filter(t => t.completed).length} / {todayLog.tasks.length} completed
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="bg-background/50 border-border/50"
                />
                <Button 
                  onClick={() => handleAddTask()} 
                  className="glossy-gradient px-4 sm:px-6 min-h-[40px] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {todayLog.tasks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    No tasks for today. Add one above! 📝
                  </div>
                ) : (
                  todayLog.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} showMoveButton={true} />
                  ))
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          <Card className="p-4 sm:p-6 glassmorphism border-accent/20">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Tomorrow's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient self-start sm:self-auto">
                  {tomorrowLog.tasks.filter(t => t.completed).length} / {tomorrowLog.tasks.length} completed
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Add a task for tomorrow..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask('tomorrow')}
                  className="bg-background/50 border-border/50"
                />
                <Button 
                  onClick={() => handleAddTask('tomorrow')} 
                  className="glossy-gradient px-4 sm:px-6 min-h-[40px] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {tomorrowLog.tasks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    No tasks planned for tomorrow. Plan ahead! 🌅
                  </div>
                ) : (
                  tomorrowLog.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} showMoveButton={false} />
                  ))
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManager;
