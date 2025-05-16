import { Tables, Json } from './supabase';

// Base interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Core entities
export interface Story extends BaseEntity {
  title: string;
  description?: string;
  story_world_id?: string;
  series_id?: string;
  status: string;
  genre?: string[];
  tags?: string[];
  attributes?: Json;
  story_type?: string;
  word_count_target?: number;
}

export interface StoryWorld extends BaseEntity {
  name: string;
  description?: string;
  genre?: string[];
  time_period?: string;
  rules?: string;
  image_url?: string;
  cover_image?: string;
  notes?: string;
}

export interface Series extends BaseEntity {
  name: string;
  description?: string;
  story_world_id?: string;
  sequence_type?: string;
  target_length?: number;
  status?: string;
  image_url?: string;
  notes?: string;
}

// Writing and Style entities
export interface WritingSample extends BaseEntity {
  title: string;
  content: string;
  author?: string;
  sample_type?: string;
  tags?: string[];
  excerpt?: string;
  word_count?: number;
  project_id?: string;
  text: string;
}

export interface StyleProfile extends BaseEntity {
  name: string;
  style_parameters: Json;
  description?: string;
  genre?: string[];
  comparable_authors?: string[];
  user_comments?: string;
  project_id?: string;
}

export interface StyleAnalysis extends BaseEntity {
  sample_id: string;
  narrative_characteristics: Json;
  stylistic_devices: Json;
  sentence_metrics: Json;
  vocabulary_metrics: Json;
  tone_attributes: Json;
  comparable_authors?: string[];
  descriptive_summary?: string;
}

// Scene and Timeline entities
export interface Scene extends BaseEntity {
  title: string;
  content?: string;
  type: string;
  description?: string;
  sequence_number?: number;
  story_id: string;
  event_id?: string;
  status: string;
}

export interface SceneVersion extends BaseEntity {
  scene_id: string;
  content: string;
  version_number: number;
  notes?: string;
}

export interface SceneComment extends BaseEntity {
  scene_id: string;
  content: string;
  resolved?: boolean;
  position?: Json;
  type?: string;
}

export interface TimelineElement extends BaseEntity {
  element_type: string;
  element_id: string;
  chronological_time?: string;
  relative_time_offset?: string;
  story_order?: number;
  description?: string;
  story_id: string;
}

export interface Storyline extends BaseEntity {
  title: string;
  description?: string;
  color: string;
  story_id: string;
}

// Export database types
export type { Tables, Json };