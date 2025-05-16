import { Json } from './supabase'
import { TableBase } from './database'

export interface Scene extends TableBase {
  title: string;
  content: string;
  type: 'scene' | 'chapter' | 'act' | 'part';
  status: 'draft' | 'review' | 'final';
  sequence_number?: number;
  event_id?: string;
  story_id: string;
  description?: string;
  scene_essence?: string;
  interest_factor?: string;
  attributes?: Json;
}

export interface SceneVersion extends TableBase {
  scene_id: string;
  content: string;
  version_number: number;
  notes?: string;
}

export interface SceneComment extends TableBase {
  scene_id: string;
  content: string;
  type?: 'comment' | 'suggestion' | 'revision';
  resolved?: boolean;
  position?: {
    start: number;
    end: number;
  };
}

export interface Storyline extends TableBase {
  title: string;
  description?: string;
  color?: string;
  story_id: string;
  attributes?: Json;
}

export interface TimelineElement extends TableBase {
  element_type: 'event' | 'scene' | 'structural';
  element_id: string;
  sequence_number: number;
  chronological_time?: string;
  relative_time_offset?: string;
  story_id: string;
}

export interface StructuralElement extends TableBase {
  title: string;
  description?: string;
  element_type: 'act' | 'part' | 'chapter' | 'section';
  story_id: string;
}

export interface StorylineElement extends TableBase {
  storyline_id: string;
  element_id: string;
  element_type: 'event' | 'scene' | 'structural';
  sequence_number: number;
}