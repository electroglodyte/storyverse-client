import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Generic service class for interacting with Supabase
export class SupabaseService {
  // Character operations
  static async getCharacters(storyId?: string, storyWorldId?: string) {
    let query = supabase.from('characters').select('*');
    
    if (storyId) {
      query = query.eq('story_id', storyId);
    }
    
    if (storyWorldId) {
      query = query.eq('story_world_id', storyWorldId);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error getting characters:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createCharacters(characters: any[]) {
    if (!characters || characters.length === 0) return [];
    
    // First check for existing characters with the same names
    const names = characters.map(char => char.name);
    const { data: existingChars, error: checkError } = await supabase
      .from('characters')
      .select('*')
      .in('name', names);
    
    if (checkError) {
      console.error('Error checking existing characters:', checkError);
      throw checkError;
    }
    
    // Create a map of existing character names for quick lookup
    const existingCharMap = new Map();
    (existingChars || []).forEach(char => {
      existingCharMap.set(char.name, char);
    });
    
    // Filter out characters that already exist and prepare updates for existing ones
    const newCharacters = [];
    const characterUpdates = [];
    
    for (const char of characters) {
      const existingChar = existingCharMap.get(char.name);
      
      if (!existingChar) {
        // If character doesn't exist, add to new characters list
        if (!char.id) char.id = uuidv4();
        newCharacters.push(char);
      } else if (char.description && char.description !== existingChar.description) {
        // If character exists but has new description, prepare update
        characterUpdates.push({
          id: existingChar.id,
          description: char.description,
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Create new characters
    let newCharData = [];
    if (newCharacters.length > 0) {
      const { data, error } = await supabase
        .from('characters')
        .insert(newCharacters)
        .select();
      
      if (error) {
        console.error('Error creating characters:', error);
        throw error;
      }
      
      newCharData = data || [];
    }
    
    // Update existing characters with new information
    if (characterUpdates.length > 0) {
      for (const update of characterUpdates) {
        await supabase
          .from('characters')
          .update(update)
          .eq('id', update.id);
      }
    }
    
    // Return a combination of existing characters and newly created ones
    return [...(existingChars || []), ...newCharData];
  }
  
  // Location operations
  static async getLocations(storyId?: string, storyWorldId?: string) {
    let query = supabase.from('locations').select('*');
    
    if (storyId) {
      query = query.eq('story_id', storyId);
    }
    
    if (storyWorldId) {
      query = query.eq('story_world_id', storyWorldId);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createLocations(locations: any[]) {
    if (!locations || locations.length === 0) return [];
    
    // First check for existing locations with the same names
    const names = locations.map(loc => loc.name);
    const { data: existingLocs, error: checkError } = await supabase
      .from('locations')
      .select('*')
      .in('name', names);
    
    if (checkError) {
      console.error('Error checking existing locations:', checkError);
      throw checkError;
    }
    
    // Create a map of existing location names for quick lookup
    const existingLocMap = new Map();
    (existingLocs || []).forEach(loc => {
      existingLocMap.set(loc.name, loc);
    });
    
    // Filter out locations that already exist and prepare updates for existing ones
    const newLocations = [];
    const locationUpdates = [];
    
    for (const loc of locations) {
      const existingLoc = existingLocMap.get(loc.name);
      
      if (!existingLoc) {
        // If location doesn't exist, add to new locations list
        if (!loc.id) loc.id = uuidv4();
        newLocations.push(loc);
      } else if (loc.description && loc.description !== existingLoc.description) {
        // If location exists but has new description, prepare update
        locationUpdates.push({
          id: existingLoc.id,
          description: loc.description,
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Create new locations
    let newLocData = [];
    if (newLocations.length > 0) {
      const { data, error } = await supabase
        .from('locations')
        .insert(newLocations)
        .select();
      
      if (error) {
        console.error('Error creating locations:', error);
        throw error;
      }
      
      newLocData = data || [];
    }
    
    // Update existing locations with new information
    if (locationUpdates.length > 0) {
      for (const update of locationUpdates) {
        await supabase
          .from('locations')
          .update(update)
          .eq('id', update.id);
      }
    }
    
    // Return a combination of existing locations and newly created ones
    return [...(existingLocs || []), ...newLocData];
  }
  
  // Event operations
  static async getEvents(storyId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', storyId)
      .order('sequence_number');
    
    if (error) {
      console.error('Error getting events:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createEvents(events: any[]) {
    if (!events || events.length === 0) return [];
    
    // First check for existing events with the same titles
    const titles = events.map(evt => evt.title);
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('*')
      .in('title', titles);
    
    if (checkError) {
      console.error('Error checking existing events:', checkError);
      throw checkError;
    }
    
    // Create a map of existing event titles for quick lookup
    const existingEventMap = new Map();
    (existingEvents || []).forEach(evt => {
      existingEventMap.set(evt.title, evt);
    });
    
    // Filter out events that already exist
    const newEvents = events.filter(evt => !existingEventMap.has(evt.title));
    
    if (newEvents.length === 0) {
      return existingEvents || [];
    }
    
    // Ensure all events have IDs
    newEvents.forEach(evt => {
      if (!evt.id) evt.id = uuidv4();
    });
    
    const { data, error } = await supabase
      .from('events')
      .insert(newEvents)
      .select();
    
    if (error) {
      console.error('Error creating events:', error);
      throw error;
    }
    
    return [...(existingEvents || []), ...(data || [])];
  }
  
  // Scene operations
  static async getScenes(storyId: string) {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('story_id', storyId)
      .order('sequence_number');
    
    if (error) {
      console.error('Error getting scenes:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createScenes(scenes: any[]) {
    if (!scenes || scenes.length === 0) return [];
    
    // First check for existing scenes with the same titles
    const titles = scenes.map(scene => scene.title);
    const { data: existingScenes, error: checkError } = await supabase
      .from('scenes')
      .select('*')
      .in('title', titles);
    
    if (checkError) {
      console.error('Error checking existing scenes:', checkError);
      throw checkError;
    }
    
    // Create a map of existing scene titles for quick lookup
    const existingSceneMap = new Map();
    (existingScenes || []).forEach(scene => {
      existingSceneMap.set(scene.title, scene);
    });
    
    // Filter out scenes that already exist
    const newScenes = scenes.filter(scene => !existingSceneMap.has(scene.title));
    
    if (newScenes.length === 0) {
      return existingScenes || [];
    }
    
    // Ensure all scenes have IDs
    newScenes.forEach(scene => {
      if (!scene.id) scene.id = uuidv4();
    });
    
    const { data, error } = await supabase
      .from('scenes')
      .insert(newScenes)
      .select();
    
    if (error) {
      console.error('Error creating scenes:', error);
      throw error;
    }
    
    return [...(existingScenes || []), ...(data || [])];
  }
  
  // Plotline operations
  static async getPlotlines(storyId: string) {
    const { data, error } = await supabase
      .from('plotlines')
      .select('*')
      .eq('story_id', storyId);
    
    if (error) {
      console.error('Error getting plotlines:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createPlotlines(plotlines: any[]) {
    if (!plotlines || plotlines.length === 0) return [];
    
    // First check for existing plotlines with the same titles
    const titles = plotlines.map(plot => plot.title);
    const { data: existingPlots, error: checkError } = await supabase
      .from('plotlines')
      .select('*')
      .in('title', titles);
    
    if (checkError) {
      console.error('Error checking existing plotlines:', checkError);
      throw checkError;
    }
    
    // Create a map of existing plotline titles for quick lookup
    const existingPlotMap = new Map();
    (existingPlots || []).forEach(plot => {
      existingPlotMap.set(plot.title, plot);
    });
    
    // Filter out plotlines that already exist
    const newPlotlines = plotlines.filter(plot => !existingPlotMap.has(plot.title));
    
    if (newPlotlines.length === 0) {
      return existingPlots || [];
    }
    
    // Ensure all plotlines have IDs
    newPlotlines.forEach(plot => {
      if (!plot.id) plot.id = uuidv4();
    });
    
    const { data, error } = await supabase
      .from('plotlines')
      .insert(newPlotlines)
      .select();
    
    if (error) {
      console.error('Error creating plotlines:', error);
      throw error;
    }
    
    return [...(existingPlots || []), ...(data || [])];
  }
  
  // Character Relationship operations
  static async getCharacterRelationships(storyId: string) {
    const { data, error } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('story_id', storyId);
    
    if (error) {
      console.error('Error getting character relationships:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createCharacterRelationships(relationships: any[]) {
    if (!relationships || relationships.length === 0) return [];
    
    // Check for existing relationships between the same characters
    const { data: existingRels, error: checkError } = await supabase
      .from('character_relationships')
      .select('*');
    
    if (checkError) {
      console.error('Error checking existing relationships:', checkError);
      throw checkError;
    }
    
    // Create a map of existing relationships by character pair
    const existingRelMap = new Map();
    (existingRels || []).forEach(rel => {
      const key = `${rel.character1_id}-${rel.character2_id}`;
      existingRelMap.set(key, rel);
    });
    
    // Filter out relationships that already exist
    const newRelationships = relationships.filter(rel => {
      const key = `${rel.character1_id}-${rel.character2_id}`;
      return !existingRelMap.has(key);
    });
    
    if (newRelationships.length === 0) {
      return existingRels || [];
    }
    
    // Ensure all relationships have IDs
    newRelationships.forEach(rel => {
      if (!rel.id) rel.id = uuidv4();
    });
    
    const { data, error } = await supabase
      .from('character_relationships')
      .insert(newRelationships)
      .select();
    
    if (error) {
      console.error('Error creating character relationships:', error);
      throw error;
    }
    
    return [...(existingRels || []), ...(data || [])];
  }
  
  // StoryWorld operations
  static async getStoryWorlds() {
    const { data, error } = await supabase
      .from('story_worlds')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error getting story worlds:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createStoryWorld(storyWorld: any) {
    if (!storyWorld.id) storyWorld.id = uuidv4();
    
    const { data, error } = await supabase
      .from('story_worlds')
      .insert(storyWorld)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating story world:', error);
      throw error;
    }
    
    return data;
  }
  
  // Story operations
  static async getStories(storyWorldId?: string) {
    let query = supabase.from('stories').select('*');
    
    if (storyWorldId) {
      query = query.eq('story_world_id', storyWorldId);
    }
    
    const { data, error } = await query.order('title');
    
    if (error) {
      console.error('Error getting stories:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async createStory(story: any) {
    if (!story.id) story.id = uuidv4();
    
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating story:', error);
      throw error;
    }
    
    return data;
  }
}

// Type definitions
export interface Character {
  id: string;
  name: string;
  description?: string;
  role?: string;
  story_id?: string;
  story_world_id?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  location_type?: string;
  story_id?: string;
  story_world_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  story_id: string;
  sequence_number: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoryWorld {
  id: string;
  name: string;
  description?: string;
  genre?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  story_world_id?: string;
  created_at?: string;
  updated_at?: string;
}
