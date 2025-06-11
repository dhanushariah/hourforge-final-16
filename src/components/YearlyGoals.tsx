
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Edit2, Save, X } from "lucide-react";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";

const YearlyGoals = () => {
  const { yearlyGoals, addYearlyGoal, updateYearlyGoalHours } = useSupabaseStore();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim() && estimatedHours) {
      const hours = parseFloat(estimatedHours);
      if (!isNaN(hours) && hours > 0) {
        addYearlyGoal(goalTitle.trim(), goalDescription.trim(), hours);
        setGoalTitle("");
        setGoalDescription("");
        setEstimatedHours("");
      }
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

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Yearly Goals</h1>
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
              placeholder="Goal description..."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[80px]"
            />
            
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="Estimated hours needed..."
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="bg-background/50 border-border/50"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full gradient-bg text-primary-foreground" 
            disabled={!goalTitle.trim() || !estimatedHours}
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
            const progress = Math.min(100, (goal.logged_hours / goal.estimated_hours) * 100);
            const remainingHours = Math.max(0, goal.estimated_hours - goal.logged_hours);
            const isEditing = editingGoal === goal.id;
            
            return (
              <Card key={goal.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary">
                        {progress.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.logged_hours.toFixed(1)} / {goal.estimated_hours}h</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {progress >= 100 
                        ? "Goal completed! 🎉" 
                        : `${remainingHours.toFixed(1)} hours remaining`
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={editHours}
                              onChange={(e) => setEditHours(e.target.value)}
                              className="w-16 h-6 text-sm text-center p-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveHours(goal.id!)}
                              className="h-6 w-6 p-0"
                            >
                              <Save size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-6 w-6 p-0"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-primary">
                              {goal.logged_hours.toFixed(1)}
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
                      <div className="text-xs text-muted-foreground">Logged</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        {goal.estimated_hours}
                      </div>
                      <div className="text-xs text-muted-foreground">Target</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-warning">
                        {remainingHours.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Left</div>
                    </div>
                  </div>
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
