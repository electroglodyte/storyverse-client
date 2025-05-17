import { createClient } from '@supabase/supabase-js';
import { Character, CharacterRelationship, CharacterEvent, CharacterArc } from '@/types/story';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Character queries with proper joins
export const getCharacterWithRelationships = async (characterId: string) => {
  // Get character details
  const { data: character, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (characterError) throw characterError;

  // Get relationships
  const { data: relationships, error: relationshipError } = await supabase
    .from('character_relationships')
    .select(`
      id,
      relationship_type,
      description,
      intensity,
      notes,
      characters!character1_id(*),
      characters!character2_id(*)
    `)
    .or(`character1_id.eq.${characterId},character2_id.eq.${characterId}`);

  if (relationshipError) throw relationshipError;

  // Get character events
  const { data: events, error: eventsError } = await supabase
    .from('character_events')
    .select(`
      id,
      importance,
      experience_type,
      notes,
      events(*)
    `)
    .eq('character_id', characterId)
    .order('character_sequence_number', { ascending: true });

  if (eventsError) throw eventsError;

  // Get character arcs
  const { data: arcs, error: arcsError } = await supabase
    .from('character_arcs')
    .select('*')
    .eq('character_id', characterId);

  if (arcsError) throw arcsError;

  return {
    ...character,
    relationships,
    events,
    arcs
  };
};

// Faction queries with proper joins
export const getFactionWithMembers = async (factionId: string) => {
  // Get faction details
  const { data: faction, error: factionError } = await supabase
    .from('factions')
    .select('*')
    .eq('id', factionId)
    .single();

  if (factionError) throw factionError;

  // Get faction members with roles
  const { data: members, error: membersError } = await supabase
    .from('faction_characters')
    .select(`
      id,
      role,
      characters(*)
    `)
    .eq('faction_id', factionId);

  if (membersError) throw membersError;

  // Get leader details if present
  let leader = null;
  if (faction.leader_character_id) {
    const { data: leaderData, error: leaderError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', faction.leader_character_id)
      .single();

    if (leaderError) throw leaderError;
    leader = leaderData;
  }

  // Get headquarters location if present
  let headquarters = null;
  if (faction.headquarters_location_id) {
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', faction.headquarters_location_id)
      .single();

    if (locationError) throw locationError;
    headquarters = locationData;
  }

  return {
    ...faction,
    members,
    leader,
    headquarters
  };
};

// Location queries with proper joins
export const getLocationWithChildren = async (locationId: string) => {
  // Get location details
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (locationError) throw locationError;

  // Get child locations
  const { data: children, error: childrenError } = await supabase
    .from('locations')
    .select('*')
    .eq('parent_location_id', locationId);

  if (childrenError) throw childrenError;

  // Get parent location if present
  let parent = null;
  if (location.parent_location_id) {
    const { data: parentData, error: parentError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', location.parent_location_id)
      .single();

    if (parentError) throw parentError;
    parent = parentData;
  }

  return {
    ...location,
    children,
    parent
  };
};
