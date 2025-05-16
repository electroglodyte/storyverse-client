export interface Database {
  public: {
    Tables: {
      characters: CharacterTable;
      stories: StoryTable;
      events: EventTable;
      factions: FactionTable;
      locations: LocationTable;
      story_worlds: StoryWorldTable;
      style_profiles: StyleProfileTable;
      writing_samples: WritingSampleTable;
      series: SeriesTable;
      character_arcs: CharacterArcTable;
      character_events: CharacterEventTable;
      character_relationships: CharacterRelationshipTable;
      scenes: SceneTable;
      scene_versions: SceneVersionTable;
      scene_comments: SceneCommentTable;
      style_analyses: StyleAnalysisTable;
      faction_characters: FactionCharacterTable;
      storylines: StorylineTable;
      timeline_elements: TimelineElementTable;
      structural_elements: StructuralElementTable;
      storyline_elements: StorylineElementTable;
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface TableBase {
  id: string;
  created_at: string;
  updated_at?: string | null;
  user_id?: string | null;
}

export interface StoryWorldTable extends TableBase {
  name: string;
  description?: string | null;
  genre?: string[] | null;
  tags?: string[] | null;
  time_period?: string | null;
  rules?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  notes?: string | null;
  attributes?: Json | null;
}

export interface StoryTable extends TableBase {
  title: string; 
  name?: string;
  description?: string | null;
  story_world_id?: string | null;
  series_id?: string | null;
  series_order?: number | null;
  status?: string | null;
  story_type?: string | null;
  word_count?: number | null;
  word_count_target?: number | null;
  target_date?: string | null;
  synopsis?: string | null;
  image_url?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  genre?: string[] | null;
  attributes?: Json | null;
}

export interface CharacterTable extends TableBase {
  name: string;
  description?: string | null;
  background?: string | null;
  appearance?: string | null;
  personality?: string | null;
  motivation?: string | null;
  role?: string | null;
  age?: string | null;
  faction_id?: string | null;
  story_world_id?: string | null;
  story_id?: string | null;
  attributes?: Json | null;
  image_url?: string | null;
}

export interface LocationTable extends TableBase {
  name: string;
  description?: string | null;
  story_world_id?: string | null;
  story_id?: string | null;
  location_type?: string | null;
  parent_location_id?: string | null;
  climate?: string | null;
  culture?: string | null;
  map_coordinates?: string | null;
  notable_features?: string | null;
  image_url?: string | null;
  notes?: string | null;
  attributes?: Json | null;
}

export interface FactionTable extends TableBase {
  name: string;
  description?: string | null;
  story_world_id?: string | null;
  story_id?: string | null;
  faction_type?: string | null;
  leader_character_id?: string | null;
  headquarters_location_id?: string | null;
  ideology?: string | null;
  goals?: string | null;
  resources?: string | null;
  image_url?: string | null;
  notes?: string | null;
  attributes?: Json | null;
}

export interface EventTable extends TableBase {
  title: string;
  description?: string | null;
  story_id: string;
  sequence_number: number;
  chronological_time?: string | null;
  relative_time_offset?: string | null;
  visible?: boolean | null;
}

export interface CharacterEventTable extends TableBase {
  character_id: string;
  event_id: string;
  importance: number;
  character_sequence_number: number;
  experience_type?: string | null;
  notes?: string | null;
}

export interface CharacterArcTable extends TableBase {
  character_id: string;
  story_id: string;
  title: string;
  description?: string | null;
  starting_state?: string | null;
  ending_state?: string | null;
  catalyst?: string | null;
  challenges?: string[] | null;
  key_events?: string[] | null;
  theme?: string | null;
  notes?: string | null;
}

export interface CharacterRelationshipTable extends TableBase {
  character1_id: string;
  character2_id: string;
  relationship_type: string;
  description?: string | null;
  intensity?: number | null;
  story_id?: string | null;
  notes?: string | null;
}

export interface SceneTable extends TableBase {
  title: string;
  description?: string | null;
  content?: string | null;
  event_id?: string | null;
  story_id?: string | null;
  sequence_number?: number | null;
  type: string;
  status: string;
  format?: string | null;
  metadata?: Json | null;
  essence?: string | null;
  interest?: string | null;
  notes?: string | null;
}

export interface SceneVersionTable extends TableBase {
  scene_id: string;
  content: string;
  version_number: number;
  created_by?: string | null;
  notes?: string | null;
}

export interface SceneCommentTable extends TableBase {
  scene_id: string;
  content: string;
  created_by?: string | null;
  resolved?: boolean | null;
  position?: Json | null;
  type?: string | null;
}

export interface StyleProfileTable extends TableBase {
  name: string;
  description?: string | null;
  style_parameters: Json;
  project_id?: string | null;
  genre?: string[] | null;
  comparable_authors?: string[] | null;
  user_comments?: string | null;
}

export interface WritingSampleTable extends TableBase {
  title: string;
  text?: string | null;
  content?: string | null;
  excerpt?: string | null;
  author?: string | null;
  sample_type?: string | null;
  project_id?: string | null;
  tags?: string[] | null;
  word_count?: number | null;
}

export interface StyleAnalysisTable extends TableBase {
  sample_id: string;
  sentence_metrics?: Json | null;
  vocabulary_metrics?: Json | null;
  narrative_characteristics?: Json | null;
  stylistic_devices?: Json | null;
  tone_attributes?: Json | null;
  descriptive_summary?: string | null;
  comparable_authors?: string[] | null;
}

export interface SeriesTable extends TableBase {
  name: string;
  description?: string | null;
  story_world_id?: string | null;
  tags?: string[] | null;
  status?: string | null;
  target_length?: number | null;
  sequence_type?: string | null;
  image_url?: string | null;
  notes?: string | null;
  attributes?: Json | null;
}

export interface FactionCharacterTable extends TableBase {
  faction_id: string;
  character_id: string;
  role: string;
}

export interface StorylineTable extends TableBase {
  title: string;
  description: string;
  color: string;
  story_id: string;
}

export interface TimelineElementTable extends TableBase {
  element_type: string;
  element_id: string;
  chronological_time: string;
  relative_time_offset: string;
  time_reference_point: string;
  story_order: number;
  story_id: string;
}

export interface StructuralElementTable extends TableBase {
  title: string;
  description: string;
  type: string;
  story_id: string;
}

export interface StorylineElementTable extends TableBase {
  storyline_id: string;
  element_type: string;
  element_id: string;
}