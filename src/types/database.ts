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

interface TableBase {
  id: string;
  created_at: string;
  updated_at?: string | null;
  user_id?: string | null;
}

interface StoryWorldTable extends TableBase {
  Row: {
    name: string;
    description: string;
    genre?: string[] | null;
    tags?: string[] | null;
    time_period?: string | null;
    rules?: string | null;
    image_url?: string | null;
    cover_image?: string | null;
    notes?: string | null;
    attributes?: Json | null;
  };
  Insert: StoryWorldTable['Row'];
  Update: Partial<StoryWorldTable['Row']>;
}

interface StoryTable extends TableBase {
  Row: {
    title: string;
    name?: string;
    description: string;
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
  };
  Insert: StoryTable['Row'];
  Update: Partial<StoryTable['Row']>;
}

// Export types with Row, Insert, Update
export type StoryWorld = StoryWorldTable['Row'];
export type Story = StoryTable['Row'];
export type Character = CharacterTable['Row']; 
export type Event = EventTable['Row'];
export type Faction = FactionTable['Row'];
export type Location = LocationTable['Row'];
export type Scene = SceneTable['Row'];
export type Series = SeriesTable['Row'];
export type StyleProfile = StyleProfileTable['Row'];
export type WritingSample = WritingSampleTable['Row'];
export type SceneVersion = SceneVersionTable['Row'];
export type StyleAnalysis = StyleAnalysisTable['Row'];