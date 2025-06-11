
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { toast } from "sonner";
import { TaskInput } from "./tasks/TaskInput";
import { TaskList } from "./tasks/TaskList";

const TaskManager = () => {
  const { getTodayLog, addTask, updateTask, toggleTask, moveTaskToTomorrow, deleteTask, loadUserData, dailyLogs } = useSupabaseStore();
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
  
  // Get tomorrow's tasks from dailyLogs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  const tomorrowLog = dailyLogs.find(log => log.date === tomorrowDate) || {
    date: tomorrowDate,
    hours: 0,
    tasks: []
  };

  const handleAddTask = async (targetDate?: string) => {
    if (!newTask.trim()) return;
    
    try {
      await addTask(newTask.trim(), undefined, targetDate);
      setNewTask("");
      toast.success("Task added successfully! ✅");
      await loadUserData();
    } catch (error) {
      toast.error("Failed to add task");
    }
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
    try {
      await moveTaskToTomorrow(taskId);
      toast.success("Task moved to tomorrow ✅");
      await loadUserData();
    } catch (error) {
      toast.error("Failed to move task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully! 🗑️");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

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

              <TaskInput
                value={newTask}
                onChange={setNewTask}
                onAdd={() => handleAddTask()}
                placeholder="Add a new task..."
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
          <Card className="p-4 sm:p-6 glassmorphism border-accent/20">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Tomorrow's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient self-start sm:self-auto">
                  {tomorrowLog.tasks.filter(t => t.completed).length} / {tomorrowLog.tasks.length} completed
                </Badge>
              </div>

              <TaskInput
                value={newTask}
                onChange={setNewTask}
                onAdd={() => handleAddTask('tomorrow')}
                placeholder="Add a task for tomorrow..."
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
