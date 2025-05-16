// Generated types for Supabase tables

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  Tables: {
    story_worlds: {
      id: string;
      name: string;
      description?: string;
      genre?: string[];
      tags?: string[];
      time_period?: string;
      rules?: string;
      image_url?: string;
      notes?: string;
      attributes?: Json;
      created_at: string;
      updated_at: string;
      user_id?: string;
    };
    series: {
      id: string;
      name: string;
      description?: string;
      story_world_id?: string;
      tags?: string[];
      status?: 'planned' | 'in-progress' | 'completed' | 'on-hold';
      target_length?: number;
      sequence_type?: string;
      image_url?: string;
      notes?: string;
      attributes?: Json;
      created_at: string;
      updated_at: string;
      user_id?: string;
    };
    stories: {
      id: string;
      title: string;
      description?: string;
      story_world_id?: string;
      series_id?: string;
      series_order?: number;
      status?: string;
      story_type?: 'novel' | 'short_story' | 'screenplay' | 'episode' | 'other';
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
      updated_at: string;
      user_id?: string;
    };
    scenes: {
      id: string;
      title: string;
      description?: string;
      content?: string;
      event_id?: string;
      story_id?: string;  
      sequence_number?: number;
      is_visible?: boolean;
      type: 'beat' | 'outline' | 'scene' | 'chapter' | 'outline_element' | 'summary';
      status: 'idea' | 'draft' | 'revised' | 'polished' | 'finished';
      format?: 'plain' | 'fountain' | 'markdown';
      metadata?: Json;
      essence?: string;
      interest?: string;
      creation_notes?: string;
      character_5q?: Json;
      subtext?: string;
      created_at: string;
      updated_at: string;
    };
    scene_versions: {
      id: string;
      scene_id: string;
      content: string;
      version_number: number;
      created_at: string;
      created_by?: string;
      notes?: string;
    };
    scene_comments: {
      id: string;
      scene_id: string;
      content: string;
      created_at: string;
      created_by?: string;
      resolved?: boolean;
      position?: Json;
      type?: 'revision' | 'suggestion' | 'question' | 'comment';
    };
    plotlines: {
      id: string;
      title: string;
      description?: string;
      story_id: string;
      plotline_type?: 'main' | 'subplot' | 'character' | 'thematic' | 'other';
      starting_event_id?: string;
      climax_event_id?: string;
      resolution_event_id?: string;
      theme?: string;
      notes?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export type Tables = Database['Tables']
export type TableName = keyof Database['Tables']