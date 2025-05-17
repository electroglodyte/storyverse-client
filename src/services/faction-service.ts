import { Faction, Character, FactionCharacter } from '@/types/database'
import { FactionWithMembers } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getFactionWithMembers(id: string): Promise<FactionWithMembers | null> {
  const { data, error } = await supabase
    .from('factions')
    .select(`
      *,
      location:locations(*),
      characters:faction_characters(
        characters(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching faction:', error)
    return null
  }

  return data as FactionWithMembers
}

export async function createFaction(faction: Partial<Faction>): Promise<DBResponse<Faction>> {
  const { data, error } = await supabase
    .from('factions')
    .insert([faction])
    .select()
    .single()

  return { data, error }
}

export async function updateFaction(id: string, updates: Partial<Faction>): Promise<DBResponse<Faction>> {
  const { data, error } = await supabase
    .from('factions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteFaction(id: string): Promise<DBResponse<Faction>> {
  const { data, error } = await supabase
    .from('factions')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getFactionsByStoryWorld(storyWorldId: string): Promise<Faction[]> {
  const { data, error } = await supabase
    .from('factions')
    .select('*')
    .eq('story_world_id', storyWorldId)

  if (error) {
    console.error('Error fetching factions:', error)
    return []
  }

  return data
}

export async function getFactionMembers(factionId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('faction_characters')
    .select('characters(*)')
    .eq('faction_id', factionId)

  if (error) {
    console.error('Error fetching faction members:', error)
    return []
  }

  return data.map(d => d.characters)
}

export async function addFactionMember(factionMember: Partial<FactionCharacter>): Promise<DBResponse<FactionCharacter>> {
  const { data, error } = await supabase
    .from('faction_characters')
    .insert([factionMember])
    .select()
    .single()

  return { data, error }
}

export async function removeFactionMember(factionId: string, characterId: string): Promise<DBResponse<FactionCharacter>> {
  const { data, error } = await supabase
    .from('faction_characters')
    .delete()
    .eq('faction_id', factionId)
    .eq('character_id', characterId)
    .select()
    .single()

  return { data, error }
}

export async function updateFactionMember(
  factionId: string, 
  characterId: string, 
  updates: Partial<FactionCharacter>
): Promise<DBResponse<FactionCharacter>> {
  const { data, error } = await supabase
    .from('faction_characters')
    .update(updates)
    .eq('faction_id', factionId)
    .eq('character_id', characterId)
    .select()
    .single()

  return { data, error }
}