import { Database } from './database';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Utility types for common patterns
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Extract all tables into a single type
export type TableNames = keyof Database['public']['Tables'];

// Define the basic schema structure
export interface Database {
  public: {
    Tables: {
      writing_samples: {
        Row: {
          id: string;
          title: string;
          content: string;
          author?: string;
          sample_type?: string;
          description?: string;
          excerpt?: string;
          tags?: string[];
          word_count?: number;
          created_at: string;
          updated_at?: string;
          project_id?: string;
        };
      };
      style_profiles: {
        Row: {
          id: string;
          name: string;
          description?: string;
          style_parameters: Json;
          comparable_authors?: string[];
          genre?: string[];
          user_comments?: string;
          created_at: string;
          updated_at?: string;
          project_id?: string;
        };
      };
      // Add other table definitions as needed
    };
    Enums: {
      // Add enum definitions if you have any
    };
  };
}