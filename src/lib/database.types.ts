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
      character_arcs: {
        Row: {
          challenges: string[] | null
          character_id: string
          catalyst: string | null
          created_at: string
          description: string | null
          ending_state: string | null
          id: string
          key_events: string[] | null
          notes: string | null
          starting_state: string | null
          story_id: string
          theme: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          challenges?: string[] | null
          character_id: string
          catalyst?: string | null
          created_at?: string
          description?: string | null
          ending_state?: string | null
          id?: string
          key_events?: string[] | null
          notes?: string | null
          starting_state?: string | null
          story_id: string
          theme?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          challenges?: string[] | null
          character_id?: string
          catalyst?: string | null
          created_at?: string
          description?: string | null
          ending_state?: string | null
          id?: string
          key_events?: string[] | null
          notes?: string | null
          starting_state?: string | null
          story_id?: string
          theme?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_arcs_character_id_fkey"
            columns: ["character_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_arcs_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          }
        ]
      }
      character_events: {
        Row: {
          character_id: string
          character_sequence_number: number
          created_at: string
          event_id: string
          experience_type: string | null
          id: string
          importance: number
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          character_id: string
          character_sequence_number?: number
          created_at?: string
          event_id: string
          experience_type?: string | null
          id?: string
          importance?: number
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          character_sequence_number?: number
          created_at?: string
          event_id?: string
          experience_type?: string | null
          id?: string
          importance?: number
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_events_character_id_fkey"
            columns: ["character_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_events_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      character_relationships: {
        Row: {
          character1_id: string
          character2_id: string
          created_at: string
          description: string | null
          id: string
          intensity: number | null
          notes: string | null
          relationship_type: string
          story_id: string | null
          updated_at: string | null
        }
        Insert: {
          character1_id: string
          character2_id: string
          created_at?: string
          description?: string | null
          id?: string
          intensity?: number | null
          notes?: string | null
          relationship_type: string
          story_id?: string | null
          updated_at?: string | null
        }
        Update: {
          character1_id?: string
          character2_id?: string
          created_at?: string
          description?: string | null
          id?: string
          intensity?: number | null
          notes?: string | null
          relationship_type?: string
          story_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_relationships_character1_id_fkey"
            columns: ["character1_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_character2_id_fkey"
            columns: ["character2_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          }
        ]
      }
      characters: {
        Row: {
          age: string | null
          appearance: string | null
          attributes: Json | null
          background: string | null
          created_at: string
          description: string | null
          faction_id: string | null
          id: string
          image_url: string | null
          location_id: string | null
          motivation: string | null
          name: string
          notes: string | null
          personality: string | null
          role: string | null
          story_id: string | null
          story_world_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: string | null
          appearance?: string | null
          attributes?: Json | null
          background?: string | null
          created_at?: string
          description?: string | null
          faction_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          motivation?: string | null
          name: string
          notes?: string | null
          personality?: string | null
          role?: string | null
          story_id?: string | null
          story_world_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: string | null
          appearance?: string | null
          attributes?: Json | null
          background?: string | null
          created_at?: string
          description?: string | null
          faction_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          motivation?: string | null
          name?: string
          notes?: string | null
          personality?: string | null
          role?: string | null
          story_id?: string | null
          story_world_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_faction_id_fkey"
            columns: ["faction_id"]
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          id: string
          notes: string | null
          predecessor_event_id: string
          strength: number
          successor_event_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          dependency_type: string
          id?: string
          notes?: string | null
          predecessor_event_id: string
          strength?: number
          successor_event_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          dependency_type?: string
          id?: string
          notes?: string | null
          predecessor_event_id?: string
          strength?: number
          successor_event_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_dependencies_predecessor_event_id_fkey"
            columns: ["predecessor_event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dependencies_successor_event_id_fkey"
            columns: ["successor_event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          chronological_time: string | null
          created_at: string
          description: string | null
          id: string
          relative_time_offset: string | null
          sequence_number: number
          story_id: string
          time_reference_point: string | null
          title: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          chronological_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          relative_time_offset?: string | null
          sequence_number?: number
          story_id: string
          time_reference_point?: string | null
          title: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          chronological_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          relative_time_offset?: string | null
          sequence_number?: number
          story_id?: string
          time_reference_point?: string | null
          title?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          }
        ]
      }
      factions: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string | null
          faction_type: string | null
          goals: string | null
          headquarters_location_id: string | null
          id: string
          ideology: string | null
          image_url: string | null
          leader_character_id: string | null
          name: string
          notes: string | null
          resources: string | null
          story_id: string | null
          story_world_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          faction_type?: string | null
          goals?: string | null
          headquarters_location_id?: string | null
          id?: string
          ideology?: string | null
          image_url?: string | null
          leader_character_id?: string | null
          name: string
          notes?: string | null
          resources?: string | null
          story_id?: string | null
          story_world_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          faction_type?: string | null
          goals?: string | null
          headquarters_location_id?: string | null
          id?: string
          ideology?: string | null
          image_url?: string | null
          leader_character_id?: string | null
          name?: string
          notes?: string | null
          resources?: string | null
          story_id?: string | null
          story_world_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factions_headquarters_location_id_fkey"
            columns: ["headquarters_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factions_leader_character_id_fkey"
            columns: ["leader_character_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factions_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factions_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      items: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          item_type: string | null
          location_id: string | null
          name: string
          notes: string | null
          owner_character_id: string | null
          properties: string | null
          significance: string | null
          story_id: string | null
          story_world_id: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          location_id?: string | null
          name: string
          notes?: string | null
          owner_character_id?: string | null
          properties?: string | null
          significance?: string | null
          story_id?: string | null
          story_world_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          location_id?: string | null
          name?: string
          notes?: string | null
          owner_character_id?: string | null
          properties?: string | null
          significance?: string | null
          story_id?: string | null
          story_world_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_owner_character_id_fkey"
            columns: ["owner_character_id"]
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          attributes: Json | null
          climate: string | null
          created_at: string
          culture: string | null
          description: string | null
          id: string
          image_url: string | null
          location_type: string | null
          map_coordinates: string | null
          name: string
          notable_features: string | null
          notes: string | null
          parent_location_id: string | null
          story_id: string | null
          story_world_id: string | null
          time_period: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          climate?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_type?: string | null
          map_coordinates?: string | null
          name: string
          notable_features?: string | null
          notes?: string | null
          parent_location_id?: string | null
          story_id?: string | null
          story_world_id?: string | null
          time_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          climate?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_type?: string | null
          map_coordinates?: string | null
          name?: string
          notable_features?: string | null
          notes?: string | null
          parent_location_id?: string | null
          story_id?: string | null
          story_world_id?: string | null
          time_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_story_id_fkey"
            columns: ["story_id"]
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_samples: {
        Row: {
          created_at: string
          profile_id: string
          sample_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          profile_id: string
          sample_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          profile_id?: string
          sample_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_samples_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "style_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_samples_sample_id_fkey"
            columns: ["sample_id"]
            referencedRelation: "writing_samples"
            referencedColumns: ["id"]
          }
        ]
      }
      representative_samples: {
        Row: {
          created_at: string
          description: string | null
          id: string
          profile_id: string
          text_content: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          text_content: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "representative_samples_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "style_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      series: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          sequence_type: string | null
          status: string | null
          story_world_id: string | null
          tags: string[] | null
          target_length: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          sequence_type?: string | null
          status?: string | null
          story_world_id?: string | null
          tags?: string[] | null
          target_length?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          sequence_type?: string | null
          status?: string | null
          story_world_id?: string | null
          tags?: string[] | null
          target_length?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stories: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string | null
          genre: string[] | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          series_id: string | null
          series_order: number | null
          status: string | null
          story_type: string | null
          story_world_id: string | null
          synopsis: string | null
          tags: string[] | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          word_count: number | null
          word_count_target: number | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          series_id?: string | null
          series_order?: number | null
          status?: string | null
          story_type?: string | null
          story_world_id?: string | null
          synopsis?: string | null
          tags?: string[] | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
          word_count_target?: number | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          series_id?: string | null
          series_order?: number | null
          status?: string | null
          story_type?: string | null
          story_world_id?: string | null
          synopsis?: string | null
          tags?: string[] | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
          word_count_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_story_world_id_fkey"
            columns: ["story_world_id"]
            referencedRelation: "story_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      story_worlds: {
        Row: {
          attributes: Json | null
          cover_image: string | null
          created_at: string
          description: string | null
          genre: string[] | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          rules: string | null
          tags: string[] | null
          time_period: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          rules?: string | null
          tags?: string[] | null
          time_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          rules?: string | null
          tags?: string[] | null
          time_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_worlds_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      style_analyses: {
        Row: {
          comparable_authors: string[] | null
          created_at: string
          descriptive_summary: string | null
          id: string
          narrative_characteristics: Json | null
          sample_id: string
          sentence_metrics: Json | null
          stylistic_devices: Json | null
          tone_attributes: Json | null
          updated_at: string | null
          vocabulary_metrics: Json | null
        }
        Insert: {
          comparable_authors?: string[] | null
          created_at?: string
          descriptive_summary?: string | null
          id?: string
          narrative_characteristics?: Json | null
          sample_id: string
          sentence_metrics?: Json | null
          stylistic_devices?: Json | null
          tone_attributes?: Json | null
          updated_at?: string | null
          vocabulary_metrics?: Json | null
        }
        Update: {
          comparable_authors?: string[] | null
          created_at?: string
          descriptive_summary?: string | null
          id?: string
          narrative_characteristics?: Json | null
          sample_id?: string
          sentence_metrics?: Json | null
          stylistic_devices?: Json | null
          tone_attributes?: Json | null
          updated_at?: string | null
          vocabulary_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "style_analyses_sample_id_fkey"
            columns: ["sample_id"]
            referencedRelation: "writing_samples"
            referencedColumns: ["id"]
          }
        ]
      }
      style_profiles: {
        Row: {
          comparable_authors: string[] | null
          created_at: string
          description: string | null
          genre: string[] | null
          id: string
          name: string
          project_id: string | null
          style_parameters: Json
          updated_at: string | null
          user_comments: string | null
          user_id: string | null
        }
        Insert: {
          comparable_authors?: string[] | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          name: string
          project_id?: string | null
          style_parameters: Json
          updated_at?: string | null
          user_comments?: string | null
          user_id?: string | null
        }
        Update: {
          comparable_authors?: string[] | null
          created_at?: string
          description?: string | null
          genre?: string[] | null
          id?: string
          name?: string
          project_id?: string | null
          style_parameters?: Json
          updated_at?: string | null
          user_comments?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      writing_samples: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          project_id: string | null
          sample_type: string | null
          tags: string[] | null
          text: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          project_id?: string | null
          sample_type?: string | null
          tags?: string[] | null
          text?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          project_id?: string | null
          sample_type?: string | null
          tags?: string[] | null
          text?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "writing_samples_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}