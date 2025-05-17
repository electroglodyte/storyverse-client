// Functions to handle entity imports (locations, factions, etc.)
import { supabase } from '../supabaseClient';

// Generic type for entity import request
interface ImportEntityRequest<T> {
  data: T | T[];  // Single entity or array of entities
  story_id?: string;
  story_world_id?: string;
}

// Common response type
interface ImportResponse<T> {
  success: boolean;
  message: string;
  data?: T[];
  error?: string;
  stats?: Record<string, number>;
}

// Generic base entity type
interface BaseEntity {
  id?: string;
  story_id?: string;
  story_world_id?: string;
  storyworld_id?: string; // For backward compatibility
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for importing complete story data
 */
export interface StoryImportData {
  storyWorld?: Record<string, any>;
  story?: Record<string, any>;
  characters?: Record<string, any>[];
  locations?: Record<string, any>[];
  factions?: Record<string, any>[];
  objects?: Record<string, any>[];
  events?: Record<string, any>[];
  plotlines?: Record<string, any>[];
  scenes?: Record<string, any>[];
  story_questions?: Record<string, any>[];
  relationships?: Record<string, any>[];
  existingStoryWorldId?: string;
  existingStoryId?: string;
}

/**
 * Import a complete story data set using the Edge Function
 */
export async function importStoryData(data: StoryImportData): Promise<ImportResponse<any>> {
  try {
    // Call the Edge Function with the complete data
    const { data: responseData, error } = await supabase.functions.invoke('import-story', {
      body: data
    });

    if (error) {
      console.error('Error calling import-story function:', error);
      return {
        success: false,
        message: 'Failed to import story data',
        error: error.message
      };
    }

    return {
      success: responseData.success,
      message: responseData.message || 'Successfully imported story data',
      stats: responseData.stats,
      error: responseData.error
    };
  } catch (error) {
    console.error('Error importing story data:', error);
    return {
      success: false,
      message: 'Failed to import story data',
      error: error.message
    };
  }
}

/**
 * Import an array of entities of a specific type
 */
export async function importEntities<T>(
  entities: T[], 
  storyId?: string, 
  storyWorldId?: string
): Promise<ImportResponse<T>> {
  try {
    // Add context to entity objects if missing
    const entitiesWithContext = entities.map(entity => ({
      ...entity,
      story_id: (entity as any).story_id || storyId,
      story_world_id: (entity as any).story_world_id || (entity as any).storyworld_id || storyWorldId
    }));

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('import-story', {
      body: entitiesWithContext
    });

    if (error) {
      console.error('Error calling import-story function:', error);
      return {
        success: false,
        message: 'Failed to import entities',
        error: error.message
      };
    }

    return {
      success: data.success,
      message: data.message || 'Successfully imported entities',
      stats: data.stats,
      error: data.error
    };
  } catch (error) {
    console.error('Error importing entities:', error);
    return {
      success: false,
      message: 'Failed to import entities',
      error: error.message
    };
  }
}

/**
 * Detect the entity type based on the properties present
 */
export function detectEntityType(entity: any): string {
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

// For direct table import (legacy)
export const entityImporters = {
  character: importEntities,
  location: importEntities,
  faction: importEntities,
  object: importEntities,
  event: importEntities,
  plotline: importEntities,
  scene: importEntities,
  story_question: importEntities,
  relationship: importEntities
};
