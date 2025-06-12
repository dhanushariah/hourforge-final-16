
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { toast } from "sonner";
import { TaskInput } from "./tasks/TaskInput";
import { TaskList } from "./tasks/TaskList";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const TaskManager = () => {
  const { 
    getTodayLog, 
    addTask, 
    updateTask, 
    toggleTask, 
    moveTaskToTomorrow, 
    deleteTask, 
    loadUserData, 
    dailyLogs,
    isLoading,
    hasError 
  } = useSupabaseStore();
  
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  
  const todayLog = getTodayLog();
  
  // Get tomorrow's tasks with better error handling
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  const tomorrowLog = dailyLogs.find(log => log.date === tomorrowDate) || {
    date: tomorrowDate,
    hours: 0,
    tasks: []
  };

  // Handle data refresh on mount and when there are errors
  useEffect(() => {
    if (hasError) {
      console.log('TaskManager: Error detected, attempting to reload data');
      loadUserData();
    }
  }, [hasError, loadUserData]);

  // Listen for timer saves to refresh data
  useEffect(() => {
    const handleTimerSaved = () => {
      console.log('TaskManager: Timer saved event received, refreshing data');
      loadUserData();
    };
    
    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [loadUserData]);

  const handleAddTask = async (targetDate?: string) => {
    if (!newTask.trim()) return;
    
    setIsRefreshing(true);
    try {
      console.log('TaskManager: Adding task', { title: newTask, targetDate });
      await addTask(newTask.trim(), undefined, targetDate);
      setNewTask("");
      toast.success("Task added successfully! ✅");
      
      // Force reload to ensure consistency
      await loadUserData();
      console.log('TaskManager: Task added and data refreshed');
    } catch (error) {
      console.error('TaskManager: Failed to add task', error);
      toast.error("Failed to add task");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditTask = async (taskId: string, currentTitle: string) => {
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
      await loadUserData();
    } catch (error) {
      console.error('TaskManager: Failed to update task', error);
      toast.error("Failed to update task");
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const handleMoveToTomorrow = async (taskId: string) => {
    setIsRefreshing(true);
    try {
      await moveTaskToTomorrow(taskId);
      toast.success("Task moved to tomorrow ✅");
      await loadUserData();
    } catch (error) {
      console.error('TaskManager: Failed to move task', error);
      toast.error("Failed to move task");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsRefreshing(true);
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully! 🗑️");
      await loadUserData();
    } catch (error) {
      console.error('TaskManager: Failed to delete task', error);
      toast.error("Failed to delete task");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      toast.success("Data refreshed! ✅");
    } catch (error) {
      console.error('TaskManager: Failed to refresh data', error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-poppins">Task Manager</h1>
          <p className="text-sm sm:text-base text-muted-foreground font-poppins">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-poppins">Task Manager</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground font-poppins">Organize your daily tasks</p>
        {hasError && (
          <p className="text-sm text-destructive font-poppins">
            Connection issue detected. Click refresh to retry.
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 glassmorphism">
          <TabsTrigger value="today" className="data-[state=active]:glossy-gradient text-sm font-poppins">
            Today ({todayLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="data-[state=active]:glossy-gradient text-sm font-poppins">
            Tomorrow ({tomorrowLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card className="p-4 sm:p-6 glow-card hover-lift">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground font-poppins">Today's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient self-start sm:self-auto font-poppins">
                  {todayLog.tasks.filter(t => t.completed).length} / {todayLog.tasks.length} completed
                </Badge>
              </div>

              <TaskInput
                value={newTask}
                onChange={setNewTask}
                onAdd={() => handleAddTask()}
                placeholder="Add a new task..."
                disabled={isRefreshing}
              />

              <TaskList
                tasks={todayLog.tasks}
                showMoveButton={true}
                editingTaskId={editingTaskId}
                editingTaskTitle={editingTaskTitle}
                onToggle={toggleTask}
                onEdit={handleEditTask}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteTask}
                onMove={handleMoveToTomorrow}
                onEditTitleChange={setEditingTaskTitle}
                emptyMessage="No tasks for today. Add one above! 📝"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          <Card className="p-4 sm:p-6 glow-card hover-lift">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground font-poppins">Tomorrow's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient self-start sm:self-auto font-poppins">
                  {tomorrowLog.tasks.filter(t => t.completed).length} / {tomorrowLog.tasks.length} completed
                </Badge>
              </div>

              <TaskInput
                value={newTask}
                onChange={setNewTask}
                onAdd={() => handleAddTask('tomorrow')}
                placeholder="Add a task for tomorrow..."
                disabled={isRefreshing}
              />

              <TaskList
                tasks={tomorrowLog.tasks}
                showMoveButton={false}
                editingTaskId={editingTaskId}
                editingTaskTitle={editingTaskTitle}
                onToggle={toggleTask}
                onEdit={handleEditTask}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteTask}
                onMove={handleMoveToTomorrow}
                onEditTitleChange={setEditingTaskTitle}
                emptyMessage="No tasks planned for tomorrow. Plan ahead! 🌅"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManager;
