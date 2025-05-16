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

export interface TableBase {
  id: string;
  created_at: string;
  updated_at?: string | null;
  user_id?: string | null;
}

export interface CharacterTable extends TableBase {
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
}

// Add other table interfaces as needed...