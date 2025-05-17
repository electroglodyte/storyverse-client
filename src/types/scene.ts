export interface Scene {
  id: string;
  title: string;
  description: string | null;
  content: string;
  sequence_number: number;
  scene_type: 'scene' | 'chapter' | 'beat';
  status: 'idea' | 'draft' | 'revised' | 'polished' | 'finished';
  essence: string | null;
  interest_factor: string | null;
  story_id: string;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SceneVersion {
  id: string;
  scene_id: string;
  content: string;
  version_number: number;
  created_at: string;
  notes: string | null;
}

export interface SceneCharacter {
  id: string;
  scene_id: string;
  character_id: string;
  importance: number;
  want: string | null;
  why: string | null;
  obstacle: string | null;
  action: string | null;
  result: string | null;
}

export interface SceneComment {
  id: string;
  scene_id: string;
  content: string;
  created_at: string;
  user_id: string;
  resolved: boolean;
}