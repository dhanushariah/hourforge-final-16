
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Trash2, Pencil } from "lucide-react";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const YearlyGoals = () => {
  const { yearlyGoals, addYearlyGoal, updateYearlyGoal, updateYearlyGoalHours, deleteYearlyGoal } = useSupabaseStore();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editingGoalData, setEditingGoalData] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim()) {
      addYearlyGoal(goalTitle.trim(), goalDescription.trim());
      setGoalTitle("");
      setGoalDescription("");
    }
  };

  const handleEditHours = (goalId: string, currentHours: number) => {
    setEditingGoal(goalId);
    setEditHours(currentHours.toString());
  };

  const handleSaveHours = (goalId: string) => {
    const hours = parseFloat(editHours);
    if (!isNaN(hours) && hours >= 0) {
      updateYearlyGoalHours(goalId, hours);
    }
    setEditingGoal(null);
    setEditHours("");
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditHours("");
  };

  const handleEditGoal = (goalId: string, title: string, description: string) => {
    setEditingGoalData(goalId);
    setEditTitle(title);
    setEditDescription(description || "");
  };

  const handleSaveGoal = (goalId: string) => {
    if (editTitle.trim()) {
      updateYearlyGoal(goalId, editTitle.trim(), editDescription.trim());
      setEditingGoalData(null);
      setEditTitle("");
      setEditDescription("");
    }
  };

  const handleCancelGoalEdit = () => {
    setEditingGoalData(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      deleteYearlyGoal(goalId);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Yearly Goals</h1>
          <Badge variant="secondary" className="text-sm">
            {yearlyGoals.length} {yearlyGoals.length === 1 ? 'Goal' : 'Goals'}
          </Badge>
        </div>
        <p className="text-muted-foreground">Track your long-term objectives</p>
      </div>

      {/* Add New Goal */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Add New Goal</h3>
          
          <div className="space-y-4">
            <Input
              placeholder="Goal title..."
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            
            <Textarea
              placeholder="Goal description (optional)..."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[80px]"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full gradient-bg text-primary-foreground" 
            disabled={!goalTitle.trim()}
          >
            Add Goal
          </Button>
        </form>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        {yearlyGoals.length === 0 ? (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="text-center text-muted-foreground">
              No yearly goals yet. Create your first goal above! 🎯
            </div>
          </Card>
        ) : (
          yearlyGoals.map((goal) => {
            const progress = goal.logged_hours > 0 ? Math.min(100, (goal.logged_hours / Math.max(goal.logged_hours, 100)) * 100) : 0;
            const isEditingHours = editingGoal === goal.id;
            const isEditingGoalData = editingGoalData === goal.id;
            
            return (
              <Card key={goal.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {isEditingGoalData ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-lg font-semibold"
                            placeholder="Goal title..."
                          />
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="text-sm"
                            placeholder="Goal description..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveGoal(goal.id!)}
                              className="h-8"
                            >
                              <Save size={14} className="mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelGoalEdit}
                              className="h-8"
                            >
                              <X size={14} className="mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditGoal(goal.id!, goal.title, goal.description || "")}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGoal(goal.id!)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {goal.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    
                    {!isEditingGoalData && (
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-primary">
                          {goal.logged_hours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-muted-foreground">Logged</div>
                      </div>
                    )}
                  </div>

                  {!isEditingGoalData && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.logged_hours.toFixed(1)}h logged</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-muted-foreground text-center">
                          Keep tracking your progress! 💪
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-4 border-t border-border/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditingHours ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editHours}
                                  onChange={(e) => setEditHours(e.target.value)}
                                  className="w-20 h-8 text-sm text-center p-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveHours(goal.id!)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Save size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-lg font-bold text-primary">
                                  {goal.logged_hours.toFixed(1)}h
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditHours(goal.id!, goal.logged_hours)}
                                  className="h-6 w-6 p-0 ml-1"
                                >
                                  <Edit2 size={12} />
                                </Button>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Update Hours</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default YearlyGoals;
