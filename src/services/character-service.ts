import { Character } from '@/types/database'
import { CharacterWithRelationships } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getCharacterWithRelationships(id: string): Promise<CharacterWithRelationships | null> {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      *,
      faction:factions(*),
      relationships:character_relationships(*),
      events:character_events(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching character:', error)
    return null
  }

  return data as CharacterWithRelationships
}

export async function createCharacter(character: Partial<Character>): Promise<DBResponse<Character>> {
  const { data, error } = await supabase
    .from('characters')
    .insert([character])
    .select()
    .single()

  return { data, error }
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<DBResponse<Character>> {
  const { data, error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteCharacter(id: string): Promise<DBResponse<Character>> {
  const { data, error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getCharactersByStoryWorld(storyWorldId: string): Promise<Character[]> {
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

export async function getCharactersByFaction(factionId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('faction_id', factionId)

  if (error) {
    console.error('Error fetching characters:', error)
    return []
  }

  return data
}