import { Story, Scene } from '@/types/database'
import { ExtendedStory } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getStoryWithDetails(id: string): Promise<ExtendedStory | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      storyworld:story_worlds(*),
      series:series(*),
      scenes:scenes(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching story:', error)
    return null
  }

  return data as ExtendedStory
}

export async function createStory(story: Partial<Story>): Promise<DBResponse<Story>> {
  const { data, error } = await supabase
    .from('stories')
    .insert([story])
    .select()
    .single()

  return { data, error }
}

export async function updateStory(id: string, updates: Partial<Story>): Promise<DBResponse<Story>> {
  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteStory(id: string): Promise<DBResponse<Story>> {
  const { data, error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getStoriesByStoryWorld(storyWorldId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching stories:', error)
    return []
  }

  return data
}

export async function getStoriesBySeries(seriesId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('series_id', seriesId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching stories:', error)
    return []
  }

  return data
}

export async function getStoryScenes(storyId: string): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching scenes:', error)
    return []
  }

  return data
}