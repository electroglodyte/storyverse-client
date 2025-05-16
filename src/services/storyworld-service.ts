import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

export interface ExtendedStoryWorld extends Tables['story_worlds'] {
  stories_count?: number;
  characters_count?: number;
}

export async function getStoryWorld(id: string): Promise<ExtendedStoryWorld | null> {
  const { data, error } = await supabase
    .from('story_worlds')
    .select(`
      *,
      stories:stories(count),
      characters:characters(count)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching story world:', error)
    return null
  }

  // Transform the response into ExtendedStoryWorld format
  const storyWorld: ExtendedStoryWorld = {
    ...data,
    stories_count: data.stories?.[0]?.count ?? 0,
    characters_count: data.characters?.[0]?.count ?? 0
  }

  return storyWorld
}

export async function getAllStoryWorlds(): Promise<ExtendedStoryWorld[]> {
  const { data, error } = await supabase
    .from('story_worlds')
    .select(`
      *,
      stories:stories(count),
      characters:characters(count)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching story worlds:', error)
    return []
  }

  // Transform each result into ExtendedStoryWorld format
  const storyWorlds: ExtendedStoryWorld[] = (data || []).map(world => ({
    ...world,
    stories_count: world.stories?.[0]?.count ?? 0,
    characters_count: world.characters?.[0]?.count ?? 0
  }))

  return storyWorlds
}

export async function createStoryWorld(storyWorld: Partial<Tables['story_worlds']>): Promise<Tables['story_worlds'] | null> {
  const { data, error } = await supabase
    .from('story_worlds')
    .insert(storyWorld)
    .select()
    .single()

  if (error) {
    console.error('Error creating story world:', error)
    return null
  }

  return data
}

export async function updateStoryWorld(
  id: string,
  updates: Partial<Tables['story_worlds']>
): Promise<Tables['story_worlds'] | null> {
  const { data, error } = await supabase
    .from('story_worlds')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating story world:', error)
    return null
  }

  return data
}

export async function deleteStoryWorld(id: string): Promise<boolean> {
  // First check if there are any dependent stories
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('story_world_id', id)

  if (stories && stories.length > 0) {
    console.error('Cannot delete story world with existing stories')
    return false
  }

  const { error } = await supabase
    .from('story_worlds')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting story world:', error)
    return false
  }

  return true
}

export async function getStoryWorldStatistics(id: string) {
  const [
    { data: stories },
    { data: characters },
    { data: locations },
    { data: factions },
    { data: items }
  ] = await Promise.all([
    supabase.from('stories').select('count').eq('story_world_id', id).single(),
    supabase.from('characters').select('count').eq('story_world_id', id).single(),
    supabase.from('locations').select('count').eq('story_world_id', id).single(),
    supabase.from('factions').select('count').eq('story_world_id', id).single(),
    supabase.from('items').select('count').eq('story_world_id', id).single()
  ])

  return {
    stories: stories?.count ?? 0,
    characters: characters?.count ?? 0,
    locations: locations?.count ?? 0,
    factions: factions?.count ?? 0,
    items: items?.count ?? 0
  }
}