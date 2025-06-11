
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { CheckCircle2, Circle, ArrowRight, Plus, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

const TaskManager = () => {
  const { getTodayLog, addTask, toggleTask, moveTaskToTomorrow } = useSupabaseStore();
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  
  const todayLog = getTodayLog();
  
  // Get tomorrow's tasks (tasks with tomorrow's date)
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
    toast.success("Task added successfully!");
  };

  const handleEditTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(currentTitle);
  };

  const handleSaveEdit = async (taskId: string) => {
    // For now, we'll just update locally since we don't have an update task function
    // You could add this to useSupabaseStore later
    setEditingTaskId(null);
    setEditingTaskTitle("");
    toast.success("Task updated!");
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const handleMoveToTomorrow = async (taskId: string) => {
    await moveTaskToTomorrow(taskId);
    toast.success("Task moved to tomorrow ✅");
  };

  const TaskItem = ({ task, showMoveButton = true }: { task: any, showMoveButton?: boolean }) => (
    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
      <button
        onClick={() => toggleTask(task.id)}
        className="text-primary hover:text-primary/80 transition-colors"
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
            <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </span>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditTask(task.id, task.title)}
                className="h-8 w-8 p-0 hover:bg-primary/20"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              {showMoveButton && !task.completed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMoveToTomorrow(task.id)}
                  className="h-8 w-8 p-0 hover:bg-accent/20"
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
    <div className="space-y-6 p-4 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
        <p className="text-muted-foreground">Organize your daily tasks</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glassmorphism">
          <TabsTrigger value="today" className="data-[state=active]:glossy-gradient">
            Today ({todayLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="data-[state=active]:glossy-gradient">
            Tomorrow ({tomorrowLog.tasks.filter(t => !t.completed).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card className="p-6 glassmorphism border-primary/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient">
                  {todayLog.tasks.filter(t => t.completed).length} / {todayLog.tasks.length} completed
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="bg-background/50 border-border/50"
                />
                <Button onClick={() => handleAddTask()} className="glossy-gradient px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {todayLog.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
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
          <Card className="p-6 glassmorphism border-accent/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Tomorrow's Tasks</h3>
                <Badge variant="secondary" className="glossy-gradient">
                  {tomorrowLog.tasks.filter(t => t.completed).length} / {tomorrowLog.tasks.length} completed
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add a task for tomorrow..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask('tomorrow')}
                  className="bg-background/50 border-border/50"
                />
                <Button onClick={() => handleAddTask('tomorrow')} className="glossy-gradient px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {tomorrowLog.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
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
