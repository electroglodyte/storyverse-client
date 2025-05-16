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

// Modify the existing analyzeStory function to include object extraction
const analyzeStory = async (args) => {
  try {
    const {
      story_text,
      story_title,
      options = {}
    } = args;
    
    const {
      create_project = true,
      story_id = null,
      story_world_id = null,
      extract_characters = true,
      extract_locations = true,
      extract_events = true,
      extract_objects = true,
      extract_relationships = true,
      interactive_mode = true,
      resolution_threshold = 0.7
    } = options;
    
    // Step 1: Initialize project if needed
    const storyId = create_project || !story_id 
      ? await createOrGetStory(story_title, story_world_id)
      : story_id;
    
    // Step 2: Initial text processing
    const processedText = preprocessText(story_text);
    
    // Step 3: Entity extraction
    let extractedCharacters = [];
    let extractedLocations = [];
    let extractedEvents = [];
    let extractedObjects = [];
    let extractedPlotlines = [];
    
    if (extract_characters) {
      console.log('Extracting characters...');
      extractedCharacters = await extractCharacters(processedText, storyId);
      
      // Store characters in database
      if (extractedCharacters.length > 0) {
        await storeEntities(extractedCharacters, 'characters');
      }
    }
    
    if (extract_locations) {
      console.log('Extracting locations...');
      extractedLocations = await extractLocations(processedText, storyId);
      
      // Store locations in database
      if (extractedLocations.length > 0) {
        await storeEntities(extractedLocations, 'locations');
      }
    }
    
    if (extract_objects) {
      console.log('Extracting objects...');
      extractedObjects = await extractObjects(processedText, storyId, extractedCharacters, extractedLocations);
      
      // Store objects in database
      if (extractedObjects.length > 0) {
        await storeEntities(extractedObjects, 'objects');
      }
    }
    
    if (extract_events) {
      console.log('Extracting events...');
      extractedEvents = await extractEvents(processedText, storyId, extractedCharacters, extractedLocations);
      
      // Store events in database
      if (extractedEvents.length > 0) {
        const eventsToStore = extractedEvents.map(event => {
          const { involved_characters, locations, ...eventData } = event;
          return eventData;
        });
        
        await storeEntities(eventsToStore, 'events');
        
        // Store character-event relationships
        for (const event of extractedEvents) {
          if (event.involved_characters && event.involved_characters.length > 0) {
            const characterEvents = event.involved_characters.map(ce => ({
              id: uuidv4(),
              character_id: ce.character_id,
              event_id: event.id,
              importance: ce.importance,
              experience_type: ce.experience_type,
              character_sequence_number: 10, // Default value
              created_at: new Date().toISOString()
            }));
            
            await storeEntities(characterEvents, 'character_events');
          }
        }
        
        // Track objects in events
        if (extractedObjects.length > 0) {
          // For each event, check if objects are mentioned
          for (const event of extractedEvents) {
            const objectAppearances = [];
            
            for (const object of extractedObjects) {
              // Check if the object is mentioned in this event
              if (event.description && new RegExp(`\\b${object.name}\\b`, 'i').test(event.description)) {
                objectAppearances.push({
                  id: uuidv4(),
                  object_id: object.id,
                  event_id: event.id,
                  importance: event.description.toLowerCase().split(object.name.toLowerCase()).length > 2 ? 'primary' : 'secondary',
                  description: `${object.name} appears in event: ${event.title}`,
                  created_at: new Date().toISOString()
                });
              }
            }
            
            if (objectAppearances.length > 0) {
              await storeEntities(objectAppearances, 'object_appearances');
            }
          }
        }
      }
    }
    
    // Step 4: Relationship detection
    let characterRelationships = [];
    let objectCharacterRelationships = [];
    let objectLocationRelationships = [];
    let eventDependencies = [];
    
    if (extract_relationships) {
      console.log('Detecting character relationships...');
      characterRelationships = await detectCharacterRelationships(extractedCharacters, processedText);
      
      // Store character relationships
      if (characterRelationships.length > 0) {
        const relationshipsToStore = characterRelationships.map(rel => {
          const { interaction_count, ...relData } = rel;
          return {
            ...relData,
            story_id: storyId
          };
        });
        
        await storeEntities(relationshipsToStore, 'character_relationships');
      }
      
      // Detect and store object-character relationships
      if (extractedObjects.length > 0 && extractedCharacters.length > 0) {
        console.log('Detecting object-character relationships...');
        objectCharacterRelationships = await detectObjectCharacterRelationships(extractedObjects, extractedCharacters, processedText);
        
        if (objectCharacterRelationships.length > 0) {
          await storeEntities(objectCharacterRelationships, 'object_character_relationships');
        }
      }
      
      // Detect and store object-location relationships
      if (extractedObjects.length > 0 && extractedLocations.length > 0) {
        console.log('Detecting object-location relationships...');
        objectLocationRelationships = await detectObjectLocationRelationships(extractedObjects, extractedLocations, processedText);
        
        if (objectLocationRelationships.length > 0) {
          await storeEntities(objectLocationRelationships, 'object_location_relationships');
        }
      }
      
      console.log('Detecting event dependencies...');
      eventDependencies = await detectEventDependencies(extractedEvents);
      
      // Store event dependencies
      if (eventDependencies.length > 0) {
        await storeEntities(eventDependencies, 'event_dependencies');
      }
      
      // Detect and store plotlines
      console.log('Detecting plotlines...');
      extractedPlotlines = await detectStorylines(extractedEvents, extractedCharacters, storyId);
      
      if (extractedPlotlines.length > 0) {
        // Separate plotline_events many-to-many relationships
        const plotlinesToStore = extractedPlotlines.map(plotline => {
          const { events, characters, ...plotlineData } = plotline;
          return plotlineData;
        });
        
        await storeEntities(plotlinesToStore, 'plotlines');
        
        // Store plotline-event relationships
        for (const plotline of extractedPlotlines) {
          if (plotline.events && plotline.events.length > 0) {
            const plotlineEvents = plotline.events.map(eventId => ({
              id: uuidv4(),
              plotline_id: plotline.id,
              event_id: eventId,
              created_at: new Date().toISOString()
            }));
            
            await storeEntities(plotlineEvents, 'plotline_events');
          }
          
          // Store plotline-character relationships
          if (plotline.characters && plotline.characters.length > 0) {
            const plotlineCharacters = plotline.characters.map(charId => ({
              id: uuidv4(),
              plotline_id: plotline.id,
              character_id: charId,
              created_at: new Date().toISOString()
            }));
            
            await storeEntities(plotlineCharacters, 'plotline_characters');
          }
        }
      }
    }
    
    return {
      success: true,
      story_id: storyId,
      title: story_title,
      characters: extractedCharacters,
      locations: extractedLocations,
      objects: extractedObjects,
      events: extractedEvents.map(event => {
        const { involved_characters, locations, ...eventData } = event;
        return eventData;
      }),
      relationships: {
        character_relationships: characterRelationships,
        object_character_relationships: objectCharacterRelationships,
        object_location_relationships: objectLocationRelationships
      },
      dependencies: eventDependencies,
      plotlines: extractedPlotlines
    };
  } catch (error) {
    console.error('Error in analyzeStory:', error);
    throw error;
  }
};