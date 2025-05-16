import { Json } from './database';

export interface Character {
  id: string;
  name: string;
  description?: string;
  background?: string;
  appearance?: string;
  personality?: string;
  motivation?: string;
  role?: string;
  age?: string;
  faction_id?: string;
  story_world_id?: string;
  story_id?: string;
  attributes?: Json;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  story_id?: string;
  location_type?: string;
  parent_location_id?: string;
  climate?: string;
  culture?: string;
  map_coordinates?: string;
  notable_features?: string;
  image_url?: string;
  notes?: string;
  attributes?: Json;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  story_id: string;
  sequence_number: number;
  chronological_time?: string;
  relative_time_offset?: string;
  visible?: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  story_world_id?: string;
  series_id?: string;
  series_order?: number;
  status?: string;
  story_type?: string;
  word_count?: number;
  word_count_target?: number;
  target_date?: string;
  synopsis?: string;
  image_url?: string;
  notes?: string;
  tags?: string[];
  genre?: string[];
  attributes?: Json;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface StoryWorld {
  id: string;
  name: string;
  description?: string;
  genre?: string[];
  tags?: string[];
  time_period?: string;
  rules?: string;
  image_url?: string;
  cover_image?: string;
  notes?: string;
  attributes?: Json;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface Series {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  tags?: string[];
  status?: string;
  target_length?: number;
  sequence_type?: string;
  image_url?: string;
  notes?: string;
  attributes?: Json;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface Scene {
  id: string;
  title: string;
  description?: string;
  content?: string;
  event_id?: string;
  story_id?: string;
  sequence_number?: number;
  type: string;
  status: string;
  format?: string;
  metadata?: Json;
  essence?: string;
  interest?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface SceneVersion {
  id: string;
  scene_id: string;
  content: string;
  version_number: number;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface SceneComment {
  id: string;
  scene_id: string;
  content: string;
  created_by?: string;
  resolved?: boolean;
  position?: Json;
  type?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface WritingSample {
  id: string;
  title: string;
  text?: string;
  content: string;
  excerpt?: string;
  author?: string;
  sample_type?: string;
  project_id?: string;
  tags?: string[];
  word_count?: number;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  style_parameters: Json;
  project_id?: string;
  genre?: string[];
  comparable_authors?: string[];
  user_comments?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}

export interface StyleAnalysis {
  id: string;
  sample_id: string;
  sentence_metrics?: Json;
  vocabulary_metrics?: Json;
  narrative_characteristics?: Json;
  stylistic_devices?: Json;
  tone_attributes?: Json;
  descriptive_summary?: string;
  comparable_authors?: string[];
  created_at: string;
  updated_at?: string;
  user_id?: string;
}