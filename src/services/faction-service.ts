import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type FactionCharacter = {
  id: string;
  faction_id: string;
  character_id: string;
  role: string;
  created_at: string;
}

export async function getFaction(factionId: string) {
  const { data, error } = await supabase
    .from('factions')
    .select('*')
    .eq('id', factionId)
    .single()

  if (error) {
    console.error('Error fetching faction:', error)
    return null
  }

  return data
}

export async function getFactionCharacters(factionId: string) {
  const { data: factionChars, error: factionError } = await supabase
    .from('faction_characters')
    .select(`
      character_id,
      role,
      characters (*)
    `)
    .eq('faction_id', factionId)

  if (factionError) {
    console.error('Error fetching faction characters:', factionError)
    return []
  }

  return factionChars || []
}

export async function updateFactionCharacters(
  factionId: string,
  characterUpdates: { id: string; role: string }[]
) {
  // First remove all existing character associations
  await supabase
    .from('faction_characters')
    .delete()
    .eq('faction_id', factionId)

  // Then add the new ones
  const newAssociations = characterUpdates.map(char => ({
    faction_id: factionId,
    character_id: char.id,
    role: char.role
  }))

  const { error } = await supabase
    .from('faction_characters')
    .insert(newAssociations)

  if (error) {
    console.error('Error updating faction characters:', error)
    return false
  }

  return true
}

export async function addCharacterToFaction(
  factionId: string,
  characterId: string,
  role: string
) {
  const { error } = await supabase
    .from('faction_characters')
    .insert({
      faction_id: factionId,
      character_id: characterId,
      role
    })

  if (error) {
    console.error('Error adding character to faction:', error)
    return false
  }

  return true
}

export async function removeCharacterFromFaction(
  factionId: string,
  characterId: string
) {
  const { error } = await supabase
    .from('faction_characters')
    .delete()
    .eq('faction_id', factionId)
    .eq('character_id', characterId)

  if (error) {
    console.error('Error removing character from faction:', error)
    return false
  }

  return true
}

export async function updateFactionCharacterRole(
  factionId: string,
  characterId: string,
  newRole: string
) {
  const { error } = await supabase
    .from('faction_characters')
    .update({ role: newRole })
    .eq('faction_id', factionId)
    .eq('character_id', characterId)

  if (error) {
    console.error('Error updating character role:', error)
    return false
  }

  return true
}