import { StoryWorld, Story, Series, Character, Location, Event } from '@/types/database'
import { ExtendedStoryWorld } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getStoryWorldWithDetails(id: string): Promise<ExtendedStoryWorld | null> {
  const { data, error } = await supabase
    .from('story_worlds')
    .select(`
      *,
      stories:stories(*),
      series:series(*),
      characters:characters(*),
      locations:locations(*),
      events:events(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching story world:', error)
    return null
  }

  return data as ExtendedStoryWorld
}

export async function createStoryWorld(storyWorld: Partial<StoryWorld>): Promise<DBResponse<StoryWorld>> {
  const { data, error } = await supabase
    .from('story_worlds')
    .insert([storyWorld])
    .select()
    .single()

  return { data, error }
}

export async function updateStoryWorld(id: string, updates: Partial<StoryWorld>): Promise<DBResponse<StoryWorld>> {
  const { data, error } = await supabase
    .from('story_worlds')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteStoryWorld(id: string): Promise<DBResponse<StoryWorld>> {
  const { data, error } = await supabase
    .from('story_worlds')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getStoryWorldStories(storyWorldId: string): Promise<Story[]> {
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

export async function getStoryWorldSeries(storyWorldId: string): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching series:', error)
    return []
  }

  return data
}

export async function getStoryWorldCharacters(storyWorldId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching characters:', error)
    return []
  }

  return data
}

export async function getStoryWorldLocations(storyWorldId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data
}

export async function getStoryWorldEvents(storyWorldId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data
}