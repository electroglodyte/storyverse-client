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
    
    // First check for existing characters with the same names in the same context
    const namesWithContext: Array<{ name: string, story_id?: string, story_world_id?: string }> = 
      characters.map(char => ({
        name: char.name,
        story_id: char.story_id,
        story_world_id: char.story_world_id
      }));
    
    const existingCharsPromises = namesWithContext.map(async (ctx) => {
      let query = supabase.from('characters').select('*').ilike('name', ctx.name);
      
      // Apply context filters for more accurate matching
      if (ctx.story_id) {
        query = query.eq('story_id', ctx.story_id);
      }
      
      if (ctx.story_world_id) {
        query = query.eq('story_world_id', ctx.story_world_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking existing character:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    });
    
    // Resolve all promises to get existing characters
    const existingCharsResults = await Promise.all(existingCharsPromises);
    
    // Create a map of existing character names to their data
    const existingCharMap = new Map();
    existingCharsResults.forEach(char => {
      if (char) {
        existingCharMap.set(char.name.toLowerCase(), char);
      }
    });
    
    console.log(`Found ${existingCharMap.size} existing characters with matching names`);
    
    // Filter out characters that already exist and prepare updates for existing ones
    const newCharacters = [];
    const characterUpdates = [];
    const mergedCharacters = [];
    
    for (const char of characters) {
      const existingChar = existingCharMap.get(char.name.toLowerCase());
      
      if (!existingChar) {
        // If character doesn't exist, add to new characters list
        if (!char.id) char.id = uuidv4();
        newCharacters.push(char);
      } else {
        // If character exists, check if we need to update any fields
        const updates: any = {
          id: existingChar.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['description', 'role', 'appearance', 'personality', 'background'].forEach(field => {
          if (char[field] && char[field] !== existingChar[field]) {
            updates[field] = char[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          characterUpdates.push(updates);
        }
        
        // Add the existing character to the merged result
        mergedCharacters.push(existingChar);
      }
    }
    
    console.log(`After deduplication: ${newCharacters.length} characters to create, ${characterUpdates.length} to update`);
    
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
      console.log(`Successfully created ${newCharData.length} new characters`);
    }
    
    // Update existing characters with new information
    const updatedCharData = [];
    if (characterUpdates.length > 0) {
      for (const update of characterUpdates) {
        const { data, error } = await supabase
          .from('characters')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating character (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedCharData.push(data[0]);
        }
      }
      console.log(`Successfully updated ${updatedCharData.length} existing characters`);
    }
    
    // Return a combination of existing characters, updated characters, and newly created ones
    return [...mergedCharacters, ...updatedCharData, ...newCharData];
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
    
    // First check for existing locations with the same names in the same context
    const namesWithContext: Array<{ name: string, story_id?: string, story_world_id?: string }> = 
      locations.map(loc => ({
        name: loc.name,
        story_id: loc.story_id,
        story_world_id: loc.story_world_id
      }));
    
    const existingLocsPromises = namesWithContext.map(async (ctx) => {
      let query = supabase.from('locations').select('*').ilike('name', ctx.name);
      
      // Apply context filters for more accurate matching
      if (ctx.story_id) {
        query = query.eq('story_id', ctx.story_id);
      }
      
      if (ctx.story_world_id) {
        query = query.eq('story_world_id', ctx.story_world_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking existing location:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    });
    
    // Resolve all promises to get existing locations
    const existingLocsResults = await Promise.all(existingLocsPromises);
    
    // Create a map of existing location names to their data
    const existingLocMap = new Map();
    existingLocsResults.forEach(loc => {
      if (loc) {
        existingLocMap.set(loc.name.toLowerCase(), loc);
      }
    });
    
    console.log(`Found ${existingLocMap.size} existing locations with matching names`);
    
    // Filter out locations that already exist and prepare updates for existing ones
    const newLocations = [];
    const locationUpdates = [];
    const mergedLocations = [];
    
    for (const loc of locations) {
      const existingLoc = existingLocMap.get(loc.name.toLowerCase());
      
      if (!existingLoc) {
        // If location doesn't exist, add to new locations list
        if (!loc.id) loc.id = uuidv4();
        newLocations.push(loc);
      } else {
        // If location exists, check if we need to update any fields
        const updates: any = {
          id: existingLoc.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['description', 'location_type', 'climate', 'culture', 'notable_features'].forEach(field => {
          if (loc[field] && loc[field] !== existingLoc[field]) {
            updates[field] = loc[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          locationUpdates.push(updates);
        }
        
        // Add the existing location to the merged result
        mergedLocations.push(existingLoc);
      }
    }
    
    console.log(`After deduplication: ${newLocations.length} locations to create, ${locationUpdates.length} to update`);
    
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
      console.log(`Successfully created ${newLocData.length} new locations`);
    }
    
    // Update existing locations with new information
    const updatedLocData = [];
    if (locationUpdates.length > 0) {
      for (const update of locationUpdates) {
        const { data, error } = await supabase
          .from('locations')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating location (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedLocData.push(data[0]);
        }
      }
      console.log(`Successfully updated ${updatedLocData.length} existing locations`);
    }
    
    // Return a combination of existing locations, updated locations, and newly created ones
    return [...mergedLocations, ...updatedLocData, ...newLocData];
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
    
    // First check for existing events with the same titles and story_id
    const eventsWithContext = events.map(evt => ({
      title: evt.title,
      story_id: evt.story_id
    }));
    
    const existingEventsPromises = eventsWithContext.map(async (ctx) => {
      if (!ctx.story_id) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('story_id', ctx.story_id)
        .ilike('title', ctx.title);
      
      if (error) {
        console.error('Error checking existing event:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    });
    
    // Resolve all promises to get existing events
    const existingEventsResults = await Promise.all(existingEventsPromises);
    
    // Create a map of existing event titles to their data
    const existingEventMap = new Map();
    existingEventsResults.forEach(evt => {
      if (evt) {
        // Use a composite key of title+story_id for more accurate matching
        const key = `${evt.title.toLowerCase()}_${evt.story_id}`;
        existingEventMap.set(key, evt);
      }
    });
    
    // Filter out events that already exist and prepare updates
    const newEvents = [];
    const eventUpdates = [];
    const mergedEvents = [];
    
    for (const evt of events) {
      const key = `${evt.title.toLowerCase()}_${evt.story_id}`;
      const existingEvent = existingEventMap.get(key);
      
      if (!existingEvent) {
        // If event doesn't exist, add to new events list
        if (!evt.id) evt.id = uuidv4();
        newEvents.push(evt);
      } else {
        // If event exists, check if we need to update any fields
        const updates: any = {
          id: existingEvent.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['description', 'sequence_number'].forEach(field => {
          if (evt[field] !== undefined && evt[field] !== existingEvent[field]) {
            updates[field] = evt[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          eventUpdates.push(updates);
        }
        
        // Add the existing event to the merged result
        mergedEvents.push(existingEvent);
      }
    }
    
    // Create new events
    let newEventData = [];
    if (newEvents.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .insert(newEvents)
        .select();
      
      if (error) {
        console.error('Error creating events:', error);
        throw error;
      }
      
      newEventData = data || [];
    }
    
    // Update existing events with new information
    const updatedEventData = [];
    if (eventUpdates.length > 0) {
      for (const update of eventUpdates) {
        const { data, error } = await supabase
          .from('events')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating event (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedEventData.push(data[0]);
        }
      }
    }
    
    // Return a combination of existing events, updated events, and newly created ones
    return [...mergedEvents, ...updatedEventData, ...newEventData];
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
    
    // First check for existing scenes with the same titles and story_id
    const scenesWithContext = scenes.map(scene => ({
      title: scene.title,
      story_id: scene.story_id
    }));
    
    const existingScenesPromises = scenesWithContext.map(async (ctx) => {
      if (!ctx.story_id) return null;
      
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', ctx.story_id)
        .ilike('title', ctx.title);
      
      if (error) {
        console.error('Error checking existing scene:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    });
    
    // Resolve all promises to get existing scenes
    const existingScenesResults = await Promise.all(existingScenesPromises);
    
    // Create a map of existing scene titles to their data
    const existingSceneMap = new Map();
    existingScenesResults.forEach(scene => {
      if (scene) {
        // Use a composite key of title+story_id for more accurate matching
        const key = `${scene.title.toLowerCase()}_${scene.story_id}`;
        existingSceneMap.set(key, scene);
      }
    });
    
    // Filter out scenes that already exist and prepare updates
    const newScenes = [];
    const sceneUpdates = [];
    const mergedScenes = [];
    
    for (const scene of scenes) {
      const key = `${scene.title.toLowerCase()}_${scene.story_id}`;
      const existingScene = existingSceneMap.get(key);
      
      if (!existingScene) {
        // If scene doesn't exist, add to new scenes list
        if (!scene.id) scene.id = uuidv4();
        newScenes.push(scene);
      } else {
        // If scene exists, check if we need to update any fields
        const updates: any = {
          id: existingScene.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['content', 'description', 'sequence_number', 'status'].forEach(field => {
          if (scene[field] !== undefined && scene[field] !== existingScene[field]) {
            updates[field] = scene[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          sceneUpdates.push(updates);
        }
        
        // Add the existing scene to the merged result
        mergedScenes.push(existingScene);
      }
    }
    
    // Create new scenes
    let newSceneData = [];
    if (newScenes.length > 0) {
      const { data, error } = await supabase
        .from('scenes')
        .insert(newScenes)
        .select();
      
      if (error) {
        console.error('Error creating scenes:', error);
        throw error;
      }
      
      newSceneData = data || [];
    }
    
    // Update existing scenes with new information
    const updatedSceneData = [];
    if (sceneUpdates.length > 0) {
      for (const update of sceneUpdates) {
        const { data, error } = await supabase
          .from('scenes')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating scene (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedSceneData.push(data[0]);
        }
      }
    }
    
    // Return a combination of existing scenes, updated scenes, and newly created ones
    return [...mergedScenes, ...updatedSceneData, ...newSceneData];
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
    
    // First check for existing plotlines with the same titles and story_id
    const plotlinesWithContext = plotlines.map(plot => ({
      title: plot.title,
      story_id: plot.story_id
    }));
    
    const existingPlotsPromises = plotlinesWithContext.map(async (ctx) => {
      if (!ctx.story_id) return null;
      
      const { data, error } = await supabase
        .from('plotlines')
        .select('*')
        .eq('story_id', ctx.story_id)
        .ilike('title', ctx.title);
      
      if (error) {
        console.error('Error checking existing plotline:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    });
    
    // Resolve all promises to get existing plotlines
    const existingPlotsResults = await Promise.all(existingPlotsPromises);
    
    // Create a map of existing plotline titles to their data
    const existingPlotMap = new Map();
    existingPlotsResults.forEach(plot => {
      if (plot) {
        // Use a composite key of title+story_id for more accurate matching
        const key = `${plot.title.toLowerCase()}_${plot.story_id}`;
        existingPlotMap.set(key, plot);
      }
    });
    
    // Filter out plotlines that already exist and prepare updates
    const newPlotlines = [];
    const plotlineUpdates = [];
    const mergedPlotlines = [];
    
    for (const plot of plotlines) {
      const key = `${plot.title.toLowerCase()}_${plot.story_id}`;
      const existingPlot = existingPlotMap.get(key);
      
      if (!existingPlot) {
        // If plotline doesn't exist, add to new plotlines list
        if (!plot.id) plot.id = uuidv4();
        newPlotlines.push(plot);
      } else {
        // If plotline exists, check if we need to update any fields
        const updates: any = {
          id: existingPlot.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['description', 'plotline_type', 'theme'].forEach(field => {
          if (plot[field] !== undefined && plot[field] !== existingPlot[field]) {
            updates[field] = plot[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          plotlineUpdates.push(updates);
        }
        
        // Add the existing plotline to the merged result
        mergedPlotlines.push(existingPlot);
      }
    }
    
    // Create new plotlines
    let newPlotData = [];
    if (newPlotlines.length > 0) {
      const { data, error } = await supabase
        .from('plotlines')
        .insert(newPlotlines)
        .select();
      
      if (error) {
        console.error('Error creating plotlines:', error);
        throw error;
      }
      
      newPlotData = data || [];
    }
    
    // Update existing plotlines with new information
    const updatedPlotData = [];
    if (plotlineUpdates.length > 0) {
      for (const update of plotlineUpdates) {
        const { data, error } = await supabase
          .from('plotlines')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating plotline (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedPlotData.push(data[0]);
        }
      }
    }
    
    // Return a combination of existing plotlines, updated plotlines, and newly created ones
    return [...mergedPlotlines, ...updatedPlotData, ...newPlotData];
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
    const existingRels = await Promise.all(
      relationships.map(async (rel) => {
        // Need both character IDs to check for existing relationship
        if (!rel.character1_id || !rel.character2_id) return null;
        
        // Check both directions (character1->character2 and character2->character1)
        const { data, error } = await supabase
          .from('character_relationships')
          .select('*')
          .or(`and(character1_id.eq.${rel.character1_id},character2_id.eq.${rel.character2_id}),and(character1_id.eq.${rel.character2_id},character2_id.eq.${rel.character1_id})`);
        
        if (error) {
          console.error('Error checking existing relationship:', error);
          return null;
        }
        
        return data && data.length > 0 ? data[0] : null;
      })
    );
    
    // Create a map using both character IDs as the key
    const existingRelMap = new Map();
    existingRels.forEach(rel => {
      if (rel) {
        // Use character IDs as keys (both directions)
        const key1 = `${rel.character1_id}_${rel.character2_id}`;
        const key2 = `${rel.character2_id}_${rel.character1_id}`;
        existingRelMap.set(key1, rel);
        existingRelMap.set(key2, rel);
      }
    });
    
    // Filter out relationships that already exist and prepare updates
    const newRelationships = [];
    const relationshipUpdates = [];
    const mergedRelationships = [];
    
    for (const rel of relationships) {
      // Need both character IDs to check
      if (!rel.character1_id || !rel.character2_id) continue;
      
      const key = `${rel.character1_id}_${rel.character2_id}`;
      const existingRel = existingRelMap.get(key);
      
      if (!existingRel) {
        // If relationship doesn't exist, add to new relationships list
        if (!rel.id) rel.id = uuidv4();
        newRelationships.push(rel);
      } else {
        // If relationship exists, check if we need to update any fields
        const updates: any = {
          id: existingRel.id,
          updated_at: new Date().toISOString()
        };
        
        let hasChanges = false;
        
        // Check each field for potential updates
        ['relationship_type', 'description', 'intensity'].forEach(field => {
          if (rel[field] !== undefined && rel[field] !== existingRel[field]) {
            updates[field] = rel[field];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          relationshipUpdates.push(updates);
        }
        
        // Add the existing relationship to the merged result
        mergedRelationships.push(existingRel);
      }
    }
    
    // Create new relationships
    let newRelData = [];
    if (newRelationships.length > 0) {
      const { data, error } = await supabase
        .from('character_relationships')
        .insert(newRelationships)
        .select();
      
      if (error) {
        console.error('Error creating character relationships:', error);
        throw error;
      }
      
      newRelData = data || [];
    }
    
    // Update existing relationships with new information
    const updatedRelData = [];
    if (relationshipUpdates.length > 0) {
      for (const update of relationshipUpdates) {
        const { data, error } = await supabase
          .from('character_relationships')
          .update(update)
          .eq('id', update.id)
          .select();
          
        if (error) {
          console.error(`Error updating relationship (${update.id}):`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedRelData.push(data[0]);
        }
      }
    }
    
    // Return a combination of existing relationships, updated relationships, and newly created ones
    return [...mergedRelationships, ...updatedRelData, ...newRelData];
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
    // Check if a story world with the same name already exists
    const { data: existingWorlds, error: checkError } = await supabase
      .from('story_worlds')
      .select('*')
      .ilike('name', storyWorld.name);
    
    if (checkError) {
      console.error('Error checking existing story world:', checkError);
      throw checkError;
    }
    
    if (existingWorlds && existingWorlds.length > 0) {
      // Story world with this name already exists, update if needed
      const existingWorld = existingWorlds[0];
      
      // Check if we need to update any fields
      const updates: any = {
        updated_at: new Date().toISOString()
      };
      
      let hasChanges = false;
      
      // Check each field for potential updates
      ['description', 'genre', 'tags', 'time_period', 'rules', 'notes'].forEach(field => {
        if (storyWorld[field] !== undefined && storyWorld[field] !== existingWorld[field]) {
          updates[field] = storyWorld[field];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        const { data, error } = await supabase
          .from('story_worlds')
          .update(updates)
          .eq('id', existingWorld.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating story world:', error);
          throw error;
        }
        
        return data;
      }
      
      return existingWorld;
    }
    
    // No existing story world with this name, create a new one
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
    // Check if a story with the same title already exists in the same story world
    const { data: existingStories, error: checkError } = await supabase
      .from('stories')
      .select('*')
      .ilike('title', story.title);
    
    if (checkError) {
      console.error('Error checking existing story:', checkError);
      throw checkError;
    }
    
    // If story world ID is provided, filter existing stories by it
    let matchingStory = null;
    if (existingStories && existingStories.length > 0) {
      if (story.story_world_id) {
        matchingStory = existingStories.find(s => s.story_world_id === story.story_world_id);
      } else {
        matchingStory = existingStories[0];
      }
    }
    
    if (matchingStory) {
      // Story with this title already exists, update if needed
      const updates: any = {
        updated_at: new Date().toISOString()
      };
      
      let hasChanges = false;
      
      // Check each field for potential updates
      ['description', 'genre', 'tags', 'status', 'synopsis', 'notes'].forEach(field => {
        if (story[field] !== undefined && story[field] !== matchingStory[field]) {
          updates[field] = story[field];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        const { data, error } = await supabase
          .from('stories')
          .update(updates)
          .eq('id', matchingStory.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating story:', error);
          throw error;
        }
        
        return data;
      }
      
      return matchingStory;
    }
    
    // No existing story with this title, create a new one
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
