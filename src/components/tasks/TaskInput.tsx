
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  value,
  onChange,
  onAdd,
  placeholder,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && onAdd()}
        disabled={disabled}
        className="bg-background/50 border-border/50"
      />
      <Button 
        onClick={onAdd} 
        disabled={disabled}
        className="glossy-gradient px-4 sm:px-6 min-h-[48px] whitespace-nowrap"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
    </div>
  );
};
