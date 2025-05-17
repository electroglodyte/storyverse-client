// supabase/functions/import-story/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the Auth context of the function
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Detects the entity type based on unique fields present in the object
 * @param entity The entity object to detect
 */
function detectEntityType(entity: any): string {
  // Check for arrays first
  if (Array.isArray(entity)) {
    // If it's an empty array, we can't determine type
    if (entity.length === 0) return 'unknown';
    
    // For arrays, check the first item (assuming homogeneous arrays)
    return detectEntityType(entity[0]);
  }
  
  // Check for non-object values
  if (!entity || typeof entity !== 'object') return 'unknown';

  // Unique field checks for each entity type
  if ('faction_type' in entity || 'type' in entity && 
      (entity.headquarters_location_id || entity.ideology || entity.goals)) {
    return 'faction';
  }
  
  if ('location_type' in entity || 
      (entity.parent_location_id || entity.map_coordinates || entity.climate)) {
    return 'location';
  }
  
  if ('story_question' in entity || 'question' in entity && 
      (entity.resolution_scene_id || entity.origin_scene_id || entity.status === 'open' || 
       entity.status === 'resolved' || entity.status === 'abandoned')) {
    return 'story_question';
  }
  
  if ('type' in entity && 
      (entity.type === 'scene' || entity.type === 'chapter' || entity.type === 'beat' || 
       entity.status === 'draft' || entity.status === 'revised')) {
    return 'scene';
  }
  
  if ('role' in entity && 
      (entity.role === 'protagonist' || entity.role === 'antagonist' || 
       entity.role === 'supporting' || entity.personality || entity.motivation)) {
    return 'character';
  }
  
  if ('object_type' in entity || 'item_type' in entity || 
      (entity.significance && (entity.current_location || entity.current_owner))) {
    return 'object';
  }
  
  if ('sequence_number' in entity && 'chronological_time' in entity) {
    return 'event';
  }
  
  if ('plotline_type' in entity || 
      (entity.starting_event_id || entity.climax_event_id || entity.resolution_event_id)) {
    return 'plotline';
  }
  
  if ('character1_id' in entity && 'character2_id' in entity && 'relationship_type' in entity) {
    return 'character_relationship';
  }
  
  if ('predecessor_event_id' in entity && 'successor_event_id' in entity) {
    return 'event_dependency';
  }
  
  // Check for story-level entities
  if ('storyWorld' in entity || 'story_world' in entity) {
    return 'story_world';
  }
  
  if ('title' in entity && 'story_type' in entity) {
    return 'story';
  }
  
  return 'unknown';
}

/**
 * Process an array of entities, detecting their type and routing to appropriate tables
 */
async function processEntities(
  entities: any[], 
  storyId: string | null = null, 
  storyWorldId: string | null = null
): Promise<Record<string, number>> {
  // Initialize counters for each entity type
  const counts: Record<string, number> = {
    characters: 0,
    locations: 0,
    factions: 0,
    objects: 0,
    events: 0,
    plotlines: 0,
    scenes: 0,
    story_questions: 0,
    relationships: 0,
    dependencies: 0,
    story: 0,
    storyWorld: 0,
  };
  
  // Process each entity
  for (const entity of entities) {
    try {
      // Skip null or undefined entities
      if (!entity) continue;
      
      // Detect entity type
      const entityType = detectEntityType(entity);
      
      // Add storyId and storyWorldId to entity if not present
      const enrichedEntity = {
        ...entity,
        story_id: entity.story_id || storyId,
        story_world_id: entity.story_world_id || entity.storyworld_id || storyWorldId
      };
      
      // Route entity to appropriate table
      switch (entityType) {
        case 'character':
          await insertOrUpdateEntity('characters', enrichedEntity);
          counts.characters++;
          break;
        case 'location':
          await insertOrUpdateEntity('locations', enrichedEntity);
          counts.locations++;
          break;
        case 'faction':
          await insertOrUpdateEntity('factions', enrichedEntity);
          counts.factions++;
          break;
        case 'object':
          await insertOrUpdateEntity('objects', enrichedEntity);
          counts.objects++;
          break;
        case 'event':
          await insertOrUpdateEntity('events', enrichedEntity);
          counts.events++;
          break;
        case 'plotline':
          await insertOrUpdateEntity('plotlines', enrichedEntity);
          counts.plotlines++;
          break;
        case 'scene':
          await insertOrUpdateEntity('scenes', enrichedEntity);
          counts.scenes++;
          break;
        case 'story_question':
          await insertOrUpdateEntity('story_questions', enrichedEntity);
          counts.story_questions++;
          break;
        case 'character_relationship':
          await insertOrUpdateEntity('character_relationships', enrichedEntity);
          counts.relationships++;
          break;
        case 'event_dependency':
          await insertOrUpdateEntity('event_dependencies', enrichedEntity);
          counts.dependencies++;
          break;
        case 'story':
          const story = await insertOrUpdateEntity('stories', enrichedEntity);
          counts.story++;
          storyId = story.id;
          break;
        case 'story_world':
          const storyWorld = await insertOrUpdateEntity('story_worlds', enrichedEntity);
          counts.storyWorld++;
          storyWorldId = storyWorld.id;
          break;
        default:
          console.warn(`Unknown entity type for: ${JSON.stringify(entity).slice(0, 100)}...`);
      }
    } catch (error) {
      console.error(`Error processing entity: ${error.message}`);
    }
  }
  
  return counts;
}

/**
 * Insert or update an entity in the database
 */
async function insertOrUpdateEntity(tableName: string, entity: any): Promise<any> {
  // Ensure entity has an ID
  const entityWithId = {
    ...entity,
    id: entity.id || uuidv4(),
    created_at: entity.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Check if entity already exists
  const { data: existingData, error: checkError } = await supabaseAdmin
    .from(tableName)
    .select('id')
    .eq('id', entityWithId.id)
    .maybeSingle();
  
  if (checkError) {
    console.error(`Error checking existing entity in ${tableName}: ${checkError.message}`);
    throw checkError;
  }
  
  if (existingData) {
    // Update existing entity
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(entityWithId)
      .eq('id', entityWithId.id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating entity in ${tableName}: ${error.message}`);
      throw error;
    }
    
    return data;
  } else {
    // Insert new entity
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert(entityWithId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting entity in ${tableName}: ${error.message}`);
      throw error;
    }
    
    return data;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { body } = await req.json();
    
    // Track existing IDs for reference
    let storyId = null;
    let storyWorldId = null;
    
    // Initialize counters
    const stats: Record<string, number> = {
      storyWorld: 0,
      story: 0,
      characters: 0,
      locations: 0,
      factions: 0,
      objects: 0,
      events: 0,
      relationships: 0,
      plotlines: 0,
      scenes: 0,
      story_questions: 0,
    };
    
    // Process different formats of incoming data
    
    // If it's an array of entities, process them directly
    if (Array.isArray(body)) {
      // Handle array of entities (like characters)
      const counts = await processEntities(body, body[0]?.story_id || null, body[0]?.story_world_id || body[0]?.storyworld_id || null);
      Object.assign(stats, counts);
    } 
    // If it's a complete story structure with multiple entity collections
    else if (body && typeof body === 'object') {
      // Check for existingStoryId and existingStoryWorldId from UI
      if (body.existingStoryId) {
        storyId = body.existingStoryId;
        stats.story = 1; // Count the existing story
      }
      
      if (body.existingStoryWorldId) {
        storyWorldId = body.existingStoryWorldId;
        stats.storyWorld = 1; // Count the existing story world
      }
      
      // Process StoryWorld if present
      if (body.storyWorld) {
        const storyWorldCounts = await processEntities([body.storyWorld]);
        storyWorldId = body.storyWorld.id || storyWorldId;
        Object.assign(stats, storyWorldCounts);
      }
      
      // Process Story if present
      if (body.story) {
        // Link to StoryWorld if needed
        if (storyWorldId && !body.story.story_world_id) {
          body.story.story_world_id = storyWorldId;
        }
        
        const storyCounts = await processEntities([body.story]);
        storyId = body.story.id || storyId;
        Object.assign(stats, storyCounts);
      }
      
      // Process each entity collection
      const entityCollections = [
        { key: 'characters', storyId, storyWorldId },
        { key: 'locations', storyId, storyWorldId },
        { key: 'factions', storyId, storyWorldId },
        { key: 'objects', storyId, storyWorldId },
        { key: 'events', storyId, storyWorldId },
        { key: 'plotlines', storyId, storyWorldId },
        { key: 'scenes', storyId, storyWorldId },
        { key: 'story_questions', storyId, storyWorldId },
        { key: 'relationships', storyId, storyWorldId },
      ];
      
      for (const { key, storyId, storyWorldId } of entityCollections) {
        if (body[key] && Array.isArray(body[key]) && body[key].length > 0) {
          const counts = await processEntities(body[key], storyId, storyWorldId);
          for (const [countKey, countValue] of Object.entries(counts)) {
            stats[countKey] = (stats[countKey] || 0) + countValue;
          }
        }
      }
    }
    
    // Return success response with stats
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          ...stats,
          story_id: storyId
        },
        message: 'Data imported successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 400,
      }
    );
  }
});
