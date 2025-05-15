import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request data
    const requestBody = await req.json();
    const { story_text, story_title, story_world_id, options = {} } = requestBody;
    
    // Debug mode
    const debugMode = options.debug || false;
    let debugInfo = {};
    
    // Log incoming request if in debug mode
    if (debugMode) {
      console.log("Request received for analyze-story:");
      console.log(`Story title: ${story_title}`);
      console.log(`Text length: ${story_text?.length || 0} characters`);
      console.log(`Options:`, options);
      
      // Add to debug info
      debugInfo.request = {
        title: story_title,
        textLength: story_text?.length || 0,
        options: {...options, story_text: undefined} // Don't include full text in debug
      };
    }
    
    if (!story_text) {
      const errorMessage = 'Story text is required';
      if (debugMode) console.log(`Error: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          debug: debugMode ? debugInfo : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate text length
    if (story_text.trim().length < 50) {
      const errorMessage = 'Story text is too short for meaningful analysis (min 50 characters)';
      if (debugMode) console.log(`Error: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          debug: debugMode ? debugInfo : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (debugMode) {
      console.log("Supabase client created, starting extraction process");
    }
    
    // Extract narrative elements from text
    const extractedElements = await extractNarrativeElements(story_text, { 
      debug: debugMode,
      debugInfo
    });
    
    if (debugMode) {
      console.log("Extraction complete, results:", {
        characters: extractedElements.characters.length,
        locations: extractedElements.locations.length,
        scenes: extractedElements.scenes?.length || 0,
        events: extractedElements.events.length,
        plotlines: extractedElements.plotlines?.length || 0
      });
      
      // Add to debug info
      debugInfo.extractionResults = {
        characters: extractedElements.characters.length,
        locations: extractedElements.locations.length,
        scenes: extractedElements.scenes?.length || 0,
        events: extractedElements.events.length,
        plotlines: extractedElements.plotlines?.length || 0
      };
    }
    
    // Create or update story in database if specified
    let storyId = null;
    if (options.create_project) {
      // Use provided story ID or create a new one
      storyId = options.story_id;
      
      if (!storyId) {
        if (debugMode) console.log("Creating new story in database");
        
        const { data: story, error: storyError } = await supabaseClient
          .from('stories')
          .insert({
            name: story_title,
            title: story_title,
            synopsis: extractedElements.synopsis || getShortSynopsis(story_text),
            description: story_text.length > 1000 ? story_text.substring(0, 1000) + '...' : story_text,
            story_world_id: story_world_id
          })
          .select('id')
          .single();
        
        if (storyError) {
          const errorMessage = `Failed to create story: ${storyError.message}`;
          if (debugMode) console.log(`Error: ${errorMessage}`);
          
          throw new Error(errorMessage);
        }
        
        storyId = story?.id;
        if (debugMode) console.log(`Created story with ID: ${storyId}`);
      } else {
        if (debugMode) console.log(`Using provided story ID: ${storyId}`);
      }
      
      // Process extraction options
      const shouldExtractCharacters = options.extract_characters !== false;
      const shouldExtractLocations = options.extract_locations !== false;
      const shouldExtractEvents = options.extract_events !== false;
      const shouldExtractScenes = options.extract_scenes !== false;
      const shouldExtractPlotlines = options.extract_plotlines !== false;
      const shouldExtractRelationships = options.extract_relationships !== false;
      const shouldExtractDependencies = options.extract_dependencies !== false;
      const shouldExtractArcs = options.extract_arcs !== false;
      
      // Store extracted elements in database - record results in debug
      const dbResults = {
        characters: 0,
        locations: 0,
        events: 0,
        scenes: 0,
        plotlines: 0,
        relationships: 0,
        dependencies: 0,
        arcs: 0
      };
      
      try {
        // Store characters
        if (shouldExtractCharacters && extractedElements.characters.length > 0) {
          const { data, error } = await storeCharacters(supabaseClient, storyId, extractedElements.characters);
          if (error) {
            console.error(`Error storing characters:`, error);
            if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, characters: error.message };
          } else {
            dbResults.characters = data?.length || 0;
            if (debugMode) console.log(`Stored ${data?.length || 0} characters`);
          }
        }
        
        // Store locations
        if (shouldExtractLocations && extractedElements.locations.length > 0) {
          const { data, error } = await storeLocations(supabaseClient, storyId, extractedElements.locations);
          if (error) {
            console.error(`Error storing locations:`, error);
            if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, locations: error.message };
          } else {
            dbResults.locations = data?.length || 0;
            if (debugMode) console.log(`Stored ${data?.length || 0} locations`);
          }
        }
        
        // Store events
        if (shouldExtractEvents && extractedElements.events.length > 0) {
          const { data, error } = await storeEvents(supabaseClient, storyId, extractedElements.events);
          if (error) {
            console.error(`Error storing events:`, error);
            if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, events: error.message };
          } else {
            dbResults.events = data?.length || 0;
            if (debugMode) console.log(`Stored ${data?.length || 0} events`);
          }
        }
        
        // Store scenes
        if (shouldExtractScenes && extractedElements.scenes && extractedElements.scenes.length > 0) {
          const { data, error } = await storeScenes(supabaseClient, storyId, extractedElements.scenes);
          if (error) {
            console.error(`Error storing scenes:`, error);
            if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, scenes: error.message };
          } else {
            dbResults.scenes = data?.length || 0;
            if (debugMode) console.log(`Stored ${data?.length || 0} scenes`);
          }
        }
        
        // Store plotlines
        if (shouldExtractPlotlines && extractedElements.plotlines && extractedElements.plotlines.length > 0) {
          const { data, error } = await storePlotlines(supabaseClient, storyId, extractedElements.plotlines);
          if (error) {
            console.error(`Error storing plotlines:`, error);
            if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, plotlines: error.message };
          } else {
            dbResults.plotlines = data?.length || 0;
            if (debugMode) console.log(`Stored ${data?.length || 0} plotlines`);
          }
        }
        
        // Store character relationships
        if (shouldExtractRelationships && extractedElements.characterRelationships && extractedElements.characterRelationships.length > 0) {
          // We need to fetch character IDs to map names to IDs
          const { data: characterData } = await supabaseClient
            .from('characters')
            .select('id, name')
            .eq('story_id', storyId);
          
          if (characterData && characterData.length > 0) {
            const characterMap = {};
            characterData.forEach(char => {
              characterMap[char.name] = char.id;
            });
            
            const relationshipsToInsert = extractedElements.characterRelationships.filter(rel => 
              rel.character1_name && rel.character2_name && 
              characterMap[rel.character1_name] && characterMap[rel.character2_name]
            ).map(rel => ({
              character1_id: characterMap[rel.character1_name],
              character2_id: characterMap[rel.character2_name],
              relationship_type: rel.relationship_type || 'other',
              description: rel.description || '',
              intensity: rel.intensity || 5,
              story_id: storyId
            }));
            
            if (relationshipsToInsert.length > 0) {
              const { data, error } = await supabaseClient
                .from('character_relationships')
                .insert(relationshipsToInsert)
                .select();
              
              if (error) {
                console.error(`Error storing character relationships:`, error);
                if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, relationships: error.message };
              } else {
                dbResults.relationships = data?.length || 0;
                if (debugMode) console.log(`Stored ${data?.length || 0} character relationships`);
              }
            }
          }
        }
        
        // Store event dependencies
        if (shouldExtractDependencies && extractedElements.eventDependencies && extractedElements.eventDependencies.length > 0) {
          // We need to fetch event IDs to map sequence numbers to IDs
          const { data: eventData } = await supabaseClient
            .from('events')
            .select('id, sequence_number')
            .eq('story_id', storyId);
          
          if (eventData && eventData.length > 0) {
            const eventMap = {};
            eventData.forEach(evt => {
              if (evt.sequence_number) {
                eventMap[evt.sequence_number] = evt.id;
              }
            });
            
            const dependenciesToInsert = extractedElements.eventDependencies.filter(dep => 
              dep.predecessor_sequence && dep.successor_sequence && 
              eventMap[dep.predecessor_sequence] && eventMap[dep.successor_sequence]
            ).map(dep => ({
              predecessor_event_id: eventMap[dep.predecessor_sequence],
              successor_event_id: eventMap[dep.successor_sequence],
              dependency_type: dep.dependency_type || 'chronological',
              strength: dep.strength || 5,
              notes: dep.notes || ''
            }));
            
            if (dependenciesToInsert.length > 0) {
              const { data, error } = await supabaseClient
                .from('event_dependencies')
                .insert(dependenciesToInsert)
                .select();
              
              if (error) {
                console.error(`Error storing event dependencies:`, error);
                if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, dependencies: error.message };
              } else {
                dbResults.dependencies = data?.length || 0;
                if (debugMode) console.log(`Stored ${data?.length || 0} event dependencies`);
              }
            }
          }
        }
        
        // Store character arcs
        if (shouldExtractArcs && extractedElements.characterArcs && extractedElements.characterArcs.length > 0) {
          // We need to fetch character IDs to map names to IDs
          const { data: characterData } = await supabaseClient
            .from('characters')
            .select('id, name')
            .eq('story_id', storyId);
          
          if (characterData && characterData.length > 0) {
            const characterMap = {};
            characterData.forEach(char => {
              characterMap[char.name] = char.id;
            });
            
            const arcsToInsert = extractedElements.characterArcs.filter(arc => 
              arc.character_name && characterMap[arc.character_name]
            ).map(arc => ({
              character_id: characterMap[arc.character_name],
              story_id: storyId,
              title: arc.title || `${arc.character_name}'s Arc`,
              description: arc.description || '',
              starting_state: arc.starting_state || '',
              ending_state: arc.ending_state || ''
            }));
            
            if (arcsToInsert.length > 0) {
              const { data, error } = await supabaseClient
                .from('character_arcs')
                .insert(arcsToInsert)
                .select();
              
              if (error) {
                console.error(`Error storing character arcs:`, error);
                if (debugMode) debugInfo.dbErrors = { ...debugInfo.dbErrors, arcs: error.message };
              } else {
                dbResults.arcs = data?.length || 0;
                if (debugMode) console.log(`Stored ${data?.length || 0} character arcs`);
              }
            }
          }
        }
        
        // Add database results to debug info
        if (debugMode) debugInfo.dbResults = dbResults;
        
      } catch (dbError) {
        console.error("Error storing elements in database:", dbError);
        if (debugMode) debugInfo.dbError = dbError.message;
      }
    }
    
    // In debug mode, add timing information
    if (debugMode) {
      debugInfo.timing = {
        extractionCompleted: new Date().toISOString()
      };
    }
    
    // Prepare response
    const response = {
      success: true,
      story_id: storyId,
      title: story_title,
      ...extractedElements
    };
    
    // Add debug info if requested
    if (debugMode) {
      response.debug = debugInfo;
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Main function to extract all narrative elements from text
async function extractNarrativeElements(text, options = {}) {
  const debugMode = options.debug || false;
  const debugInfo = options.debugInfo || {};
  
  // Capture timing information if in debug mode
  let timingInfo = {};
  if (debugMode) {
    timingInfo.startTime = new Date().toISOString();
  }
  
  // 1. Detect text format (screenplay, novel, etc.)
  const textFormat = detectTextFormat(text);
  if (debugMode) {
    console.log(`Detected text format: ${textFormat}`);
    timingInfo.formatDetected = new Date().toISOString();
  }
  
  // 2. Preprocess text based on format
  const processedText = preprocessText(text, textFormat);
  if (debugMode) {
    timingInfo.preprocessingCompleted = new Date().toISOString();
  }
  
  // 3. Extract characters using comprehensive approach
  const characters = extractCharacters(processedText, textFormat);
  if (debugMode) {
    console.log(`Extracted ${characters.length} characters`);
    timingInfo.charactersExtracted = new Date().toISOString();
    
    // Debug info for characters
    let characterDetails = [];
    for (const char of characters.slice(0, 5)) { // Log first 5 for brevity
      characterDetails.push({
        name: char.name,
        role: char.role,
        confidence: char.confidence,
        appearances: char.appearances
      });
    }
    debugInfo.characters = characterDetails;
  }
  
  // 4. Extract locations
  const locations = extractLocations(processedText, textFormat);
  if (debugMode) {
    console.log(`Extracted ${locations.length} locations`);
    timingInfo.locationsExtracted = new Date().toISOString();
    
    // Debug info for locations
    let locationDetails = [];
    for (const loc of locations.slice(0, 5)) { // Log first 5 for brevity
      locationDetails.push({
        name: loc.name,
        type: loc.location_type,
        confidence: loc.confidence,
        appearances: loc.appearances
      });
    }
    debugInfo.locations = locationDetails;
  }
  
  // 5. Split text into scenes/sections
  const scenes = extractScenes(processedText, textFormat);
  if (debugMode) {
    console.log(`Extracted ${scenes.length} scenes`);
    timingInfo.scenesExtracted = new Date().toISOString();
    
    // Debug info for scenes
    debugInfo.scenes = {
      count: scenes.length,
      types: {}
    };
    scenes.forEach(scene => {
      debugInfo.scenes.types[scene.type] = (debugInfo.scenes.types[scene.type] || 0) + 1;
    });
  }
  
  // 6. Extract events from scenes
  const events = extractEvents(scenes, characters, locations);
  if (debugMode) {
    console.log(`Extracted ${events.length} events`);
    timingInfo.eventsExtracted = new Date().toISOString();
  }
  
  // 7. Detect character relationships
  const characterRelationships = identifyCharacterRelationships(processedText, characters);
  if (debugMode) {
    console.log(`Identified ${characterRelationships.length} character relationships`);
    timingInfo.relationshipsIdentified = new Date().toISOString();
  }
  
  // 8. Identify plotlines
  const plotlines = identifyPlotlines(events, characters);
  if (debugMode) {
    console.log(`Identified ${plotlines.length} plotlines`);
    timingInfo.plotlinesIdentified = new Date().toISOString();
  }
  
  // 9. Identify event dependencies
  const eventDependencies = identifyEventDependencies(events);
  if (debugMode) {
    console.log(`Identified ${eventDependencies.length} event dependencies`);
    timingInfo.dependenciesIdentified = new Date().toISOString();
  }
  
  // 10. Create character arcs
  const characterArcs = identifyCharacterArcs(events, characters, characterRelationships);
  if (debugMode) {
    console.log(`Created ${characterArcs.length} character arcs`);
    timingInfo.arcsIdentified = new Date().toISOString();
  }
  
  // 11. Generate synopsis
  const synopsis = generateSynopsis(events, characters, plotlines);
  if (debugMode) {
    console.log('Generated synopsis');
    timingInfo.synopsisGenerated = new Date().toISOString();
  }
  
  // Add timing info to debug info
  if (debugMode) {
    debugInfo.timing = timingInfo;
  }
  
  return {
    characters,
    locations,
    scenes,
    events,
    plotlines,
    characterRelationships,
    eventDependencies,
    characterArcs,
    synopsis,
    text_format: textFormat,
    debug_info: debugMode ? debugInfo : undefined
  };
}

// Detect the format of the text (screenplay, novel, etc.)
function detectTextFormat(text) {
  // Check for screenplay format patterns
  const screenplayIndicators = [
    /^INT\./m,       // Interior scene heading
    /^EXT\./m,       // Exterior scene heading
    /^FADE IN:/m,    // Common screenplay direction
    /^CUT TO:/m,     // Common screenplay direction
    /^[A-Z\s]+$/m,   // Character names in all caps
  ];
  
  let screenplayScore = 0;
  screenplayIndicators.forEach(pattern => {
    if (pattern.test(text)) screenplayScore++;
  });
  
  // Check for novel format patterns
  const novelIndicators = [
    /Chapter \d+/i,           // Chapter headings
    /[\"'].*?[\"'].*?said/,     // Dialogue attribution
    /\n\n/g,                  // Multiple paragraph breaks
  ];
  
  let novelScore = 0;
  novelIndicators.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) novelScore += matches.length > 10 ? 2 : 1;
  });
  
  // Check for fountain screenplay format
  if (text.includes('Title:') && text.includes('Author:') && (text.includes('INT.') || text.includes('EXT.'))) {
    return 'fountain';
  }
  
  if (screenplayScore >= 3) return 'screenplay';
  if (novelScore >= novelScore && novelScore > 0) return 'novel';
  
  return 'general'; // Default
}

// Preprocess text based on its format
function preprocessText(text, format) {
  // Basic cleanup
  let processed = text.replace(/\r\n/g, '\n'); // Normalize line endings
  
  // Format-specific preprocessing
  if (format === 'screenplay' || format === 'fountain') {
    // Split into lines and handle scene headings
    const lines = processed.split('\n');
    // Additional screenplay-specific processing could go here
    return lines.join('\n');
  }
  
  return processed;
}

// Extract characters from text using a comprehensive approach
function extractCharacters(text, format) {
  const characters = [];
  const potentialCharacters = new Map(); // name -> confidence score
  
  // Use different extraction strategies based on format
  if (format === 'screenplay' || format === 'fountain') {
    extractScreenplayCharacters(text, potentialCharacters);
  } else {
    extractNovelCharacters(text, potentialCharacters);
  }
  
  // Filter out common false positives
  const falsePositives = ['INT', 'EXT', 'FADE', 'CUT', 'THE', 'NIGHT', 'DAY', 'MORNING', 'EVENING', 
                          'AFTERNOON', 'CHAPTER', 'ACT', 'SCENE', 'END', 'BEGIN', 'START',
                          'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  
  falsePositives.forEach(fp => {
    potentialCharacters.delete(fp);
  });
  
  // Filter by confidence threshold and convert to character objects
  for (const [name, data] of potentialCharacters.entries()) {
    if (data.confidence >= 0.5) {
      characters.push({
        name,
        role: determineCharacterRole(name, text, data.appearances),
        confidence: data.confidence,
        appearances: data.appearances,
        description: data.description || generateCharacterDescription(text, name, data.mentions)
      });
    }
  }
  
  // Sort by appearances (descending)
  return characters.sort((a, b) => b.appearances - a.appearances);
}

// Extract characters from screenplay format
function extractScreenplayCharacters(text, potentialCharacters) {
  // Look for character names in screenplay format (ALL CAPS followed by dialogue)
  const lines = text.split('\n');
  let previousLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Character name pattern: ALL CAPS line by itself, possibly with (O.S.) or (V.O.)
    if (/^[A-Z][A-Z\s',.]+(\\([A-Z.]+\\))?$/.test(line) && line.length < 50) {
      const name = line.split('(')[0].trim();
      
      // Verify it's likely a character by checking if next line could be dialogue
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (nextLine && !nextLine.startsWith('INT.') && !nextLine.startsWith('EXT.') && 
          !/^[A-Z][A-Z\s]+$/.test(nextLine)) {
        
        // Add or update character
        if (!potentialCharacters.has(name)) {
          potentialCharacters.set(name, { 
            confidence: 0.8, 
            appearances: 1,
            mentions: [{ text: nextLine, context: previousLine }]
          });
        } else {
          const char = potentialCharacters.get(name);
          char.appearances++;
          char.confidence = Math.min(char.confidence + 0.05, 0.95);
          char.mentions = char.mentions || [];
          char.mentions.push({ text: nextLine, context: previousLine });
          potentialCharacters.set(name, char);
        }
      }
    }
    
    previousLine = line;
  }
}

// Extract characters from novel format
function extractNovelCharacters(text, potentialCharacters) {
  // 1. Look for names in dialogue attribution
  const dialoguePattern = /[\"'].*?[\"'].*?(said|asked|replied|shouted|whispered|murmured|exclaimed) ([A-Z][a-z]+)/g;
  let match;
  
  while ((match = dialoguePattern.exec(text)) !== null) {
    const name = match[2];
    if (!potentialCharacters.has(name)) {
      potentialCharacters.set(name, { 
        confidence: 0.7, 
        appearances: 1,
        mentions: [{ text: match[0], context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50) }]
      });
    } else {
      const char = potentialCharacters.get(name);
      char.appearances++;
      char.confidence = Math.min(char.confidence + 0.05, 0.9);
      char.mentions = char.mentions || [];
      char.mentions.push({ 
        text: match[0], 
        context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50) 
      });
      potentialCharacters.set(name, char);
    }
  }
  
  // 2. Look for consistent capitalized names (proper nouns)
  const properNounPattern = /\b([A-Z][a-z]+)\b/g;
  const properNouns = {};
  
  while ((match = properNounPattern.exec(text)) !== null) {
    const name = match[1];
    // Skip common non-character proper nouns
    if (['The', 'I', 'A', 'Mr', 'Mrs', 'Ms', 'Dr', 'Sir'].includes(name)) continue;
    
    properNouns[name] = (properNouns[name] || 0) + 1;
  }
  
  // Consider proper nouns that appear multiple times
  for (const [name, count] of Object.entries(properNouns)) {
    if (count >= 3) {
      if (!potentialCharacters.has(name)) {
        potentialCharacters.set(name, { 
          confidence: 0.6, 
          appearances: count,
          mentions: []
        });
      } else {
        const char = potentialCharacters.get(name);
        char.appearances += count;
        potentialCharacters.set(name, char);
      }
    }
  }
  
  // 3. Look for pronouns and actions near potential character names to gather context
  for (const [name, data] of potentialCharacters.entries()) {
    const namePattern = new RegExp(`\\b${name}\\b[^.!?]*?\\b(he|she|they|his|her|their|him|himself|herself|themselves)\\b`, 'gi');
    const actionPattern = new RegExp(`\\b${name}\\b[^.!?]*?\\b(walked|ran|looked|turned|smiled|frowned|sighed|laughed|cried|spoke|thought|felt)\\b`, 'gi');
    
    // Collect mentions for context
    while ((match = namePattern.exec(text)) !== null) {
      if (!data.mentions) data.mentions = [];
      data.mentions.push({ 
        text: match[0], 
        context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50) 
      });
    }
    
    while ((match = actionPattern.exec(text)) !== null) {
      if (!data.mentions) data.mentions = [];
      data.mentions.push({ 
        text: match[0], 
        context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50) 
      });
    }
  }
}

// Determine character role based on appearances and context
function determineCharacterRole(name, text, appearances) {
  // Simple heuristic: character with most appearances is likely protagonist
  // A more sophisticated implementation would analyze narrative centrality
  
  // Check for antagonist indicators in context
  const antagonistIndicators = [
    new RegExp(`${name}.*?enemy`, 'i'),
    new RegExp(`${name}.*?villain`, 'i'),
    new RegExp(`${name}.*?evil`, 'i'),
    new RegExp(`${name}.*?oppose`, 'i'),
    new RegExp(`against.*?${name}`, 'i'),
    new RegExp(`fight.*?${name}`, 'i')
  ];
  
  for (const pattern of antagonistIndicators) {
    if (pattern.test(text)) {
      return 'antagonist';
    }
  }
  
  // Placeholder for more sophisticated role detection
  if (appearances > 20) return 'protagonist';
  if (appearances > 10) return 'supporting';
  return 'background';
}

// Generate a character description based on context
function generateCharacterDescription(text, name, mentions) {
  if (!mentions || mentions.length === 0) {
    return `A character named ${name} in the story.`;
  }
  
  // Extract descriptive phrases about the character
  const descriptions = [];
  const physicalTraits = [];
  const personalityTraits = [];
  const actions = [];
  
  // Physical appearance indicators
  const physicalPatterns = [
    new RegExp(`${name}.*?was (a|an) ([^.,;!?]*)`, 'i'),
    new RegExp(`${name}[^.!?]*?(tall|short|young|old|beautiful|handsome|thin|fat|slender|muscular)`, 'i'),
    new RegExp(`${name}[^.!?]*?(hair|eyes|face|skin|body|wearing|dressed)`, 'i')
  ];
  
  // Personality indicators
  const personalityPatterns = [
    new RegExp(`${name}[^.!?]*?(kind|cruel|gentle|harsh|smart|dumb|clever|stupid|brave|cowardly|bold|timid|friendly|hostile)`, 'i'),
    new RegExp(`${name}[^.!?]*?(personality|character|nature|temperament)`, 'i'),
    new RegExp(`${name} (was|seemed|appeared|looked) ([^.,;!?]*)`, 'i')
  ];
  
  // Action indicators
  const actionPatterns = [
    new RegExp(`${name} (said|spoke|talked|shouted|whispered|murmured)`, 'i'),
    new RegExp(`${name} (walked|ran|moved|jumped|sat|stood)`, 'i'),
    new RegExp(`${name} (thought|felt|believed|wanted|needed|desired)`, 'i')
  ];
  
  for (const mention of mentions) {
    const context = mention.context || mention.text;
    
    // Check for physical descriptions
    for (const pattern of physicalPatterns) {
      const match = pattern.exec(context);
      if (match && match[0]) {
        physicalTraits.push(match[0]);
      }
    }
    
    // Check for personality traits
    for (const pattern of personalityPatterns) {
      const match = pattern.exec(context);
      if (match && match[0]) {
        personalityTraits.push(match[0]);
      }
    }
    
    // Check for significant actions
    for (const pattern of actionPatterns) {
      const match = pattern.exec(context);
      if (match && match[0]) {
        actions.push(match[0]);
      }
    }
  }
  
  // Compile description
  let description = `${name} is a character in the story.`;
  
  if (physicalTraits.length > 0) {
    // Take the most descriptive physical trait
    const bestPhysicalTrait = physicalTraits.sort((a, b) => b.length - a.length)[0];
    description += ` ${bestPhysicalTrait}.`;
  }
  
  if (personalityTraits.length > 0) {
    // Take the most descriptive personality trait
    const bestPersonalityTrait = personalityTraits.sort((a, b) => b.length - a.length)[0];
    description += ` ${bestPersonalityTrait}.`;
  }
  
  if (actions.length > 0) {
    // Take a few significant actions
    const significantActions = actions.sort((a, b) => b.length - a.length).slice(0, 2);
    description += ` In the story, ${significantActions.join(' and ')}.`;
  }
  
  return description;
}

// Extract locations from text
function extractLocations(text, format) {
  const locations = [];
  const potentialLocations = new Map(); // name -> {confidence, appearances}
  
  // Location patterns based on format
  if (format === 'screenplay' || format === 'fountain') {
    extractScreenplayLocations(text, potentialLocations);
  } else {
    extractNovelLocations(text, potentialLocations);
  }
  
  // Filter and convert to location objects
  for (const [name, data] of potentialLocations.entries()) {
    if (data.confidence >= 0.6) {
      locations.push({
        name,
        location_type: determineLocationType(name),
        confidence: data.confidence,
        appearances: data.appearances,
        description: data.description || generateLocationDescription(name, data.contexts)
      });
    }
  }
  
  // Sort by appearances (descending)
  return locations.sort((a, b) => b.appearances - a.appearances);
}

// Extract locations from screenplay format
function extractScreenplayLocations(text, potentialLocations) {
  // Look for scene headings (INT./EXT.)
  const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)(.+?)(-|--|\.|\$)/gmi;
  let match;
  
  while ((match = sceneHeadingPattern.exec(text)) !== null) {
    if (match[2]) {
      const locationName = match[2].trim();
      
      if (!potentialLocations.has(locationName)) {
        potentialLocations.set(locationName, { 
          confidence: 0.9, 
          appearances: 1,
          contexts: [text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 100)]
        });
      } else {
        const loc = potentialLocations.get(locationName);
        loc.appearances++;
        loc.contexts = loc.contexts || [];
        loc.contexts.push(text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 100));
        potentialLocations.set(locationName, loc);
      }
    }
  }
}

// Extract locations from novel format
function extractNovelLocations(text, potentialLocations) {
  // Common location indicators
  const locationIndicators = [
    /\b(at|in|to|from|near|inside|outside|through|toward|across|beyond|within|around) the ([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+)\b/g,
    /\bthe ([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+) (room|building|house|castle|palace|village|town|city|kingdom|forest|river|mountain|valley|ocean|sea|lake|island)\b/g,
    /\b(arrived|entered|left|exited|visited) (at |the )?([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+)\b/g
  ];
  
  for (const pattern of locationIndicators) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Get the location name from the appropriate capture group
      const locationName = match[2] || match[3] || '';
      
      if (locationName && locationName.length > 2) {
        // Skip common non-location words
        const nonLocations = ['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'I', 'You', 'He', 'She', 'They', 'We'];
        if (nonLocations.includes(locationName)) continue;
        
        if (!potentialLocations.has(locationName)) {
          potentialLocations.set(locationName, { 
            confidence: 0.7, 
            appearances: 1,
            contexts: [text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)]
          });
        } else {
          const loc = potentialLocations.get(locationName);
          loc.appearances++;
          loc.confidence = Math.min(loc.confidence + 0.05, 0.9);
          loc.contexts = loc.contexts || [];
          loc.contexts.push(text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50));
          potentialLocations.set(locationName, loc);
        }
      }
    }
  }
  
  // Look for setting descriptions
  const settingIndicators = [
    /\bsetting\b[^.!?]*?\b([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+)\b/gi,
    /\bplace\b[^.!?]*?\b([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+)\b/gi,
    /\blocation\b[^.!?]*?\b([A-Z][a-z]+ [A-Z]?[a-z]*|[A-Z][a-z]+)\b/gi
  ];
  
  for (const pattern of settingIndicators) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const locationName = match[1];
      
      if (locationName && locationName.length > 2) {
        if (!potentialLocations.has(locationName)) {
          potentialLocations.set(locationName, { 
            confidence: 0.8, 
            appearances: 1,
            contexts: [text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)]
          });
        } else {
          const loc = potentialLocations.get(locationName);
          loc.appearances++;
          loc.confidence = Math.min(loc.confidence + 0.05, 0.9);
          loc.contexts = loc.contexts || [];
          loc.contexts.push(text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50));
          potentialLocations.set(locationName, loc);
        }
      }
    }
  }
}

// Determine the type of location
function determineLocationType(name) {
  const locationTypes = {
    'city': ['city', 'town', 'village', 'metropolis', 'borough', 'district'],
    'building': ['house', 'building', 'castle', 'palace', 'villa', 'mansion', 'cottage', 'apartment', 'flat', 'room', 'hall', 'chamber', 'office', 'tower', 'cabin'],
    'natural': ['forest', 'woods', 'grove', 'mountain', 'hill', 'valley', 'river', 'stream', 'lake', 'sea', 'ocean', 'beach', 'shore', 'island', 'cave', 'desert', 'plain', 'field', 'meadow'],
    'country': ['kingdom', 'country', 'nation', 'state', 'province', 'territory', 'land'],
    'realm': ['realm', 'world', 'dimension', 'universe', 'plane'],
    'other': []
  };
  
  const lowerName = name.toLowerCase();
  for (const [type, keywords] of Object.entries(locationTypes)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return type;
    }
  }
  
  return 'other';
}

// Generate a location description
function generateLocationDescription(name, contexts) {
  if (!contexts || contexts.length === 0) {
    return `A location named ${name} in the story.`;
  }
  
  // Extract descriptive phrases about the location
  const descriptions = [];
  
  // Look for descriptive patterns
  const descriptionPatterns = [
    new RegExp(`${name}[^.!?]*?was [^.!?]*`, 'i'),
    new RegExp(`${name}[^.!?]*?looked [^.!?]*`, 'i'),
    new RegExp(`${name}[^.!?]*?appeared [^.!?]*`, 'i'),
    new RegExp(`${name}[^.!?]*?seemed [^.!?]*`, 'i'),
    new RegExp(`the [^.!?]*?${name}`, 'i')
  ];
  
  for (const context of contexts) {
    for (const pattern of descriptionPatterns) {
      const match = pattern.exec(context);
      if (match && match[0]) {
        descriptions.push(match[0]);
      }
    }
  }
  
  // Compile description
  if (descriptions.length > 0) {
    // Take the most descriptive phrase
    const bestDescription = descriptions.sort((a, b) => b.length - a.length)[0];
    return `${bestDescription}.`;
  }
  
  return `A location named ${name} in the story.`;
}

// Extract scenes from text
function extractScenes(text, format) {
  const scenes = [];
  
  if (format === 'screenplay' || format === 'fountain') {
    // Screenplay format - divide by scene headings
    const lines = text.split('\n');
    let currentScene = { lines: [], heading: '' };
    let inScene = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for scene heading
      if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(line)) {
        // Save previous scene if it exists
        if (inScene && currentScene.lines.length > 0) {
          scenes.push({
            title: currentScene.heading,
            content: currentScene.lines.join('\n'),
            type: 'scene',
            sequence_number: scenes.length + 1
          });
        }
        
        // Start new scene
        currentScene = { lines: [line], heading: line };
        inScene = true;
      } else if (inScene) {
        currentScene.lines.push(line);
      }
    }
    
    // Save the last scene
    if (inScene && currentScene.lines.length > 0) {
      scenes.push({
        title: currentScene.heading,
        content: currentScene.lines.join('\n'),
        type: 'scene',
        sequence_number: scenes.length + 1
      });
    }
  } else {
    // Novel format - divide by chapters or scene breaks
    const chapterPattern = /\bChapter\s+\d+\b|\b\n\s*\*\s*\*\s*\*\s*\n\b/gi;
    const parts = text.split(chapterPattern);
    
    if (parts.length > 1) {
      // Text has chapters
      const chapterTitles = text.match(chapterPattern) || [];
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].trim().length > 0) {
          scenes.push({
            title: i < chapterTitles.length ? chapterTitles[i].trim() : `Chapter ${i+1}`,
            content: parts[i].trim(),
            type: 'chapter',
            sequence_number: i + 1
          });
          
          // Further divide chapters into scenes
          divideIntoScenes(parts[i].trim(), scenes, i + 1);
        }
      }
    } else {
      // No chapters, divide into scenes directly
      divideIntoScenes(text, scenes, 0);
    }
  }
  
  return scenes;
}

// Divide a text section into scenes
function divideIntoScenes(text, scenes, parentIndex) {
  // Look for scene breaks - blank lines, time transitions, location changes
  const paragraphs = text.split(/\n\s*\n/);
  let currentScene = { lines: [], title: '' };
  
  // Scene break indicators
  const sceneBreakIndicators = [
    /\blater\b/i,
    /\bthe next (day|morning|afternoon|evening|night)\b/i,
    /\bmeanwhile\b/i,
    /\bat the same time\b/i,
    /\belsewhere\b/i
  ];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    
    // Check for scene break indicators
    let isSceneBreak = false;
    for (const pattern of sceneBreakIndicators) {
      if (pattern.test(paragraph)) {
        isSceneBreak = true;
        break;
      }
    }
    
    // Also check for location change
    const locationIndicators = /\b(at|in|to|from|inside|outside) the\b/i;
    if (locationIndicators.test(paragraph) && paragraph.length < 100) {
      isSceneBreak = true;
    }
    
    if (isSceneBreak && currentScene.lines.length > 0) {
      // End the current scene
      scenes.push({
        title: `Scene ${scenes.length + 1}`,
        content: currentScene.lines.join('\n\n'),
        type: 'scene',
        sequence_number: scenes.length + 1,
        parent_sequence_number: parentIndex
      });
      
      // Start a new scene
      currentScene = { lines: [paragraph], title: '' };
    } else {
      currentScene.lines.push(paragraph);
    }
  }
  
  // Save the last scene
  if (currentScene.lines.length > 0) {
    scenes.push({
      title: `Scene ${scenes.length + 1}`,
      content: currentScene.lines.join('\n\n'),
      type: 'scene',
      sequence_number: scenes.length + 1,
      parent_sequence_number: parentIndex
    });
  }
}

// Extract events from scenes
function extractEvents(scenes, characters, locations) {
  const events = [];
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneContent = scene.content;
    
    // Find character mentions in this scene
    const sceneCharacters = characters.filter(character => 
      new RegExp(`\\b${character.name}\\b`, 'i').test(sceneContent)
    );
    
    // Find location mentions in this scene
    const sceneLocations = locations.filter(location => 
      new RegExp(`\\b${location.name}\\b`, 'i').test(sceneContent)
    );
    
    // Generate an event title based on key actions or dialogues
    let eventTitle = '';
    
    // Look for key action verbs
    const actionVerbs = ['confronted', 'discovered', 'revealed', 'attacked', 'escaped', 'arrived', 'departed', 'died', 'married', 'fought', 'reconciled', 'betrayed', 'helped', 'saved', 'killed', 'found', 'lost'];
    for (const verb of actionVerbs) {
      const pattern = new RegExp(`\\b(${sceneCharacters.map(c => c.name).join('|')})\\b[^.!?]*?\\b${verb}\\b`, 'i');
      const match = pattern.exec(sceneContent);
      if (match) {
        eventTitle = match[0];
        break;
      }
    }
    
    // If no key action found, use a descriptive title based on characters and locations
    if (!eventTitle && sceneCharacters.length > 0) {
      if (sceneLocations.length > 0) {
        eventTitle = `${sceneCharacters[0].name} at ${sceneLocations[0].name}`;
      } else {
        eventTitle = `Scene with ${sceneCharacters[0].name}`;
      }
    } else if (!eventTitle) {
      eventTitle = scene.title || `Event ${events.length + 1}`;
    }
    
    // Create event object
    const event = {
      title: eventTitle,
      description: sceneContent.length > 200 ? sceneContent.substring(0, 200) + '...' : sceneContent,
      sequence_number: i + 1,
      scene_id: scene.id, // Will be filled in after scene is stored
      characters: sceneCharacters.map(c => ({ 
        character_id: c.id, // Will be filled in after character is stored
        name: c.name,
        importance: estimateCharacterImportance(c.name, sceneContent)
      })),
      locations: sceneLocations.map(l => ({ 
        location_id: l.id, // Will be filled in after location is stored
        name: l.name
      }))
    };
    
    events.push(event);
  }
  
  return events;
}

// Estimate character importance in a scene
function estimateCharacterImportance(characterName, sceneContent) {
  const characterMentions = sceneContent.match(new RegExp(`\\b${characterName}\\b`, 'gi'));
  const totalMentions = characterMentions ? characterMentions.length : 0;
  
  // Count dialogues by/about the character
  const dialoguePattern = new RegExp(`\\b${characterName}\\b[^.!?]*?(said|asked|replied|shouted|whispered|exclaimed)`, 'gi');
  const dialogueMatches = sceneContent.match(dialoguePattern);
  const dialogueCount = dialogueMatches ? dialogueMatches.length : 0;
  
  // Count actions by the character
  const actionPattern = new RegExp(`\\b${characterName}\\b[^.!?]*?(walked|ran|moved|looked|turned|smiled|frowned|laughed|cried)`, 'gi');
  const actionMatches = sceneContent.match(actionPattern);
  const actionCount = actionMatches ? actionMatches.length : 0;
  
  // Calculate importance score (1-10)
  const importanceScore = Math.min(10, Math.max(1, Math.ceil((totalMentions + dialogueCount * 2 + actionCount * 2) / 2)));
  
  return importanceScore;
}

// Identify character relationships
function identifyCharacterRelationships(text, characters) {
  const relationships = [];
  
  // For each pair of characters
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const char1 = characters[i];
      const char2 = characters[j];
      
      // Skip if either character has low confidence
      if (char1.confidence < 0.7 || char2.confidence < 0.7) continue;
      
      // Look for sentences that mention both characters
      const bothMentionedPattern = new RegExp(`[^.!?]*\\b${char1.name}\\b[^.!?]*\\b${char2.name}\\b[^.!?]*\\.`, 'gi');
      const bothMentionedMatches = text.match(bothMentionedPattern) || [];
      
      // Skip if no connections found
      if (bothMentionedMatches.length === 0) continue;
      
      // Determine relationship type
      const relationshipType = determineRelationshipType(bothMentionedMatches, char1.name, char2.name);
      
      // Calculate intensity based on frequency of co-mentions
      const intensity = Math.min(10, Math.max(1, Math.ceil(bothMentionedMatches.length / 2)));
      
      // Create relationship object
      relationships.push({
        character1_id: char1.id, // Will be filled in after character is stored
        character2_id: char2.id, // Will be filled in after character is stored
        character1_name: char1.name,
        character2_name: char2.name,
        relationship_type: relationshipType,
        description: generateRelationshipDescription(bothMentionedMatches, char1.name, char2.name, relationshipType),
        intensity
      });
    }
  }
  
  return relationships;
}

// Determine relationship type between characters
function determineRelationshipType(mentions, char1Name, char2Name) {
  // Look for relationship indicators
  const familyIndicators = /\b(father|mother|son|daughter|brother|sister|uncle|aunt|cousin|relative|family|parent|child|sibling)\b/i;
  const friendIndicators = /\b(friend|ally|comrade|companion|partner|confidant)\b/i;
  const enemyIndicators = /\b(enemy|rival|opponent|foe|nemesis|adversary|antagonist)\b/i;
  const romanticIndicators = /\b(love|lover|husband|wife|spouse|boyfriend|girlfriend|partner|married|engaged|dating|romantic|kiss|passion)\b/i;
  const professionalIndicators = /\b(colleague|coworker|boss|employee|subordinate|superior|professional|work|business)\b/i;
  
  // Count matches for each type
  let familyCount = 0;
  let friendCount = 0;
  let enemyCount = 0;
  let romanticCount = 0;
  let professionalCount = 0;
  
  for (const mention of mentions) {
    if (familyIndicators.test(mention)) familyCount++;
    if (friendIndicators.test(mention)) friendCount++;
    if (enemyIndicators.test(mention)) enemyCount++;
    if (romanticIndicators.test(mention)) romanticCount++;
    if (professionalIndicators.test(mention)) professionalCount++;
  }
  
  // Determine the most prevalent type
  const counts = [
    { type: 'family', count: familyCount },
    { type: 'friend', count: friendCount },
    { type: 'enemy', count: enemyCount },
    { type: 'romantic', count: romanticCount },
    { type: 'professional', count: professionalCount }
  ];
  
  counts.sort((a, b) => b.count - a.count);
  
  // If a clear winner, return that type
  if (counts[0].count > 0 && counts[0].count > counts[1].count) {
    return counts[0].type;
  }
  
  // Default to 'other' if no clear type
  return 'other';
}

// Generate a relationship description
function generateRelationshipDescription(mentions, char1Name, char2Name, relationshipType) {
  if (mentions.length === 0) {
    return `Relationship between ${char1Name} and ${char2Name}.`;
  }
  
  // Start with a default description
  let description = '';
  
  switch (relationshipType) {
    case 'family':
      description = `${char1Name} and ${char2Name} are family members.`;
      break;
    case 'friend':
      description = `${char1Name} and ${char2Name} are friends.`;
      break;
    case 'enemy':
      description = `${char1Name} and ${char2Name} are enemies.`;
      break;
    case 'romantic':
      description = `${char1Name} and ${char2Name} have a romantic relationship.`;
      break;
    case 'professional':
      description = `${char1Name} and ${char2Name} have a professional relationship.`;
      break;
    default:
      description = `${char1Name} and ${char2Name} are connected.`;
  }
  
  // Add a specific example from the text
  // Sort mentions by length and pick the most descriptive one
  const mostDescriptiveMention = mentions.sort((a, b) => b.length - a.length)[0];
  description += ` For example: "${mostDescriptiveMention.trim()}"`;
  
  return description;
}

// Identify plotlines from events and characters
function identifyPlotlines(events, characters) {
  const plotlines = [];
  
  // If we have a protagonist, create a main plotline centered on them
  const protagonists = characters.filter(char => char.role === 'protagonist');
  if (protagonists.length > 0) {
    const mainCharacter = protagonists[0];
    
    plotlines.push({
      title: `${mainCharacter.name}'s Journey`,
      description: `The main story arc following ${mainCharacter.name}'s experiences and development.`,
      plotline_type: 'main',
      character_ids: [mainCharacter.id], // Will be filled in after character is stored
      event_ids: [] // Will be filled in later
    });
  }
  
  // Look for antagonist-related plotlines
  const antagonists = characters.filter(char => char.role === 'antagonist');
  if (antagonists.length > 0) {
    for (const antagonist of antagonists) {
      plotlines.push({
        title: `Conflict with ${antagonist.name}`,
        description: `The story arc involving the conflict with ${antagonist.name}.`,
        plotline_type: protagonists.length > 0 ? 'subplot' : 'main',
        character_ids: [antagonist.id], // Will be filled in after character is stored
        event_ids: [] // Will be filled in later
      });
    }
  }
  
  // Identify romantic plotlines based on relationships
  // (Not implemented in this simplified version)
  
  // Create a default plotline if none were identified
  if (plotlines.length === 0 && events.length > 0) {
    plotlines.push({
      title: 'Main Story',
      description: 'The primary narrative arc of the story.',
      plotline_type: 'main',
      character_ids: [], // Will be filled in later
      event_ids: [] // Will be filled in later
    });
  }
  
  return plotlines;
}

// Identify event dependencies
function identifyEventDependencies(events) {
  const dependencies = [];
  
  // Simple approach: events generally depend on previous events in sequence
  for (let i = 1; i < events.length; i++) {
    dependencies.push({
      predecessor_event_id: null, // Will be filled in after events are stored
      successor_event_id: null, // Will be filled in after events are stored
      predecessor_sequence: i,
      successor_sequence: i + 1,
      dependency_type: 'chronological',
      strength: 5,
      description: `Event ${i+1} follows event ${i} chronologically.`
    });
  }
  
  // More sophisticated dependency identification would look for causal relationships
  // (Not fully implemented in this simplified version)
  
  return dependencies;
}

// Identify character arcs
function identifyCharacterArcs(events, characters, relationships) {
  const characterArcs = [];
  
  // Focus on main characters
  const mainCharacters = characters.filter(char => 
    char.role === 'protagonist' || char.role === 'antagonist' || char.appearances > 10
  );
  
  for (const character of mainCharacters) {
    // Find events involving this character
    const characterEvents = events.filter(event => 
      event.characters && event.characters.some(c => c.name === character.name)
    );
    
    if (characterEvents.length < 3) continue; // Not enough events for an arc
    
    // Create character arc
    characterArcs.push({
      character_id: character.id, // Will be filled in after character is stored
      character_name: character.name,
      title: `${character.name}'s Arc`,
      description: `Character development journey for ${character.name}.`,
      starting_state: `At the beginning, ${character.name} is introduced to the story.`,
      ending_state: `By the end, ${character.name} has experienced various events.`,
      event_ids: [] // Will be filled in later
    });
  }
  
  return characterArcs;
}

// Generate a synopsis of the story
function generateSynopsis(events, characters, plotlines) {
  if (events.length === 0 || characters.length === 0) {
    return '';
  }
  
  // Get main characters
  const mainCharacters = characters.filter(char => 
    char.role === 'protagonist' || char.appearances > 10
  ).slice(0, 3);
  
  // Get main plotline
  const mainPlotline = plotlines.find(p => p.plotline_type === 'main') || plotlines[0];
  
  // Create synopsis
  let synopsis = '';
  
  // Start with main characters
  if (mainCharacters.length > 0) {
    const characterNames = mainCharacters.map(c => c.name).join(', ');
    synopsis += `This story follows ${characterNames}. `;
  }
  
  // Add plotline description if available
  if (mainPlotline) {
    synopsis += mainPlotline.description + ' ';
  }
  
  // Add key events
  if (events.length > 3) {
    const keyEvents = [events[0], events[Math.floor(events.length / 2)], events[events.length - 1]];
    synopsis += `The narrative begins with ${keyEvents[0].title.toLowerCase()}, `;
    synopsis += `progresses through ${keyEvents[1].title.toLowerCase()}, `;
    synopsis += `and concludes with ${keyEvents[2].title.toLowerCase()}.`;
  }
  
  return synopsis;
}

// Get a short synopsis of the text (fallback)
function getShortSynopsis(text) {
  // Extract the first few sentences as a synopsis
  const firstParagraph = text.split('\n\n')[0] || '';
  return firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph;
}

// Enhanced database storage functions that return data and error
async function storeCharacters(supabase, storyId, characters) {
  try {
    const { data, error } = await supabase.from('characters').insert(
      characters.map(character => ({
        name: character.name,
        story_id: storyId,
        role: character.role || 'supporting',
        description: character.description || '',
        attributes: { 
          confidence: character.confidence || 0.5,
          appearances: character.appearances || 0
        }
      }))
    ).select();
    
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function storeLocations(supabase, storyId, locations) {
  try {
    const { data, error } = await supabase.from('locations').insert(
      locations.map(location => ({
        name: location.name,
        story_id: storyId,
        location_type: location.location_type || 'other',
        description: location.description || '',
        attributes: { 
          confidence: location.confidence || 0.5,
          appearances: location.appearances || 0
        }
      }))
    ).select();
    
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function storeEvents(supabase, storyId, events) {
  try {
    const { data, error } = await supabase.from('events').insert(
      events.map(event => ({
        title: event.title,
        story_id: storyId,
        description: event.description || '',
        sequence_number: event.sequence_number || 0,
        visible: true
      }))
    ).select();
    
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function storeScenes(supabase, storyId, scenes) {
  try {
    const { data, error } = await supabase.from('scenes').insert(
      scenes.map(scene => ({
        title: scene.title,
        story_id: storyId,
        content: scene.content || '',
        description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
        sequence_number: scene.sequence_number || 0,
        type: scene.type || 'scene',
        status: 'finished',
        is_visible: true
      }))
    ).select();
    
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function storePlotlines(supabase, storyId, plotlines) {
  try {
    const { data, error } = await supabase.from('plotlines').insert(
      plotlines.map(plotline => ({
        title: plotline.title,
        story_id: storyId,
        description: plotline.description || '',
        plotline_type: plotline.plotline_type || 'main'
      }))
    ).select();
    
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}