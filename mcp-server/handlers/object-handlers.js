// handlers/object-handlers.js
import { supabase } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

// Extend extractObjects function to identify and extract objects/props from the story text
const extractObjects = async (text, storyId, characters = [], locations = []) => {
  // Extract object names and information from text
  const objectMap = new Map();
  
  // Pattern for identifying objects
  // Look for objects introduced with articles or possessive pronouns
  const objPatterns = [
    /\b(?:the|a|an|his|her|their|its)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi,  // Basic pattern with articles
    /\b(?:carried|held|wore|used|found|picked up|discovered|noticed|examined|studied)\s+(?:the|a|an|his|her|their|its)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi,  // Verbs followed by objects
    /\b(?:important|significant|special|magical|powerful|ancient|valuable|mysterious|famous|legendary)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi,  // Adjectives suggesting significance
    /\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*){0,2})\b\s+(?:that|which|was|is|had|has)\s+(?:magical|special|important|significant)/gi  // Capitalized objects with description
  ];
  
  // Apply each pattern
  for (const pattern of objPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const objName = match[1].trim().toLowerCase();
      
      // Skip very common words that are unlikely to be significant objects
      if (objName.length < 3) continue;
      if (/^(the|and|but|one|man|woman|boy|girl|time|day|way|thing|part|kind|sort|such|just|back|good|new|first|last|long|great|little|own|other|old|right|big|high|same|next|early|young|from|this|that|these|those|them|they|with)$/i.test(objName)) continue;
      
      // Look for object in broader context
      const contextRegex = new RegExp(`.{0,100}\\b${objName}\\b.{0,100}`, 'gi');
      const contexts = text.match(contextRegex) || [];
      
      // Check frequency to determine significance
      const frequency = contexts.length;
      if (frequency < 2) continue; // Skip objects mentioned only once
      
      // Extract potential significance, description, etc.
      let description = '';
      let significance = '';
      let properties = '';
      let objectType = 'other';
      let currentLocation = '';
      let currentOwner = '';
      let isMacguffin = false;
      
      for (const context of contexts) {
        // Description extraction
        const descMatch = context.match(new RegExp(`${objName}\\s+(?:was|is|appeared|looked)([^.!?;]*)`)) || [];
        if (descMatch[1] && descMatch[1].length > description.length) {
          description = descMatch[1].trim();
        }
        
        // Significance extraction
        if (/important|significant|crucial|vital|essential|key|central/i.test(context)) {
          significance = context.trim();
          isMacguffin = true;
        }
        
        // Properties extraction
        if (/could|ability|power|function|capable|enabled|allowed|featured/i.test(context)) {
          properties = context.trim();
        }
        
        // Object type detection
        if (/weapon|sword|knife|gun|blade|dagger|axe|bow|spear/i.test(context)) {
          objectType = 'weapon';
        } else if (/tool|device|instrument|apparatus|machine|gadget/i.test(context)) {
          objectType = 'tool';
        } else if (/clothing|garment|robe|hat|cloak|coat|shirt|dress|suit/i.test(context)) {
          objectType = 'clothing';
        } else if (/magic|magical|enchanted|spell|talisman|amulet|potion/i.test(context)) {
          objectType = 'magical';
        } else if (/technology|computer|device|advanced|electronic|digital/i.test(context)) {
          objectType = 'technology';
        } else if (/document|letter|scroll|book|map|journal|diary/i.test(context)) {
          objectType = 'document';
        }
        
        // Location detection
        for (const location of locations) {
          if (new RegExp(`${objName}\\s+(?:in|at|on)\\s+(?:the)?\\s*${location.name}`, 'i').test(context)) {
            currentLocation = location.name;
          }
        }
        
        // Owner detection
        for (const character of characters) {
          if (new RegExp(`${character.name}(?:'s)?\\s+${objName}`, 'i').test(context) || 
              new RegExp(`${objName}\\s+belong(?:ed|s)\\s+to\\s+${character.name}`, 'i').test(context)) {
            currentOwner = character.name;
          }
        }
      }
      
      // Only add if not already in the map or if we have more info
      if (!objectMap.has(objName) || (description && !objectMap.get(objName).description)) {
        objectMap.set(objName, {
          id: uuidv4(),
          name: objName,
          description: description || `Object extracted from text analysis`,
          significance: significance || undefined,
          properties: properties || undefined,
          object_type: objectType,
          current_location: currentLocation || undefined,
          current_owner: currentOwner || undefined,
          story_id: storyId,
          story_world_id: null, // Will be set later if needed
          appearance_count: frequency,
          is_macguffin: isMacguffin,
          tags: [objectType],
          confidence: Math.min(0.4 + (frequency * 0.05), 0.9) // Confidence based on frequency
        });
      }
    }
  }
  
  return Array.from(objectMap.values());
};

// Function to detect object-character relationships
const detectObjectCharacterRelationships = async (objects, characters, text) => {
  const relationships = [];
  
  // Skip if no objects or characters
  if (objects.length === 0 || characters.length === 0) return relationships;
  
  for (const object of objects) {
    for (const character of characters) {
      // Pattern for possession or interaction
      const relationRegex = new RegExp(`.{0,150}\\b${character.name}\\b.{0,30}\\b${object.name}\\b.{0,150}|.{0,150}\\b${object.name}\\b.{0,30}\\b${character.name}\\b.{0,150}`, 'gi');
      const interactions = text.match(relationRegex) || [];
      
      if (interactions.length > 0) {
        // Determine relationship type based on context
        let relationshipType = 'associated';
        let description = '';
        
        for (const interaction of interactions) {
          // Ownership patterns
          if (/\b(?:own|owned|possess|possesses|possessed|belongs to|belonging to|has|had|carries|carried|wore|wears|kept|keeps|bought|purchased|acquired|received|got|given)\b/i.test(interaction)) {
            relationshipType = 'owned';
          }
          // Creation patterns
          else if (/\b(?:made|created|built|constructed|crafted|forged|designed|invented)\b/i.test(interaction)) {
            relationshipType = 'created';
          }
          // Desire patterns
          else if (/\b(?:wants|wanted|desires|desired|seeks|sought|looking for|coveted|covets|searched for|hunted for|pursued)\b/i.test(interaction)) {
            relationshipType = 'desires';
          }
          // Use patterns
          else if (/\b(?:used|uses|utilizing|wielded|wields|activated|activates|operated|operates|employed|employs)\b/i.test(interaction)) {
            relationshipType = 'uses';
          }
          
          // Extract description from the shortest meaningful interaction
          if (!description || (interaction.length < description.length && interaction.length > 30)) {
            description = interaction.trim();
          }
        }
        
        // Create the relationship
        relationships.push({
          id: uuidv4(),
          object_id: object.id,
          character_id: character.id,
          relationship_type: relationshipType,
          description: description.substring(0, 200),
          created_at: new Date().toISOString()
        });
      }
    }
  }
  
  return relationships;
};

// Function to detect object-location relationships
const detectObjectLocationRelationships = async (objects, locations, text) => {
  const relationships = [];
  
  // Skip if no objects or locations
  if (objects.length === 0 || locations.length === 0) return relationships;
  
  for (const object of objects) {
    for (const location of locations) {
      // Pattern for location association
      const relationRegex = new RegExp(`.{0,150}\\b${object.name}\\b.{0,30}\\b(?:in|at|on|inside|within|near|around|throughout|under|above|behind|beside)\\b.{0,10}\\b${location.name}\\b.{0,150}`, 'gi');
      const mentions = text.match(relationRegex) || [];
      
      if (mentions.length > 0) {
        // Determine relationship type based on context
        let relationshipType = 'located';
        let description = '';
        
        for (const mention of mentions) {
          // Storage patterns
          if (/\b(?:stored|kept|placed|stashed|hidden|concealed|deposited)\b/i.test(mention)) {
            relationshipType = 'stored';
          }
          // Origin patterns
          else if (/\b(?:made|created|built|constructed|crafted|forged|designed|invented|originated|comes from)\b/i.test(mention)) {
            relationshipType = 'origin';
          }
          // Hidden patterns
          else if (/\b(?:hidden|concealed|secret|obscured|stashed|buried|disguised)\b/i.test(mention)) {
            relationshipType = 'hidden';
          }
          
          // Extract description from the shortest meaningful interaction
          if (!description || (mention.length < description.length && mention.length > 30)) {
            description = mention.trim();
          }
        }
        
        // Create the relationship
        relationships.push({
          id: uuidv4(),
          object_id: object.id,
          location_id: location.id,
          relationship_type: relationshipType,
          description: description.substring(0, 200),
          created_at: new Date().toISOString()
        });
      }
    }
  }
  
  return relationships;
};

// Create a new object and optionally link it to characters and locations
const createObject = async (args) => {
  try {
    const {
      object_data,
      character_links = [],
      location_links = []
    } = args;
    
    // Generate a new ID if not provided
    const objectId = object_data.id || uuidv4();
    
    // Create the object
    const objectToInsert = {
      id: objectId,
      ...object_data,
      created_at: new Date().toISOString()
    };
    
    const { data: createdObject, error: objectError } = await supabase
      .from('objects')
      .insert(objectToInsert)
      .select()
      .single();
    
    if (objectError) {
      throw objectError;
    }
    
    // Create character relationships if provided
    let objectCharacterRelationships = [];
    if (character_links && character_links.length > 0) {
      const charLinks = character_links.map(link => ({
        id: uuidv4(),
        object_id: objectId,
        character_id: link.character_id,
        relationship_type: link.relationship_type || 'associated',
        description: link.description || undefined,
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedLinks, error: linkError } = await supabase
        .from('object_character_relationships')
        .insert(charLinks)
        .select();
      
      if (linkError) {
        console.error('Error creating character relationships:', linkError);
      } else {
        objectCharacterRelationships = insertedLinks;
      }
    }
    
    // Create location relationships if provided
    let objectLocationRelationships = [];
    if (location_links && location_links.length > 0) {
      const locLinks = location_links.map(link => ({
        id: uuidv4(),
        object_id: objectId,
        location_id: link.location_id,
        relationship_type: link.relationship_type || 'located',
        description: link.description || undefined,
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedLinks, error: linkError } = await supabase
        .from('object_location_relationships')
        .insert(locLinks)
        .select();
      
      if (linkError) {
        console.error('Error creating location relationships:', linkError);
      } else {
        objectLocationRelationships = insertedLinks;
      }
    }
    
    return {
      success: true,
      object: createdObject,
      character_relationships: objectCharacterRelationships,
      location_relationships: objectLocationRelationships
    };
  } catch (error) {
    console.error('Error in createObject:', error);
    throw error;
  }
};

// Link an object to a character
const linkObjectToCharacter = async (args) => {
  try {
    const {
      object_id,
      character_id,
      relationship_type = 'associated',
      description = ''
    } = args;
    
    // First, verify both the object and character exist
    const { data: object, error: objectError } = await supabase
      .from('objects')
      .select('id, name')
      .eq('id', object_id)
      .single();
    
    if (objectError) {
      throw new Error(`Object with ID ${object_id} not found`);
    }
    
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', character_id)
      .single();
    
    if (characterError) {
      throw new Error(`Character with ID ${character_id} not found`);
    }
    
    // Create the relationship
    const relationship = {
      id: uuidv4(),
      object_id,
      character_id,
      relationship_type,
      description: description || `Relationship between ${object.name} and ${character.name}`,
      created_at: new Date().toISOString()
    };
    
    const { data: createdRelationship, error: relationshipError } = await supabase
      .from('object_character_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (relationshipError) {
      throw relationshipError;
    }
    
    return {
      success: true,
      relationship: createdRelationship,
      object,
      character
    };
  } catch (error) {
    console.error('Error in linkObjectToCharacter:', error);
    throw error;
  }
};

// Link an object to a location
const linkObjectToLocation = async (args) => {
  try {
    const {
      object_id,
      location_id,
      relationship_type = 'located',
      description = ''
    } = args;
    
    // First, verify both the object and location exist
    const { data: object, error: objectError } = await supabase
      .from('objects')
      .select('id, name')
      .eq('id', object_id)
      .single();
    
    if (objectError) {
      throw new Error(`Object with ID ${object_id} not found`);
    }
    
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('id', location_id)
      .single();
    
    if (locationError) {
      throw new Error(`Location with ID ${location_id} not found`);
    }
    
    // Create the relationship
    const relationship = {
      id: uuidv4(),
      object_id,
      location_id,
      relationship_type,
      description: description || `${object.name} is ${relationship_type} in ${location.name}`,
      created_at: new Date().toISOString()
    };
    
    const { data: createdRelationship, error: relationshipError } = await supabase
      .from('object_location_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (relationshipError) {
      throw relationshipError;
    }
    
    return {
      success: true,
      relationship: createdRelationship,
      object,
      location
    };
  } catch (error) {
    console.error('Error in linkObjectToLocation:', error);
    throw error;
  }
};

// Track an object's appearance in a scene or event
const trackObjectAppearance = async (args) => {
  try {
    const {
      object_id,
      scene_id = null,
      event_id = null,
      importance = 'secondary',
      description = ''
    } = args;
    
    if (!scene_id && !event_id) {
      throw new Error('Either scene_id or event_id must be provided');
    }
    
    // Verify the object exists
    const { data: object, error: objectError } = await supabase
      .from('objects')
      .select('id, name, appearance_count')
      .eq('id', object_id)
      .single();
    
    if (objectError) {
      throw new Error(`Object with ID ${object_id} not found`);
    }
    
    // Create the appearance record
    const appearance = {
      id: uuidv4(),
      object_id,
      scene_id,
      event_id,
      importance,
      description: description || `${object.name} appears in the ${scene_id ? 'scene' : 'event'}`,
      created_at: new Date().toISOString()
    };
    
    const { data: createdAppearance, error: appearanceError } = await supabase
      .from('object_appearances')
      .insert(appearance)
      .select()
      .single();
    
    if (appearanceError) {
      throw appearanceError;
    }
    
    // Update the object's appearance_count
    const { data: updatedObject, error: updateError } = await supabase
      .from('objects')
      .update({ 
        appearance_count: (object.appearance_count || 0) + 1
      })
      .eq('id', object_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating object appearance count:', updateError);
    }
    
    return {
      success: true,
      appearance: createdAppearance,
      object: updatedObject || object
    };
  } catch (error) {
    console.error('Error in trackObjectAppearance:', error);
    throw error;
  }
};

// Analyze how objects are used throughout a story
const analyzeObjectUsage = async (args) => {
  try {
    const {
      story_id
    } = args;
    
    // Get all objects for the story
    const { data: objects, error: objectsError } = await supabase
      .from('objects')
      .select('*')
      .eq('story_id', story_id);
    
    if (objectsError) {
      throw objectsError;
    }
    
    if (!objects || objects.length === 0) {
      return {
        success: false,
        message: 'No objects found for this story',
        objects: []
      };
    }
    
    // Get object appearances
    const objectIds = objects.map(obj => obj.id);
    const { data: appearances, error: appearancesError } = await supabase
      .from('object_appearances')
      .select('*, scene:scenes(id, title), event:events(id, title, sequence_number)')
      .in('object_id', objectIds);
    
    if (appearancesError) {
      throw appearancesError;
    }
    
    // Get object-character relationships
    const { data: characterRelationships, error: charRelError } = await supabase
      .from('object_character_relationships')
      .select('*, character:characters(id, name, role)')
      .in('object_id', objectIds);
    
    if (charRelError) {
      throw charRelError;
    }
    
    // Get object-location relationships
    const { data: locationRelationships, error: locRelError } = await supabase
      .from('object_location_relationships')
      .select('*, location:locations(id, name, location_type)')
      .in('object_id', objectIds);
    
    if (locRelError) {
      throw locRelError;
    }
    
    // Compile object usage data
    const objectsWithUsage = objects.map(object => {
      const objectAppearances = appearances ? appearances.filter(a => a.object_id === object.id) : [];
      const objectCharRelationships = characterRelationships ? characterRelationships.filter(r => r.object_id === object.id) : [];
      const objectLocRelationships = locationRelationships ? locationRelationships.filter(r => r.object_id === object.id) : [];
      
      // Determine the progression of object appearances through the story
      const eventAppearances = objectAppearances
        .filter(a => a.event_id)
        .map(a => ({
          event_id: a.event_id,
          event_title: a.event.title,
          sequence_number: a.event.sequence_number,
          importance: a.importance
        }))
        .sort((a, b) => a.sequence_number - b.sequence_number);
      
      // Identify potential character arcs involving this object
      const characterArcs = [];
      for (const charRel of objectCharRelationships) {
        const charEvents = eventAppearances.filter(ea => 
          appearances.some(a => 
            a.event_id === ea.event_id && 
            characterRelationships.some(cr => 
              cr.character_id === charRel.character_id && 
              cr.object_id === object.id
            )
          )
        );
        
        if (charEvents.length >= 2) {
          characterArcs.push({
            character_id: charRel.character_id,
            character_name: charRel.character.name,
            relationship_type: charRel.relationship_type,
            event_count: charEvents.length,
            first_appearance: charEvents[0],
            last_appearance: charEvents[charEvents.length - 1]
          });
        }
      }
      
      return {
        id: object.id,
        name: object.name,
        description: object.description,
        object_type: object.object_type,
        is_macguffin: object.is_macguffin,
        appearance_count: objectAppearances.length,
        appearances: {
          scenes: objectAppearances.filter(a => a.scene_id).length,
          events: objectAppearances.filter(a => a.event_id).length,
          progression: eventAppearances
        },
        relationships: {
          characters: objectCharRelationships.map(r => ({
            character_id: r.character_id,
            character_name: r.character.name,
            character_role: r.character.role,
            relationship_type: r.relationship_type
          })),
          locations: objectLocRelationships.map(r => ({
            location_id: r.location_id,
            location_name: r.location.name,
            location_type: r.location.location_type,
            relationship_type: r.relationship_type
          }))
        },
        character_arcs: characterArcs
      };
    });
    
    return {
      success: true,
      story_id,
      object_count: objects.length,
      objects: objectsWithUsage
    };
  } catch (error) {
    console.error('Error in analyzeObjectUsage:', error);
    throw error;
  }
};

export default {
  createObject,
  linkObjectToCharacter,
  linkObjectToLocation,
  trackObjectAppearance,
  analyzeObjectUsage,
  extractObjects,
  detectObjectCharacterRelationships,
  detectObjectLocationRelationships
};