import { Database } from '@/types/supabase'

// Type-only exports
export type { Database } from '@/types/supabase'

// Core entity types
export type StoryWorld = Database['public']['Tables']['story_worlds']['Row']
export type Story = Database['public']['Tables']['stories']['Row'] 
export type Series = Database['public']['Tables']['series']['Row']
export type Scene = Database['public']['Tables']['scenes']['Row'] & {
  type: string
  status: string
}
export type Character = Database['public']['Tables']['characters']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Faction = Database['public']['Tables']['factions']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type WritingSample = Database['public']['Tables']['writing_samples']['Row']
export type StyleProfile = Database['public']['Tables']['style_profiles']['Row']
export type StyleAnalysis = Database['public']['Tables']['style_analyses']['Row']
export type SceneComment = Database['public']['Tables']['scene_comments']['Row']
export type SceneVersion = Database['public']['Tables']['scene_versions']['Row']