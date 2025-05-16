// Functions to handle entity imports (locations, factions, etc.)
import { Database } from '../lib/database.types';
import supabase from '../lib/supabaseClient';

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

// Entity-specific interface for Location
interface LocationEntity extends BaseEntity {
  name: string;
  description?: string;
  location_type?: 'city' | 'building' | 'natural' | 'country' | 'planet' | 'realm' | 'other';
  parent_location_id?: string;
  time_period?: string;
  climate?: string;
  culture?: string;
  map_coordinates?: string;
  notable_features?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
}

// Function to preprocess a location entity
function preprocessLocation(location: LocationEntity, context: {story_id?: string, story_world_id?: string}): LocationEntity {
  const now = new Date().toISOString();
  return {
    id: location.id || crypto.randomUUID(),
    story_id: context.story_id || location.story_id,
    story_world_id: context.story_world_id || location.story_world_id,
    storyworld_id: context.story_world_id || location.storyworld_id || location.story_world_id,
    name: location.name,
    description: location.description,
    location_type: location.location_type || 'other',
    parent_location_id: location.parent_location_id,
    climate: location.climate,
    culture: location.culture,
    map_coordinates: location.map_coordinates,
    notable_features: location.notable_features,
    image_url: location.image_url,
    notes: location.notes,
    attributes: location.attributes || {},
    created_at: location.created_at || now,
    updated_at: now
  };
}

// Main function to import locations
export async function importLocations(
  request: ImportEntityRequest<LocationEntity>
): Promise<ImportResponse<LocationEntity>> {
  try {
    // Convert input to array if single entity
    const locations = Array.isArray(request.data) ? request.data : [request.data];

    // Context for preprocessing
    const context = {
      story_id: request.story_id,
      story_world_id: request.story_world_id
    };

    // Preprocess all locations
    const processedLocations = locations.map(loc => preprocessLocation(loc, context));

    // Insert into Supabase
    const { data, error } = await supabase
      .from('locations')
      .insert(processedLocations)
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Successfully imported ${data.length} location(s)`,
      data: data
    };

  } catch (error) {
    console.error('Error importing locations:', error);
    return {
      success: false,
      message: 'Failed to import locations',
      error: error.message
    };
  }
}

// Export other entity import functions as needed
export const entityImporters = {
  location: importLocations,
  // Add other entity importers here
};