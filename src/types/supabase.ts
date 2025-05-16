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
      story_worlds: {
        Row: {
          id: string
          name: string
          description?: string
          image_url?: string
          genre?: string[]
          time_period?: string
          rules?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
          cover_image?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          name?: string
          description?: string
          story_world_id?: string
          storyworld_id?: string
          series_id?: string
          tags?: string[]
          genre?: string[]
          status?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
          word_count_target?: number
        }
      }
      series: {
        Row: {
          id: string
          name: string
          description?: string
          status?: string
          sequence_type?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
          story_world_id?: string
        }
      }
      scenes: {
        Row: {
          id: string
          title: string
          content: string
          description?: string
          sequence_number?: number
          story_id?: string
          type?: string
          status?: string
          format?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      scene_comments: {
        Row: {
          id: string
          scene_id: string
          content: string
          type?: string
          position?: Json
          resolved?: boolean
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      scene_versions: {
        Row: {
          id: string
          scene_id: string
          content: string
          version_number: number
          notes?: string
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      characters: {
        Row: {
          id: string
          name: string
          description?: string
          appearance?: string
          background?: string
          motivation?: string
          personality?: string
          role?: string
          age?: string
          faction_id?: string
          location_id?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description?: string
          location_type?: string
          parent_location_id?: string
          climate?: string
          culture?: string
          map_coordinates?: string
          notable_features?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      factions: {
        Row: {
          id: string
          name: string
          description?: string
          faction_type?: string
          leader_character_id?: string
          headquarters_location_id?: string
          ideology?: string
          goals?: string
          resources?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description?: string
          item_type?: string
          owner_character_id?: string
          location_id?: string
          properties?: string
          significance?: string
          image_url?: string
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description?: string
          chronological_time?: string
          relative_time_offset?: string
          sequence_number?: number
          story_id?: string
          visible?: boolean
          notes?: string
          attributes?: Json
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      writing_samples: {
        Row: {
          id: string
          title: string
          content: string
          excerpt?: string
          author?: string
          project_id?: string
          sample_type?: string
          tags?: string[]
          word_count?: number
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      style_profiles: {
        Row: {
          id: string
          name: string
          description?: string
          style_parameters: Json
          comparable_authors?: string[]
          genre?: string[]
          project_id?: string
          user_comments?: string
          created_at: string
          updated_at?: string
          user_id?: string
        }
      }
      style_analyses: {
        Row: {
          id: string
          sample_id: string
          descriptive_summary?: string
          comparable_authors?: string[]
          narrative_characteristics: Json
          sentence_metrics: Json
          vocabulary_metrics: Json
          stylistic_devices: Json
          tone_attributes: Json
          created_at: string
          updated_at?: string
        }
      }
    }
  }
}