import React from 'react';
import { WritingGoal } from '../../supabase-tables';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface GoalTrackerProps {
  goals: WritingGoal[];
  onGoalCompleted: (goalId: string, completed: boolean) => void;
}

export default function GoalTracker({ goals, onGoalCompleted }: GoalTrackerProps) {
  // Function to get goal period label
  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'project': return 'Project';
      default: return period;
    }
  };

  // Function to get goal type label
  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'word_count': return 'Words';
      case 'scene_count': return 'Scenes';
      case 'time_spent': return 'Minutes';
      case 'custom': return 'Custom';
      default: return type;
    }
  };

  // Function to calculate goal progress percentage (mock for now)
  const calculateProgress = (goal: WritingGoal) => {
    // This would be replaced with actual logic based on tracking current progress
    // For now, we'll return a random percentage between 10% and 95%
    return Math.floor(Math.random() * 85) + 10;
  };

  // Group goals by time period
  const groupedGoals = goals.reduce<Record<string, WritingGoal[]>>((acc, goal) => {
    const period = goal.time_period;
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(goal);
    return acc;
  }, {});

  if (goals.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold mb-2">No Active Writing Goals</h3>
        <p className="text-muted-foreground mb-4">
          Setting specific goals can help you stay motivated and track your writing progress.
        </p>
        <p className="text-sm">Click the "Set New Goal" button to create your first goal.</p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(groupedGoals).map(([period, periodGoals]) => (
        <div key={period} className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {getTimePeriodLabel(period)} Goals
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periodGoals.map((goal) => {
              const progress = calculateProgress(goal);
              
              return (
                <Card key={goal.id} className="relative">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {getGoalTypeLabel(goal.goal_type)}
                      </Badge>
                    </div>
                    <Checkbox 
                      checked={goal.is_completed} 
                      onCheckedChange={(checked) => {
                        onGoalCompleted(goal.id, checked === true);
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    )}
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{progress}%</span>
                        <span>Target: {goal.target_value} {getGoalTypeLabel(goal.goal_type)}</span>
                      </div>
                      <Progress value={progress} className="h-2 w-full" />
                    </div>
                    
                    {goal.start_date && goal.end_date && (
                      <div className="text-xs text-muted-foreground mt-4">
                        {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    {goal.is_recurring && (
                      <Badge variant="secondary" className="mt-2">
                        Recurring
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
