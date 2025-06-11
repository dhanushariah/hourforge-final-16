
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  value,
  onChange,
  onAdd,
  placeholder,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        className="bg-background/50 border-border/50"
      />
      <Button 
        onClick={onAdd} 
        className="glossy-gradient px-4 sm:px-6 min-h-[48px] whitespace-nowrap"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
    </div>
  );
};
