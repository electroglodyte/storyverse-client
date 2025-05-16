// Import object handlers
import objectHandlers from './object-handlers.js';

// Enhance the analyzeStory function to include object detection
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
      extractedObjects = await objectHandlers.extractObjects(processedText, storyId, extractedCharacters, extractedLocations);
      
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
        objectCharacterRelationships = await objectHandlers.detectObjectCharacterRelationships(extractedObjects, extractedCharacters, processedText);
        
        if (objectCharacterRelationships.length > 0) {
          await storeEntities(objectCharacterRelationships, 'object_character_relationships');
        }
      }
      
      // Detect and store object-location relationships
      if (extractedObjects.length > 0 && extractedLocations.length > 0) {
        console.log('Detecting object-location relationships...');
        objectLocationRelationships = await objectHandlers.detectObjectLocationRelationships(extractedObjects, extractedLocations, processedText);
        
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