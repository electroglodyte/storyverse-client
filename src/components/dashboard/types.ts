export interface WritingGoal {
  id: string;
  user_id?: string;
  story_id?: string;
  title: string;
  description?: string;
  goal_type: 'word_count' | 'scene_count' | 'time_spent' | 'custom';
  target_value: number;
  current_value?: number;
  time_period: 'daily' | 'weekly' | 'monthly' | 'project';
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WritingSession {
  id: string;
  user_id?: string;
  story_id?: string;
  scene_id?: string;
  session_date: string;
  duration_minutes: number;
  word_count: number;
  words_added: number;
  words_deleted: number;
  notes?: string;
  mood?: number; // 1-10 scale
  focus?: number; // 1-10 scale
  created_at: string;
  updated_at: string;
}

export interface DailyProgress {
  id: string;
  user_id?: string;
  date: string;
  total_word_count: number;
  total_time_minutes: number;
  scenes_worked: number;
  goals_completed: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
