import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { DailyProgress, WritingGoal, WritingSession } from '../supabase-tables';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DailyProgressChart from './DailyProgressChart';
import GoalTracker from './GoalTracker';
import SessionHistory from './SessionHistory';
import NewSessionForm from './NewSessionForm';
import NewGoalForm from './NewGoalForm';
import { Button } from '../components/ui/button';

export default function WritingDashboard() {
  const [activeTab, setActiveTab] = useState('summary');
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWords: 0,
    totalMinutes: 0,
    avgWordsPerDay: 0,
    avgMinutesPerDay: 0,
    completedGoals: 0,
    streak: 0,
  });
  
  const supabase = useSupabaseClient();
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch writing sessions from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('writing_sessions')
        .select('*')
        .gte('session_date', thirtyDaysAgo.toISOString())
        .order('session_date', { ascending: false });
        
      if (sessionsError) console.error('Error fetching sessions:', sessionsError);
      else setSessions(sessionsData || []);
      
      // Fetch daily progress from the last 30 days
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
        
      if (progressError) console.error('Error fetching progress:', progressError);
      else setDailyProgress(progressData || []);
      
      // Fetch active goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('writing_goals')
        .select('*')
        .eq('is_completed', false)
        .order('created_at', { ascending: false });
        
      if (goalsError) console.error('Error fetching goals:', goalsError);
      else setGoals(goalsData || []);
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [supabase]);
  
  // Calculate stats whenever data changes
  useEffect(() => {
    if (dailyProgress.length === 0) {
      setStats({
        totalWords: 0,
        totalMinutes: 0,
        avgWordsPerDay: 0,
        avgMinutesPerDay: 0,
        completedGoals: 0,
        streak: 0,
      });
      return;
    }
    
    const totalWords = dailyProgress.reduce((sum, day) => sum + (day.total_word_count || 0), 0);
    const totalMinutes = dailyProgress.reduce((sum, day) => sum + (day.total_time_minutes || 0), 0);
    const completedGoals = dailyProgress.reduce((sum, day) => sum + (day.goals_completed || 0), 0);
    
    // Calculate streak (consecutive days with writing)
    let streak = 0;
    const sortedDays = [...dailyProgress].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (sortedDays.length > 0) {
      // Check if wrote today
      const today = new Date().toISOString().split('T')[0];
      const latestDate = new Date(sortedDays[0].date).toISOString().split('T')[0];
      
      if (today === latestDate) {
        streak = 1;
        
        // Check previous days
        let prevDate = new Date(latestDate);
        for (let i = 1; i < sortedDays.length; i++) {
          prevDate.setDate(prevDate.getDate() - 1);
          const expectedDate = prevDate.toISOString().split('T')[0];
          const actualDate = new Date(sortedDays[i].date).toISOString().split('T')[0];
          
          if (expectedDate === actualDate) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    setStats({
      totalWords,
      totalMinutes,
      avgWordsPerDay: Math.round(totalWords / dailyProgress.length),
      avgMinutesPerDay: Math.round(totalMinutes / dailyProgress.length),
      completedGoals,
      streak,
    });
  }, [dailyProgress]);
  
  const handleGoalCreated = (newGoal: WritingGoal) => {
    setGoals([newGoal, ...goals]);
    setShowNewGoal(false);
  };
  
  const handleSessionCreated = async (newSession: WritingSession) => {
    setSessions([newSession, ...sessions]);
    setShowNewSession(false);
    
    // Update or create daily progress entry
    const sessionDate = new Date(newSession.session_date).toISOString().split('T')[0];
    
    // Check if we already have a progress entry for this date
    const existingProgress = dailyProgress.find(
      p => new Date(p.date).toISOString().split('T')[0] === sessionDate
    );
    
    if (existingProgress) {
      // Update existing entry
      const updatedProgress = {
        ...existingProgress,
        total_word_count: (existingProgress.total_word_count || 0) + (newSession.words_added || 0),
        total_time_minutes: (existingProgress.total_time_minutes || 0) + (newSession.duration_minutes || 0),
        scenes_worked: existingProgress.scenes_worked + (newSession.scene_id ? 1 : 0),
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('daily_progress')
        .update(updatedProgress)
        .eq('id', existingProgress.id);
        
      if (error) console.error('Error updating daily progress:', error);
      else {
        // Update local state
        setDailyProgress(dailyProgress.map(p => 
          p.id === existingProgress.id ? updatedProgress : p
        ));
      }
    } else {
      // Create new entry
      const newProgress: Partial<DailyProgress> = {
        date: sessionDate,
        total_word_count: newSession.words_added || 0,
        total_time_minutes: newSession.duration_minutes || 0,
        scenes_worked: newSession.scene_id ? 1 : 0,
        goals_completed: 0,
      };
      
      const { data, error } = await supabase
        .from('daily_progress')
        .insert(newProgress)
        .select()
        .single();
        
      if (error) console.error('Error creating daily progress:', error);
      else if (data) {
        // Update local state
        setDailyProgress([data, ...dailyProgress]);
      }
    }
  };
  
  const handleGoalCompleted = async (goalId: string, completed: boolean) => {
    const { error } = await supabase
      .from('writing_goals')
      .update({ is_completed: completed })
      .eq('id', goalId);
      
    if (error) {
      console.error('Error updating goal status:', error);
    } else {
      // Update local state
      if (completed) {
        setGoals(goals.filter(g => g.id !== goalId));
        
        // Update daily progress to increment completed goals
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = dailyProgress.find(
          p => new Date(p.date).toISOString().split('T')[0] === today
        );
        
        if (todayProgress) {
          const updatedProgress = {
            ...todayProgress,
            goals_completed: (todayProgress.goals_completed || 0) + 1,
          };
          
          await supabase
            .from('daily_progress')
            .update(updatedProgress)
            .eq('id', todayProgress.id);
            
          setDailyProgress(dailyProgress.map(p => 
            p.id === todayProgress.id ? updatedProgress : p
          ));
        }
      } else {
        // Refresh goals list if a goal is uncompleted
        const { data } = await supabase
          .from('writing_goals')
          .select('*')
          .eq('is_completed', false)
          .order('created_at', { ascending: false });
          
        if (data) setGoals(data);
      }
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Writing Dashboard</h1>
        <div className="space-x-2">
          <Button 
            onClick={() => setShowNewSession(true)}
            disabled={showNewSession}
          >
            Record Session
          </Button>
          <Button 
            onClick={() => setShowNewGoal(true)} 
            variant="outline"
            disabled={showNewGoal}
          >
            Set New Goal
          </Button>
        </div>
      </div>
      
      {showNewSession && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Record Writing Session</CardTitle>
          </CardHeader>
          <CardContent>
            <NewSessionForm 
              onSessionCreated={handleSessionCreated}
              onCancel={() => setShowNewSession(false)}
            />
          </CardContent>
        </Card>
      )}
      
      {showNewGoal && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Set New Writing Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <NewGoalForm 
              onGoalCreated={handleGoalCreated}
              onCancel={() => setShowNewGoal(false)}
            />
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgWordsPerDay.toLocaleString()} per day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Writing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMinutes.toLocaleString()} mins</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgMinutesPerDay.toLocaleString()} mins per day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground">
              {stats.streak > 0 ? "Keep it going!" : "Start writing today!"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              {goals.length} active goals
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Writing Progress</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <DailyProgressChart data={dailyProgress} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals">
          <GoalTracker goals={goals} onGoalCompleted={handleGoalCompleted} />
        </TabsContent>
        
        <TabsContent value="history">
          <SessionHistory sessions={sessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
