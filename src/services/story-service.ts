import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type Story = Tables['stories']
type Series = Tables['series']

export async function getStory(storyId: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single()

  if (error) {
    console.error('Error fetching story:', error)
    return null
  }

  return data
}

export async function createStory(story: Partial<Story>): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .insert(story)
    .select()
    .single()

  if (error) {
    console.error('Error creating story:', error)
    return null
  }

  return data
}

export async function updateStory(storyId: string, updates: Partial<Story>): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', storyId)
    .select()
    .single()

  if (error) {
    console.error('Error updating story:', error)
    return null
  }

  return data
}

export async function deleteStory(storyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)

  if (error) {
    console.error('Error deleting story:', error)
    return false
  }

  return true
}

export async function getStoriesByStoryWorld(storyWorldId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('story_world_id', storyWorldId)
    .order('title')

  if (error) {
    console.error('Error fetching stories:', error)
    return []
  }

  return data || []
}

export async function getStoriesBySeries(seriesId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('series_id', seriesId)
    .order('series_order')

  if (error) {
    console.error('Error fetching stories by series:', error)
    return []
  }

  return data || []
}

export async function getSeries(seriesId: string): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', seriesId)
    .single()

  if (error) {
    console.error('Error fetching series:', error)
    return null
  }

  return data
}

export async function createSeries(series: Partial<Series>): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .insert(series)
    .select()
    .single()

  if (error) {
    console.error('Error creating series:', error)
    return null
  }

  return data
}

export async function updateSeries(seriesId: string, updates: Partial<Series>): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .update(updates)
    .eq('id', seriesId)
    .select()
    .single()

  if (error) {
    console.error('Error updating series:', error)
    return null
  }

  return data
}

export async function deleteSeries(seriesId: string): Promise<boolean> {
  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', seriesId)

  if (error) {
    console.error('Error deleting series:', error)
    return false
  }

  return true
}

export async function getSeriesByStoryWorld(storyWorldId: string): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('story_world_id', storyWorldId)
    .order('name')

  if (error) {
    console.error('Error fetching series:', error)
    return []
  }

  return data || []
}

export async function reorderStoriesInSeries(
  seriesId: string,
  storyOrder: { id: string; order: number }[]
): Promise<boolean> {
  const updates = storyOrder.map(item => ({
    id: item.id,
    series_order: item.order
  }))

  const { error } = await supabase
    .from('stories')
    .upsert(updates)

  if (error) {
    console.error('Error reordering stories:', error)
    return false
  }

  return true
}