export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      characters: CharacterTable
      events: EventTable
      factions: FactionTable
      locations: LocationTable
      scenes: SceneTable
      series: SeriesTable
      style_profiles: StyleProfileTable
      writing_samples: WritingSampleTable
      scene_versions: SceneVersionTable
      scene_comments: SceneCommentTable
      style_analyses: StyleAnalysisTable
      character_arcs: CharacterArcTable
      character_events: CharacterEventTable
      character_relationships: CharacterRelationshipTable
      faction_characters: FactionCharacterTable
      storylines: StorylineTable
      timeline_elements: TimelineElementTable
      structural_elements: StructuralElementTable
      storyline_elements: StorylineElementTable
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface TableBase {
  id: string
  created_at: string
  updated_at?: string | null
  user_id?: string | null
}

export interface CharacterTable extends TableBase {
  name: string
  description?: string
  age?: string | null
  appearance?: string | null
  background?: string | null
  attributes: Json
  faction_id?: string | null
  story_world_id?: string | null
}

export interface EventTable extends TableBase {
  title: string
  description?: string
  chronological_time?: string | null
  relative_time_offset?: string | null
  story_world_id?: string | null
}

export interface FactionTable extends TableBase {
  name: string
  description?: string
  faction_type?: string | null
  goals?: string | null
  ideology?: string | null
  headquarters_location_id?: string | null
  story_world_id?: string | null
  attributes: Json
}

export interface LocationTable extends TableBase {
  name: string
  description?: string
  location_type?: string | null
  climate?: string | null
  culture?: string | null
  story_world_id?: string | null
  attributes: Json
}

export interface SceneTable extends TableBase {
  title: string
  content: string
  type: string
  status: string
  story_id?: string | null
}

export interface SeriesTable extends TableBase {
  name: string
  description?: string
  sequence_type?: string | null
  status?: string | null
  story_world_id?: string | null
  attributes: Json
}

export interface StyleProfileTable extends TableBase {
  name: string
  description?: string
  genre?: string[] | null
  style_parameters: Json
  comparable_authors?: string[] | null
  project_id?: string | null
  user_comments?: string | null
}

export interface WritingSampleTable extends TableBase {
  title: string
  content: string
  author?: string | null
  sample_type?: string | null
  excerpt?: string | null
  tags?: string[] | null
  project_id?: string | null
  word_count?: number | null
}

export interface SceneVersionTable extends TableBase {
  scene_id: string
  content: string
  version_number: number
}

export interface SceneCommentTable extends TableBase {
  scene_id: string
  content: string
  resolved?: boolean
}

export interface StyleAnalysisTable extends TableBase {
  sample_id: string
  descriptive_summary?: string | null
  comparable_authors?: string[] | null
  narrative_characteristics: Json
  sentence_metrics: Json
  stylistic_devices: Json
  tone_attributes: Json
  vocabulary_metrics: Json
}

export interface CharacterArcTable extends TableBase {
  character_id: string
  catalyst?: string | null
  challenges?: string[] | null
  description?: string | null
  ending_state?: string | null
  key_events?: string[] | null
  resolution?: string | null
  starting_state?: string | null
}

export interface CharacterEventTable extends TableBase {
  character_id: string
  event_id: string
  experience_type?: string | null
  importance: number
  notes?: string | null
}

export interface CharacterRelationshipTable extends TableBase {
  character_id: string
  related_character_id: string
  relationship_type: string
  dynamics?: string | null
  notes?: string | null
}

export interface FactionCharacterTable extends TableBase {
  faction_id: string
  character_id: string
  role: string
}

export interface StorylineTable extends TableBase {
  title: string
  description?: string
  color?: string
  story_id: string
}

export interface TimelineElementTable extends TableBase {
  element_type: string
  element_id: string
  chronological_time?: string | null
  relative_time_offset?: string | null
  story_order?: number | null
  description?: string | null
}

export interface StructuralElementTable extends TableBase {
  title: string
  element_type: string
  content: string
  sequence_number: number
  story_id: string
}

export interface StorylineElementTable extends TableBase {
  storyline_id: string
  element_id: string
  element_type: string
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Export table types with proper naming
export type Character = Tables<'characters'>
export type Event = Tables<'events'>
export type Faction = Tables<'factions'>
export type Location = Tables<'locations'>
export type Scene = Tables<'scenes'>
export type Series = Tables<'series'>
export type StyleProfile = Tables<'style_profiles'>
export type WritingSample = Tables<'writing_samples'>
export type SceneVersion = Tables<'scene_versions'>
export type SceneComment = Tables<'scene_comments'>
export type StyleAnalysis = Tables<'style_analyses'>
export type CharacterArc = Tables<'character_arcs'>
export type CharacterEvent = Tables<'character_events'>
export type CharacterRelationship = Tables<'character_relationships'>
export type FactionCharacter = Tables<'faction_characters'>
export type Storyline = Tables<'storylines'>
export type TimelineElement = Tables<'timeline_elements'>
export type StructuralElement = Tables<'structural_elements'>
export type StorylineElement = Tables<'storyline_elements'>