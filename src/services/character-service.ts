import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type Character = Tables['characters']
type CharacterRelationship = {
  id: string;
  character1_id: string;
  character2_id: string;
  relationship_type: 'family' | 'friend' | 'ally' | 'enemy' | 'romantic' | 'professional' | 'other';
  description?: string;
  intensity?: number;
  story_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

type CharacterArc = Tables['character_arcs']

export async function getCharacter(id: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching character:', error)
    return null
  }

  return data
}

export async function createCharacter(character: Partial<Character>): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .insert(character)
    .select()
    .single()

  if (error) {
    console.error('Error creating character:', error)
    return null
  }

  return data
}

export async function updateCharacter(
  id: string,
  updates: Partial<Character>
): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating character:', error)
    return null
  }

  return data
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting character:', error)
    return false
  }

  return true
}

export async function getCharactersByStoryWorld(storyWorldId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('story_world_id', storyWorldId)
    .order('name')

  if (error) {
    console.error('Error fetching characters:', error)
    return []
  }

  return data || []
}

export async function getCharacterRelationships(characterId: string): Promise<CharacterRelationship[]> {
  const { data, error } = await supabase
    .from('character_relationships')
    .select(`
      *,
      character1:characters!character_relationships_character1_id_fkey(*),
      character2:characters!character_relationships_character2_id_fkey(*)
    `)
    .or(`character1_id.eq.${characterId},character2_id.eq.${characterId}`)

  if (error) {
    console.error('Error fetching character relationships:', error)
    return []
  }

  return data || []
}

export async function createCharacterRelationship(
  relationship: Partial<CharacterRelationship>
): Promise<CharacterRelationship | null> {
  const { data, error } = await supabase
    .from('character_relationships')
    .insert(relationship)
    .select()
    .single()

  if (error) {
    console.error('Error creating character relationship:', error)
    return null
  }

  return data
}

export async function updateCharacterRelationship(
  id: string,
  updates: Partial<CharacterRelationship>
): Promise<CharacterRelationship | null> {
  const { data, error } = await supabase
    .from('character_relationships')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating character relationship:', error)
    return null
  }

  return data
}

export async function deleteCharacterRelationship(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('character_relationships')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting character relationship:', error)
    return false
  }

  return true
}

export async function getCharacterArcs(characterId: string): Promise<CharacterArc[]> {
  const { data, error } = await supabase
    .from('character_arcs')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at')

  if (error) {
    console.error('Error fetching character arcs:', error)
    return []
  }

  return data || []
}

export async function createCharacterArc(arc: Partial<CharacterArc>): Promise<CharacterArc | null> {
  const { data, error } = await supabase
    .from('character_arcs')
    .insert(arc)
    .select()
    .single()

  if (error) {
    console.error('Error creating character arc:', error)
    return null
  }

  return data
}

export async function updateCharacterArc(
  id: string,
  updates: Partial<CharacterArc>
): Promise<CharacterArc | null> {
  const { data, error } = await supabase
    .from('character_arcs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating character arc:', error)
    return null
  }

  return data
}

export async function deleteCharacterArc(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('character_arcs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting character arc:', error)
    return false
  }

  return true
}