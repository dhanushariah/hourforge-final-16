
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Edit2, Check, X, Trash2, ArrowRight } from "lucide-react";
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

interface TaskItemProps {
  task: any;
  showMoveButton?: boolean;
  editingTaskId: string | null;
  editingTaskTitle: string;
  onToggle: (taskId: string) => void;
  onEdit: (taskId: string, title: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string) => void;
  onEditTitleChange: (title: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  showMoveButton = true,
  editingTaskId,
  editingTaskTitle,
  onToggle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onMove,
  onEditTitleChange,
}) => {
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTaskId === task.id && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTaskId, task.id]);

  return (
    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
      <button
        onClick={() => onToggle(task.id)}
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
              ref={editInputRef}
              value={editingTaskTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSaveEdit(task.id);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => onSaveEdit(task.id)}
              className="glossy-gradient h-8 w-8 p-0"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
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
                onClick={() => onEdit(task.id, task.title)}
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
                      onClick={() => onDelete(task.id)}
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
                  onClick={() => onMove(task.id)}
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
};
