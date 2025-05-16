import { supabase } from './supabase';
import { SupabaseService } from '../services/SupabaseService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Imports pre-analyzed story data (produced by Claude) into the database,
 * handling entity relationships and deduplication.
 * 
 * @param {Object} data The pre-analyzed story data with all entity information
 */
export async function import_analyzed_story(data) {
  console.log('Beginning import of pre-analyzed story data');
  
  try {
    // Step 1: Create/update the StoryWorld (if provided)
    let storyWorldId = null;
    if (data.storyWorld) {
      console.log('Creating/updating StoryWorld:', data.storyWorld.name);
      const storyWorld = await SupabaseService.createStoryWorld(data.storyWorld);
      storyWorldId = storyWorld.id;
      console.log('StoryWorld created/updated with ID:', storyWorldId);
    }
    
    // Step 2: Create/update the Story
    let storyId = null;
    if (data.story) {
      // Link to StoryWorld if created in previous step
      if (storyWorldId && !data.story.story_world_id) {
        data.story.story_world_id = storyWorldId;
      }
      
      console.log('Creating/updating Story:', data.story.title);
      const story = await SupabaseService.createStory(data.story);
      storyId = story.id;
      console.log('Story created/updated with ID:', storyId);
    } else {
      throw new Error('Story data is required');
    }
    
    // Step 3: Create/update Characters
    let characters = [];
    if (data.characters && data.characters.length > 0) {
      // Link characters to the story
      const charactersWithStory = data.characters.map(char => ({
        ...char,
        story_id: storyId,
        story_world_id: storyWorldId || char.story_world_id
      }));
      
      console.log(`Creating/updating ${charactersWithStory.length} Characters`);
      characters = await SupabaseService.createCharacters(charactersWithStory);
      console.log(`${characters.length} Characters processed`);
    }
    
    // Step 4: Create/update Locations
    let locations = [];
    if (data.locations && data.locations.length > 0) {
      // Link locations to the story
      const locationsWithStory = data.locations.map(loc => ({
        ...loc,
        story_id: storyId,
        story_world_id: storyWorldId || loc.story_world_id
      }));
      
      console.log(`Creating/updating ${locationsWithStory.length} Locations`);
      locations = await SupabaseService.createLocations(locationsWithStory);
      console.log(`${locations.length} Locations processed`);
    }
    
    // Step 5: Create/update Factions
    let factions = [];
    if (data.factions && data.factions.length > 0) {
      // We don't have a createFactions method, so we'll implement it here
      factions = await importFactions(data.factions, storyId, storyWorldId, characters);
      console.log(`${factions.length} Factions processed`);
    }
    
    // Step 6: Create/update Objects/Items
    let objects = [];
    if (data.objects && data.objects.length > 0) {
      // We don't have a createObjects method, so we'll implement it here
      objects = await importObjects(data.objects, storyId, storyWorldId, characters, locations);
      console.log(`${objects.length} Objects processed`);
    }
    
    // Step 7: Create/update Events
    let events = [];
    if (data.events && data.events.length > 0) {
      // Link events to the story
      const eventsWithStory = data.events.map(evt => ({
        ...evt,
        story_id: storyId
      }));
      
      console.log(`Creating/updating ${eventsWithStory.length} Events`);
      events = await SupabaseService.createEvents(eventsWithStory);
      console.log(`${events.length} Events processed`);
    }
    
    // Step 8: Create/update Character Relationships
    let relationships = [];
    if (data.relationships && data.relationships.length > 0) {
      // Map character names to IDs for relationship creation
      const charNameToId = new Map();
      characters.forEach(char => charNameToId.set(char.name.toLowerCase(), char.id));
      
      // Process relationships, resolving character references
      const resolvedRelationships = data.relationships
        .filter(rel => rel.character1 && rel.character2) // Ensure we have both characters
        .map(rel => {
          const char1Id = charNameToId.get(rel.character1.toLowerCase());
          const char2Id = charNameToId.get(rel.character2.toLowerCase());
          
          if (!char1Id || !char2Id) {
            console.warn(`Skipping relationship between ${rel.character1} and ${rel.character2} - character(s) not found`);
            return null;
          }
          
          return {
            character1_id: char1Id,
            character2_id: char2Id,
            relationship_type: rel.relationship_type || 'other',
            description: rel.description,
            intensity: rel.intensity || 5,
            story_id: storyId
          };
        })
        .filter(rel => rel !== null);
      
      if (resolvedRelationships.length > 0) {
        console.log(`Creating/updating ${resolvedRelationships.length} Character Relationships`);
        relationships = await SupabaseService.createCharacterRelationships(resolvedRelationships);
        console.log(`${relationships.length} Character Relationships processed`);
      }
    }
    
    // Step 9: Create/update Plotlines
    let plotlines = [];
    if (data.plotlines && data.plotlines.length > 0) {
      // Link plotlines to the story
      const plotlinesWithStory = data.plotlines.map(plot => ({
        ...plot,
        story_id: storyId
      }));
      
      console.log(`Creating/updating ${plotlinesWithStory.length} Plotlines`);
      plotlines = await SupabaseService.createPlotlines(plotlinesWithStory);
      console.log(`${plotlines.length} Plotlines processed`);
    }
    
    // Step 10: Create/update Scenes
    let scenes = [];
    if (data.scenes && data.scenes.length > 0) {
      // Link scenes to the story
      const scenesWithStory = data.scenes.map(scene => ({
        ...scene,
        story_id: storyId
      }));
      
      console.log(`Creating/updating ${scenesWithStory.length} Scenes`);
      scenes = await SupabaseService.createScenes(scenesWithStory);
      console.log(`${scenes.length} Scenes processed`);
    }
    
    // Step 11: Create junction table entries (CharacterEvents, PlotlineEvents, etc.)
    await createJunctionTableEntries(data, storyId, characters, events, plotlines, scenes);
    
    // Return success with counts
    return {
      success: true,
      counts: {
        storyWorld: storyWorldId ? 1 : 0,
        story: 1,
        characters: characters.length,
        locations: locations.length,
        factions: factions.length,
        objects: objects.length,
        events: events.length,
        relationships: relationships.length,
        plotlines: plotlines.length,
        scenes: scenes.length
      }
    };
  } catch (error) {
    console.error('Error importing analyzed story:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper function to import factions
 */
async function importFactions(factions, storyId, storyWorldId, characters) {
  // Check for existing factions to avoid duplicates
  const { data: existingFactions, error } = await supabase
    .from('factions')
    .select('*')
    .eq('story_id', storyId);
  
  if (error) {
    console.error('Error fetching existing factions:', error);
    throw error;
  }
  
  // Create a map of existing faction names
  const existingFactionMap = new Map();
  existingFactions.forEach(faction => {
    existingFactionMap.set(faction.name.toLowerCase(), faction);
  });
  
  // Map character names to IDs for faction leader references
  const charNameToId = new Map();
  characters.forEach(char => charNameToId.set(char.name.toLowerCase(), char.id));
  
  // Process factions, resolving entity references
  const results = [];
  
  for (const faction of factions) {
    const existingFaction = existingFactionMap.get(faction.name.toLowerCase());
    
    if (existingFaction) {
      // Update faction if changes needed
      const updates = {
        updated_at: new Date().toISOString()
      };
      
      let hasChanges = false;
      
      // Check each field for potential updates
      ['description', 'faction_type', 'ideology', 'goals', 'resources'].forEach(field => {
        if (faction[field] && faction[field] !== existingFaction[field]) {
          updates[field] = faction[field];
          hasChanges = true;
        }
      });
      
      // Handle leader reference if provided
      if (faction.leader && typeof faction.leader === 'string') {
        const leaderId = charNameToId.get(faction.leader.toLowerCase());
        if (leaderId && leaderId !== existingFaction.leader_character_id) {
          updates.leader_character_id = leaderId;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        const { data, error } = await supabase
          .from('factions')
          .update(updates)
          .eq('id', existingFaction.id)
          .select();
        
        if (error) {
          console.error(`Error updating faction (${existingFaction.id}):`, error);
          results.push(existingFaction);
        } else if (data && data.length > 0) {
          results.push(data[0]);
        } else {
          results.push(existingFaction);
        }
      } else {
        results.push(existingFaction);
      }
    } else {
      // Create new faction
      const newFaction = {
        id: uuidv4(),
        name: faction.name,
        description: faction.description,
        faction_type: faction.faction_type || faction.type || 'organization',
        ideology: faction.ideology,
        goals: faction.goals,
        resources: faction.resources,
        story_id: storyId,
        story_world_id: storyWorldId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Handle leader reference if provided
      if (faction.leader && typeof faction.leader === 'string') {
        const leaderId = charNameToId.get(faction.leader.toLowerCase());
        if (leaderId) {
          newFaction.leader_character_id = leaderId;
        }
      }
      
      const { data, error } = await supabase
        .from('factions')
        .insert(newFaction)
        .select();
      
      if (error) {
        console.error('Error creating faction:', error);
      } else if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
  }
  
  return results;
}

/**
 * Helper function to import objects/items
 */
async function importObjects(objects, storyId, storyWorldId, characters, locations) {
  // Check for existing objects to avoid duplicates
  const { data: existingObjects, error } = await supabase
    .from('objects')
    .select('*')
    .eq('story_id', storyId);
  
  if (error) {
    console.error('Error fetching existing objects:', error);
    throw error;
  }
  
  // Create a map of existing object names
  const existingObjectMap = new Map();
  existingObjects.forEach(obj => {
    existingObjectMap.set(obj.name.toLowerCase(), obj);
  });
  
  // Map character/location names to IDs for references
  const charNameToId = new Map();
  characters.forEach(char => charNameToId.set(char.name.toLowerCase(), char.id));
  
  const locNameToId = new Map();
  locations.forEach(loc => locNameToId.set(loc.name.toLowerCase(), loc.id));
  
  // Process objects, resolving entity references
  const results = [];
  
  for (const obj of objects) {
    const existingObject = existingObjectMap.get(obj.name.toLowerCase());
    
    if (existingObject) {
      // Update object if changes needed
      const updates = {
        updated_at: new Date().toISOString()
      };
      
      let hasChanges = false;
      
      // Check each field for potential updates
      ['description', 'significance', 'properties', 'history', 'object_type'].forEach(field => {
        if (obj[field] && obj[field] !== existingObject[field]) {
          updates[field] = obj[field];
          hasChanges = true;
        }
      });
      
      // Handle owner reference if provided
      if (obj.current_owner && typeof obj.current_owner === 'string') {
        const ownerId = charNameToId.get(obj.current_owner.toLowerCase());
        if (ownerId && ownerId !== existingObject.current_owner) {
          updates.current_owner = ownerId;
          hasChanges = true;
        }
      }
      
      // Handle location reference if provided
      if (obj.current_location && typeof obj.current_location === 'string') {
        const locationId = locNameToId.get(obj.current_location.toLowerCase());
        if (locationId && locationId !== existingObject.current_location) {
          updates.current_location = locationId;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        const { data, error } = await supabase
          .from('objects')
          .update(updates)
          .eq('id', existingObject.id)
          .select();
        
        if (error) {
          console.error(`Error updating object (${existingObject.id}):`, error);
          results.push(existingObject);
        } else if (data && data.length > 0) {
          results.push(data[0]);
        } else {
          results.push(existingObject);
        }
      } else {
        results.push(existingObject);
      }
    } else {
      // Create new object
      const newObject = {
        id: uuidv4(),
        name: obj.name,
        description: obj.description,
        significance: obj.significance,
        properties: obj.properties,
        history: obj.history,
        object_type: obj.object_type || obj.type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        created_at: new Date().toISOString()
      };
      
      // Handle owner reference if provided
      if (obj.current_owner && typeof obj.current_owner === 'string') {
        const ownerId = charNameToId.get(obj.current_owner.toLowerCase());
        if (ownerId) {
          newObject.current_owner = ownerId;
        }
      }
      
      // Handle location reference if provided
      if (obj.current_location && typeof obj.current_location === 'string') {
        const locationId = locNameToId.get(obj.current_location.toLowerCase());
        if (locationId) {
          newObject.current_location = locationId;
        }
      }
      
      const { data, error } = await supabase
        .from('objects')
        .insert(newObject)
        .select();
      
      if (error) {
        console.error('Error creating object:', error);
      } else if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
  }
  
  return results;
}

/**
 * Helper function to create junction table entries
 */
async function createJunctionTableEntries(data, storyId, characters, events, plotlines, scenes) {
  // Character-Event relationships
  if (data.characterEvents && data.characterEvents.length > 0) {
    // Map character/event names to IDs
    const charNameToId = new Map();
    characters.forEach(char => charNameToId.set(char.name.toLowerCase(), char.id));
    
    const eventTitleToId = new Map();
    events.forEach(evt => eventTitleToId.set(evt.title.toLowerCase(), evt.id));
    
    // Process character events
    const charEvents = data.characterEvents
      .filter(ce => ce.character && ce.event) // Ensure we have both character and event
      .map(ce => {
        const charId = charNameToId.get(ce.character.toLowerCase());
        const eventId = eventTitleToId.get(ce.event.toLowerCase());
        
        if (!charId || !eventId) {
          console.warn(`Skipping character_event for ${ce.character} and ${ce.event} - entity not found`);
          return null;
        }
        
        return {
          id: uuidv4(),
          character_id: charId,
          event_id: eventId,
          importance: ce.importance || 5,
          experience_type: ce.experience_type || 'active',
          character_sequence_number: ce.character_sequence_number || 0,
          notes: ce.notes,
          created_at: new Date().toISOString()
        };
      })
      .filter(ce => ce !== null);
    
    if (charEvents.length > 0) {
      console.log(`Creating ${charEvents.length} Character-Event relationships`);
      
      // First check for existing relationships to avoid duplicates
      for (const ce of charEvents) {
        const { data: existing, error: checkError } = await supabase
          .from('character_events')
          .select('id')
          .eq('character_id', ce.character_id)
          .eq('event_id', ce.event_id);
        
        if (checkError) {
          console.error('Error checking existing character_event:', checkError);
          continue;
        }
        
        if (existing && existing.length > 0) {
          // Update existing
          const { error: updateError } = await supabase
            .from('character_events')
            .update({
              importance: ce.importance,
              experience_type: ce.experience_type,
              character_sequence_number: ce.character_sequence_number,
              notes: ce.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing[0].id);
          
          if (updateError) {
            console.error(`Error updating character_event (${existing[0].id}):`, updateError);
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from('character_events')
            .insert(ce);
          
          if (insertError) {
            console.error('Error creating character_event:', insertError);
          }
        }
      }
    }
  }
  
  // Plotline-Event relationships
  if (data.plotlineEvents && data.plotlineEvents.length > 0) {
    // Map plotline/event names to IDs
    const plotTitleToId = new Map();
    plotlines.forEach(plot => plotTitleToId.set(plot.title.toLowerCase(), plot.id));
    
    const eventTitleToId = new Map();
    events.forEach(evt => eventTitleToId.set(evt.title.toLowerCase(), evt.id));
    
    // Process plotline events
    const plotEvents = data.plotlineEvents
      .filter(pe => pe.plotline && pe.event) // Ensure we have both plotline and event
      .map(pe => {
        const plotId = plotTitleToId.get(pe.plotline.toLowerCase());
        const eventId = eventTitleToId.get(pe.event.toLowerCase());
        
        if (!plotId || !eventId) {
          console.warn(`Skipping plotline_event for ${pe.plotline} and ${pe.event} - entity not found`);
          return null;
        }
        
        return {
          id: uuidv4(),
          plotline_id: plotId,
          event_id: eventId,
          created_at: new Date().toISOString()
        };
      })
      .filter(pe => pe !== null);
    
    if (plotEvents.length > 0) {
      console.log(`Creating ${plotEvents.length} Plotline-Event relationships`);
      
      // First check for existing relationships to avoid duplicates
      for (const pe of plotEvents) {
        const { data: existing, error: checkError } = await supabase
          .from('plotline_events')
          .select('id')
          .eq('plotline_id', pe.plotline_id)
          .eq('event_id', pe.event_id);
        
        if (checkError) {
          console.error('Error checking existing plotline_event:', checkError);
          continue;
        }
        
        if (existing && existing.length === 0) {
          // Only create if it doesn't exist
          const { error: insertError } = await supabase
            .from('plotline_events')
            .insert(pe);
          
          if (insertError) {
            console.error('Error creating plotline_event:', insertError);
          }
        }
      }
    }
  }
  
  // Event Dependencies
  if (data.eventDependencies && data.eventDependencies.length > 0) {
    // Map event names to IDs
    const eventTitleToId = new Map();
    events.forEach(evt => eventTitleToId.set(evt.title.toLowerCase(), evt.id));
    
    // Process event dependencies
    const dependencies = data.eventDependencies
      .filter(dep => dep.predecessor && dep.successor) // Ensure we have both predecessor and successor
      .map(dep => {
        const predecessorId = eventTitleToId.get(dep.predecessor.toLowerCase());
        const successorId = eventTitleToId.get(dep.successor.toLowerCase());
        
        if (!predecessorId || !successorId) {
          console.warn(`Skipping event dependency for ${dep.predecessor} and ${dep.successor} - event not found`);
          return null;
        }
        
        return {
          id: uuidv4(),
          predecessor_event_id: predecessorId,
          successor_event_id: successorId,
          dependency_type: dep.dependency_type || 'chronological',
          strength: dep.strength || 5,
          notes: dep.notes,
          created_at: new Date().toISOString()
        };
      })
      .filter(dep => dep !== null);
    
    if (dependencies.length > 0) {
      console.log(`Creating ${dependencies.length} Event Dependencies`);
      
      // First check for existing dependencies to avoid duplicates
      for (const dep of dependencies) {
        const { data: existing, error: checkError } = await supabase
          .from('event_dependencies')
          .select('id')
          .eq('predecessor_event_id', dep.predecessor_event_id)
          .eq('successor_event_id', dep.successor_event_id);
        
        if (checkError) {
          console.error('Error checking existing event_dependency:', checkError);
          continue;
        }
        
        if (existing && existing.length > 0) {
          // Update existing
          const { error: updateError } = await supabase
            .from('event_dependencies')
            .update({
              dependency_type: dep.dependency_type,
              strength: dep.strength,
              notes: dep.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing[0].id);
          
          if (updateError) {
            console.error(`Error updating event_dependency (${existing[0].id}):`, updateError);
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from('event_dependencies')
            .insert(dep);
          
          if (insertError) {
            console.error('Error creating event_dependency:', insertError);
          }
        }
      }
    }
  }
  
  // Scene-Character relationships
  if (data.sceneCharacters && data.sceneCharacters.length > 0) {
    // Map character/scene names to IDs
    const charNameToId = new Map();
    characters.forEach(char => charNameToId.set(char.name.toLowerCase(), char.id));
    
    const sceneTitleToId = new Map();
    scenes.forEach(scene => sceneTitleToId.set(scene.title.toLowerCase(), scene.id));
    
    // Process scene characters
    const sceneChars = data.sceneCharacters
      .filter(sc => sc.character && sc.scene) // Ensure we have both character and scene
      .map(sc => {
        const charId = charNameToId.get(sc.character.toLowerCase());
        const sceneId = sceneTitleToId.get(sc.scene.toLowerCase());
        
        if (!charId || !sceneId) {
          console.warn(`Skipping scene_character for ${sc.character} and ${sc.scene} - entity not found`);
          return null;
        }
        
        return {
          id: uuidv4(),
          character_id: charId,
          scene_id: sceneId,
          importance: sc.importance || 'secondary',
          created_at: new Date().toISOString()
        };
      })
      .filter(sc => sc !== null);
    
    if (sceneChars.length > 0) {
      console.log(`Creating ${sceneChars.length} Scene-Character relationships`);
      
      // First check for existing relationships to avoid duplicates
      for (const sc of sceneChars) {
        const { data: existing, error: checkError } = await supabase
          .from('scene_characters')
          .select('id')
          .eq('character_id', sc.character_id)
          .eq('scene_id', sc.scene_id);
        
        if (checkError) {
          console.error('Error checking existing scene_character:', checkError);
          continue;
        }
        
        if (existing && existing.length === 0) {
          // Only create if it doesn't exist
          const { error: insertError } = await supabase
            .from('scene_characters')
            .insert(sc);
          
          if (insertError) {
            console.error('Error creating scene_character:', insertError);
          }
        }
      }
    }
  }
}