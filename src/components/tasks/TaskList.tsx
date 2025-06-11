
import React from "react";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: any[];
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
  emptyMessage: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
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
  emptyMessage,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          showMoveButton={showMoveButton}
          editingTaskId={editingTaskId}
          editingTaskTitle={editingTaskTitle}
          onToggle={onToggle}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          onMove={onMove}
          onEditTitleChange={onEditTitleChange}
        />
      ))}
    </div>
  );
};
