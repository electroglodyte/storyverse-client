// Generated types for Supabase tables with strict enums

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type StoryType = 'novel' | 'short_story' | 'screenplay' | 'episode' | 'other'
export type StoryStatus = 'concept' | 'outline' | 'draft' | 'revision' | 'completed'
export type SeriesStatus = 'planned' | 'in-progress' | 'completed' | 'on-hold'
export type SceneType = 'beat' | 'outline' | 'scene' | 'chapter' | 'outline_element' | 'summary' 
export type SceneStatus = 'idea' | 'draft' | 'revised' | 'polished' | 'finished'
export type SceneFormat = 'plain' | 'fountain' | 'markdown'
export type CommentType = 'revision' | 'suggestion' | 'question' | 'comment'
export type PlotlineType = 'main' | 'subplot' | 'character' | 'thematic' | 'other'

export interface Database {
  Tables: {
    story_worlds: {
      Row: {
        id: string
        name: string
        description?: string
        genre?: string[]
        tags?: string[]
        time_period?: string
        rules?: string
        image_url?: string
        notes?: string
        attributes?: Json
        created_at: string
        updated_at: string
        user_id?: string
      }
      Insert: Omit<Database['Tables']['story_worlds']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['Tables']['story_worlds']['Insert']>
    }
    series: {
      Row: {
        id: string
        name: string
        description?: string
        story_world_id?: string
        tags?: string[]
        status?: SeriesStatus
        target_length?: number
        sequence_type?: string
        image_url?: string
        notes?: string
        attributes?: Json
        created_at: string
        updated_at: string
        user_id?: string
      }
      Insert: Omit<Database['Tables']['series']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['Tables']['series']['Insert']>
    }
    stories: {
      Row: {
        id: string
        title: string
        description?: string
        story_world_id?: string
        series_id?: string
        series_order?: number
        status?: StoryStatus
        story_type?: StoryType
        word_count?: number
        word_count_target?: number
        target_date?: string
        synopsis?: string
        image_url?: string
        notes?: string
        tags?: string[]
        genre?: string[]
        attributes?: Json
        created_at: string
        updated_at: string
        user_id?: string
      }
      Insert: Omit<Database['Tables']['stories']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['Tables']['stories']['Insert']>
    }
    scenes: {
      Row: {
        id: string
        title: string
        description?: string
        content?: string
        event_id?: string
        story_id?: string
        sequence_number?: number
        is_visible?: boolean
        type: SceneType
        status: SceneStatus
        format?: SceneFormat
        metadata?: Json
        essence?: string
        interest?: string
        creation_notes?: string
        character_5q?: Json
        subtext?: string
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['Tables']['scenes']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['Tables']['scenes']['Insert']>
    }
    scene_versions: {
      Row: {
        id: string
        scene_id: string
        content: string
        version_number: number
        created_at: string
        created_by?: string
        notes?: string
      }
      Insert: Omit<Database['Tables']['scene_versions']['Row'], 'id' | 'created_at'>
      Update: Partial<Database['Tables']['scene_versions']['Insert']>
    }
    scene_comments: {
      Row: {
        id: string
        scene_id: string
        content: string
        created_at: string
        created_by?: string
        resolved?: boolean
        position?: Json
        type?: CommentType
      }
      Insert: Omit<Database['Tables']['scene_comments']['Row'], 'id' | 'created_at'>
      Update: Partial<Database['Tables']['scene_comments']['Insert']>
    }
    plotlines: {
      Row: {
        id: string
        title: string
        description?: string
        story_id: string
        plotline_type?: PlotlineType
        starting_event_id?: string
        climax_event_id?: string
        resolution_event_id?: string
        theme?: string
        notes?: string
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['Tables']['plotlines']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['Tables']['plotlines']['Insert']>
    }
  }
}

export type Tables = Database['Tables']
export type TableName = keyof Database['Tables']