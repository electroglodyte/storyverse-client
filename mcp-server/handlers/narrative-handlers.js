// handlers/narrative-handlers.js
import { supabase } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

// Helper functions for story analysis
const preprocessText = (text) => {
  // Clean up text, normalize whitespace, etc.
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
};

const segmentText = (text) => {
  // Split text into logical segments (paragraphs, scenes, etc.)
  const segments = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentSegment = { type: 'paragraph', content: '', paragraphs: [] };
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    
    // Detect scene breaks
    if (/^[-*_]{3,}$/.test(trimmed)) {
      if (currentSegment.paragraphs.length > 0) {
        segments.push(currentSegment);
      }
      segments.push({ type: 'scene_break', content: trimmed });
      currentSegment = { type: 'paragraph', content: '', paragraphs: [] };
    } 
    // Detect chapter headings
    else if (/^(chapter|scene|act)\s+\w+/i.test(trimmed)) {
      if (currentSegment.paragraphs.length > 0) {
        segments.push(currentSegment);
      }
      segments.push({ type: 'heading', content: trimmed });
      currentSegment = { type: 'paragraph', content: '', paragraphs: [] };
    }
    // Regular paragraph
    else {
      currentSegment.paragraphs.push(trimmed);
      currentSegment.content += (currentSegment.content ? '\n\n' : '') + trimmed;
    }
  }
  
  // Add the last segment if it has content
  if (currentSegment.paragraphs.length > 0) {
    segments.push(currentSegment);
  }
  
  return segments;
};

const extractCharacters = async (text, storyId) => {
  // Extract character names and information from text
  const characterMap = new Map();
  
  // Initial pattern matching for character identification
  const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  // Process potential character names
  for (const name of nameMatches) {
    // Filter out common non-character words, places, etc.
    if (name.length < 3) continue;
    if (/^(The|And|But|Or|If|Then|When|Where|Why|How|What|This|That|These|Those)$/.test(name)) continue;
    
    // Check frequency to determine if it's likely a character
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    const frequency = (text.match(nameRegex) || []).length;
    
    // Names that appear frequently are likely characters
    if (frequency >= 3) {
      // Look for context around the name to extract additional info
      const contextRegex = new RegExp(`.{0,100}\\b${name}\\b.{0,100}`, 'g');
      const contexts = text.match(contextRegex) || [];
      
      // Extract potential role, appearance, etc.
      let role = 'unknown';
      let appearance = '';
      let personality = '';
      
      for (const context of contexts) {
        // Role detection
        if (/protagonist|hero|main character/i.test(context)) {
          role = 'protagonist';
        } else if (/antagonist|villain|enemy/i.test(context)) {
          role = 'antagonist';
        } else if (/supporting|helper|friend/i.test(context)) {
          role = 'supporting';
        }
        
        // Simple appearance extraction (needs improvement)
        const appearanceMatch = context.match(/(?:tall|short|young|old|beautiful|handsome|wearing|dressed|looks)([^.!?;]*)/) || [];
        if (appearanceMatch[1] && appearanceMatch[1].length > appearance.length) {
          appearance = appearanceMatch[1].trim();
        }
      }
      
      // Only add if not already in the map or if we have more info
      if (!characterMap.has(name) || appearance) {
        characterMap.set(name, {
          id: uuidv4(),
          name,
          description: `Character extracted from text analysis`,
          story_id: storyId,
          role: role,
          appearance: appearance || undefined,
          personality: personality || undefined,
          confidence: Math.min(0.5 + (frequency * 0.05), 0.95) // Confidence based on frequency
        });
      }
    }
  }
  
  return Array.from(characterMap.values());
};

const extractLocations = async (text, storyId) => {
  // Extract location names and descriptions from text
  const locationMap = new Map();
  
  // Pattern matching for location identification
  const locationIndicators = /\bin\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)|(?:at|to)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  let match;
  
  while ((match = locationIndicators.exec(text)) !== null) {
    const location = match[1] || match[2];
    if (!location) continue;
    
    // Filter out likely non-locations
    if (location.length < 3) continue;
    if (/^(The|And|But|Or|This|That|There|Their|His|Her|They|Then|When|Where)$/.test(location)) continue;
    
    // Check frequency
    const locationRegex = new RegExp(`\\b${location}\\b`, 'g');
    const frequency = (text.match(locationRegex) || []).length;
    
    if (frequency >= 2) {
      // Extract description
      const contextRegex = new RegExp(`.{0,100}\\b${location}\\b.{0,100}`, 'g');
      const contexts = text.match(contextRegex) || [];
      let description = '';
      
      for (const context of contexts) {
        const descMatch = context.match(new RegExp(`${location}\\s+(?:was|is)([^.!?;]*)`)) || [];
        if (descMatch[1] && descMatch[1].length > description.length) {
          description = descMatch[1].trim();
        }
      }
      
      // Determine location type
      let locationType = 'other';
      if (/\b(?:city|town|village|suburb|neighborhood)\b/i.test(location + ' ' + description)) {
        locationType = 'city';
      } else if (/\b(?:building|house|apartment|castle|tower|room|hall)\b/i.test(location + ' ' + description)) {
        locationType = 'building';
      } else if (/\b(?:forest|mountain|river|lake|ocean|sea|beach|valley|hill)\b/i.test(location + ' ' + description)) {
        locationType = 'natural';
      } else if (/\b(?:country|nation|state|province|county|territory)\b/i.test(location + ' ' + description)) {
        locationType = 'country';
      }
      
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          id: uuidv4(),
          name: location,
          description: description || `Location extracted from text analysis`,
          story_id: storyId,
          location_type: locationType,
          confidence: Math.min(0.4 + (frequency * 0.05), 0.9)
        });
      }
    }
  }
  
  return Array.from(locationMap.values());
};

const extractEvents = async (text, storyId, characters = [], locations = []) => {
  // Extract events and their properties from text
  const events = [];
  const segments = segmentText(text);
  
  let sequenceNumber = 10;
  let currentTime = null;
  let currentTimeReference = null;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    // Skip non-paragraph segments for event detection
    if (segment.type !== 'paragraph') {
      // But capture headings as potential events
      if (segment.type === 'heading') {
        events.push({
          id: uuidv4(),
          title: segment.content,
          description: (segments[i+1]?.type === 'paragraph') ? segments[i+1].paragraphs[0] : '',
          story_id: storyId,
          sequence_number: sequenceNumber,
          chronological_time: currentTime,
          time_reference_point: currentTimeReference,
          visible: true
        });
        sequenceNumber += 10;
      }
      continue;
    }
    
    // Look for time markers
    const timeMarkers = segment.content.match(/(?:in|on|at)\s+(\d{4}|\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|yesterday|tomorrow|today|last\s+\w+|next\s+\w+)/i);
    if (timeMarkers) {
      currentTime = timeMarkers[1];
      currentTimeReference = 'absolute';
    }
    
    // Look for relative time markers
    const relativeTimeMarkers = segment.content.match(/(?:later|after|before|meanwhile|soon|eventually|instantly|immediately|suddenly)/i);
    if (relativeTimeMarkers) {
      currentTimeReference = 'relative';
    }
    
    // Extract events from significant paragraph content
    // A paragraph is considered an event if it contains character actions or significant state changes
    const hasCharacterAction = characters.some(char => 
      new RegExp(`\\b${char.name}\\b.{0,30}\\b(?:said|went|came|walked|ran|jumped|moved|decided|thought|felt|saw|heard|spoke|asked|answered|replied|shouted|whispered|looked|watched|noticed)\\b`, 'i').test(segment.content)
    );
    
    const hasStateChange = /\b(?:changed|transformed|became|turned|shifted|switched|converted|altered)\b/i.test(segment.content);
    const hasEventVerb = /\b(?:happened|occurred|took place|began|started|ended|finished|concluded|erupted|exploded|discovered|found|killed|destroyed|built|created|developed|emerged|appeared|disappeared|arrived|left|departed|returned)\b/i.test(segment.content);
    
    if (hasCharacterAction || hasStateChange || hasEventVerb) {
      // Extract a title from the first sentence
      const firstSentence = segment.content.split(/[.!?](\s|$)/)[0];
      let title = firstSentence.substring(0, 60);
      if (title.length === 60) title += '...';
      
      // Identify involved characters
      const involvedCharacters = characters.filter(char => 
        new RegExp(`\\b${char.name}\\b`, 'i').test(segment.content)
      );
      
      // Identify mentioned locations
      const mentionedLocations = locations.filter(loc => 
        new RegExp(`\\b${loc.name}\\b`, 'i').test(segment.content)
      );
      
      const event = {
        id: uuidv4(),
        title,
        description: segment.content.substring(0, 500),
        story_id: storyId,
        sequence_number: sequenceNumber,
        chronological_time: currentTime,
        relative_time_offset: relativeTimeMarkers ? relativeTimeMarkers[0] : null,
        time_reference_point: currentTimeReference,
        visible: true,
        involved_characters: involvedCharacters.map(char => ({
          character_id: char.id,
          importance: 5, // Default importance
          experience_type: 'active' // Default experience type
        })),
        locations: mentionedLocations.map(loc => loc.id)
      };
      
      events.push(event);
      sequenceNumber += 10;
    }
  }
  
  return events;
};

const detectCharacterRelationships = async (characters, text) => {
  // Detect relationships between characters based on text analysis
  const relationships = [];
  
  // Skip if less than 2 characters
  if (characters.length < 2) return relationships;
  
  // Analyze proximity and interactions between characters
  for (let i = 0; i < characters.length - 1; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const char1 = characters[i];
      const char2 = characters[j];
      
      // Look for segments where both characters are mentioned
      const interactionRegex = new RegExp(`.{0,150}\\b${char1.name}\\b.{0,150}\\b${char2.name}\\b.{0,150}|.{0,150}\\b${char2.name}\\b.{0,150}\\b${char1.name}\\b.{0,150}`, 'gi');
      const interactions = text.match(interactionRegex) || [];
      
      if (interactions.length > 0) {
        // Determine relationship type based on interaction content
        let relationshipType = 'other';
        let description = '';
        let intensity = 5; // Default intensity
        
        for (const interaction of interactions) {
          // Check for family relationships
          if (/\b(?:father|mother|dad|mom|brother|sister|son|daughter|uncle|aunt|cousin|grandparent|grandmother|grandfather|family)\b/i.test(interaction)) {
            relationshipType = 'family';
            intensity = 7;
          }
          // Check for friendly relationships
          else if (/\b(?:friend|ally|companion|partner|colleague|comrade|buddy|pal)\b/i.test(interaction)) {
            relationshipType = 'friend';
            intensity = 6;
          }
          // Check for enemy relationships
          else if (/\b(?:enemy|foe|opponent|rival|adversary|antagonist|nemesis|hostile)\b/i.test(interaction)) {
            relationshipType = 'enemy';
            intensity = 8;
          }
          // Check for romantic relationships
          else if (/\b(?:love|lover|boyfriend|girlfriend|husband|wife|spouse|partner|romance|kiss|embrace|caress)\b/i.test(interaction)) {
            relationshipType = 'romantic';
            intensity = 9;
          }
          // Check for professional relationships
          else if (/\b(?:boss|employee|coworker|supervisor|subordinate|client|customer|teacher|student|mentor|apprentice|leader|follower)\b/i.test(interaction)) {
            relationshipType = 'professional';
            intensity = 4;
          }
          
          // Extract description from the shortest meaningful interaction
          if (!description || (interaction.length < description.length && interaction.length > 30)) {
            description = interaction.trim();
          }
        }
        
        relationships.push({
          id: uuidv4(),
          character1_id: char1.id,
          character2_id: char2.id,
          relationship_type: relationshipType,
          description: description.substring(0, 200),
          intensity,
          interaction_count: interactions.length
        });
      }
    }
  }
  
  return relationships;
};

const detectEventDependencies = async (events) => {
  // Detect dependencies between events
  const dependencies = [];
  
  // Skip if less than 2 events
  if (events.length < 2) return dependencies;
  
  for (let i = 0; i < events.length - 1; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];
      
      // Skip events without descriptions
      if (!event1.description || !event2.description) continue;
      
      // Chronological dependency based on sequence
      if (event1.sequence_number < event2.sequence_number) {
        dependencies.push({
          id: uuidv4(),
          predecessor_event_id: event1.id,
          successor_event_id: event2.id,
          dependency_type: 'chronological',
          strength: 3 // Lower strength for basic chronological ordering
        });
      }
      
      // Look for causal connections
      if (event2.description.includes(event1.title) || 
          (event1.title.length > 15 && event2.description.includes(event1.title.substring(0, 15)))) {
        dependencies.push({
          id: uuidv4(),
          predecessor_event_id: event1.id,
          successor_event_id: event2.id,
          dependency_type: 'causal',
          strength: 7 // Higher strength for causal connections
        });
      }
      
      // Check for thematic connections
      const event1Words = new Set(event1.description.toLowerCase().split(/\W+/).filter(w => w.length > 4));
      const event2Words = new Set(event2.description.toLowerCase().split(/\W+/).filter(w => w.length > 4));
      
      let commonWords = 0;
      for (const word of event1Words) {
        if (event2Words.has(word)) commonWords++;
      }
      
      const thematicScore = commonWords / Math.min(event1Words.size, event2Words.size);
      
      if (thematicScore > 0.2) {
        dependencies.push({
          id: uuidv4(),
          predecessor_event_id: event1.id,
          successor_event_id: event2.id,
          dependency_type: 'thematic',
          strength: Math.round(thematicScore * 10) // Strength based on thematic similarity
        });
      }
    }
  }
  
  return dependencies;
};

const detectStorylines = async (events, characters, storyId) => {
  // Group events into coherent storylines/plot arcs
  const plotlines = [];
  
  // Skip if too few events
  if (events.length < 3) return plotlines;
  
  // Character-focused storylines
  for (const character of characters) {
    if (character.role === 'protagonist' || character.role === 'antagonist') {
      const characterEvents = events.filter(event => 
        event.involved_characters && 
        event.involved_characters.some(c => c.character_id === character.id)
      );
      
      if (characterEvents.length >= 3) {
        const sortedEvents = [...characterEvents].sort((a, b) => a.sequence_number - b.sequence_number);
        
        // Basic plot arc detection (beginning, middle, end)
        const startingEvent = sortedEvents[0];
        const middleIndex = Math.floor(sortedEvents.length / 2);
        const climaxEvent = sortedEvents[middleIndex];
        const resolutionEvent = sortedEvents[sortedEvents.length - 1];
        
        plotlines.push({
          id: uuidv4(),
          title: `${character.name}'s Journey`,
          description: `Character arc following ${character.name} through the story.`,
          story_id: storyId,
          plotline_type: 'character',
          starting_event_id: startingEvent.id,
          climax_event_id: climaxEvent.id,
          resolution_event_id: resolutionEvent.id,
          theme: null,
          events: sortedEvents.map(e => e.id),
          characters: [character.id]
        });
      }
    }
  }
  
  // Thematic storylines based on dependency clustering
  // This is a simplified approach and could be enhanced with graph analysis
  const thematicClusters = new Map();
  
  // Cluster events by thematic similarity
  for (const event of events) {
    let assigned = false;
    
    for (const [theme, clusterEvents] of thematicClusters.entries()) {
      const eventWords = new Set(event.description.toLowerCase().split(/\W+/).filter(w => w.length > 4));
      
      // Compare with representative event in the cluster
      const repr = events.find(e => e.id === clusterEvents[0]);
      if (!repr) continue;
      
      const reprWords = new Set(repr.description.toLowerCase().split(/\W+/).filter(w => w.length > 4));
      
      let commonWords = 0;
      for (const word of eventWords) {
        if (reprWords.has(word)) commonWords++;
      }
      
      const thematicScore = commonWords / Math.min(eventWords.size, reprWords.size);
      
      if (thematicScore > 0.15) {
        clusterEvents.push(event.id);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      // Extract a theme from significant words in description
      const words = event.description.toLowerCase().split(/\W+/)
        .filter(w => w.length > 4)
        .filter(w => !['about', 'after', 'again', 'against', 'could', 'every', 'first', 'going', 'their', 'there', 'these', 'thing', 'those', 'where', 'which', 'would'].includes(w));
      
      if (words.length > 0) {
        const theme = words[Math.floor(Math.random() * words.length)].charAt(0).toUpperCase() + words[Math.floor(Math.random() * words.length)].slice(1);
        thematicClusters.set(theme, [event.id]);
      }
    }
  }
  
  // Convert clusters to plotlines
  for (const [theme, eventIds] of thematicClusters.entries()) {
    if (eventIds.length >= 3) {
      const sortedEvents = eventIds
        .map(id => events.find(e => e.id === id))
        .sort((a, b) => a.sequence_number - b.sequence_number);
      
      // Extract involved characters
      const involvedCharIds = new Set();
      for (const eventId of eventIds) {
        const event = events.find(e => e.id === eventId);
        if (event.involved_characters) {
          event.involved_characters.forEach(c => involvedCharIds.add(c.character_id));
        }
      }
      
      plotlines.push({
        id: uuidv4(),
        title: `The ${theme} Storyline`,
        description: `Storyline centered around the theme of ${theme}.`,
        story_id: storyId,
        plotline_type: 'thematic',
        starting_event_id: sortedEvents[0].id,
        climax_event_id: sortedEvents[Math.floor(sortedEvents.length / 2)].id,
        resolution_event_id: sortedEvents[sortedEvents.length - 1].id,
        theme,
        events: eventIds,
        characters: Array.from(involvedCharIds)
      });
    }
  }
  
  // Main plot detection (if possible)
  if (events.length >= 5) {
    const sortedEvents = [...events].sort((a, b) => a.sequence_number - b.sequence_number);
    const protagonists = characters.filter(c => c.role === 'protagonist');
    
    if (protagonists.length > 0) {
      const mainCharId = protagonists[0].id;
      const mainCharacterEvents = events.filter(event => 
        event.involved_characters && 
        event.involved_characters.some(c => c.character_id === mainCharId &&
                                        c.importance >= 7)
      );
      
      if (mainCharacterEvents.length >= 3) {
        plotlines.push({
          id: uuidv4(),
          title: `Main Plot`,
          description: `The primary storyline of the narrative.`,
          story_id: storyId,
          plotline_type: 'main',
          starting_event_id: sortedEvents[0].id,
          climax_event_id: sortedEvents[Math.floor(sortedEvents.length * 0.8)].id,
          resolution_event_id: sortedEvents[sortedEvents.length - 1].id,
          theme: null,
          events: sortedEvents.map(e => e.id),
          characters: [mainCharId]
        });
      }
    }
  }
  
  return plotlines;
};

const createOrGetStory = async (title, storyWorldId = null) => {
  const { data: existingStory, error: queryError } = await supabase
    .from('stories')
    .select('id')
    .eq('title', title)
    .single();
  
  if (queryError && queryError.code !== 'PGRST116') {
    console.error('Error checking for existing story:', queryError);
    throw queryError;
  }
  
  if (existingStory) {
    return existingStory.id;
  }
  
  // Create new story
  const storyId = uuidv4();
  const { error: insertError } = await supabase
    .from('stories')
    .insert({
      id: storyId,
      title,
      name: title,
      story_world_id: storyWorldId,
      storyworld_id: storyWorldId,
      status: 'concept',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (insertError) {
    console.error('Error creating story:', insertError);
    throw insertError;
  }
  
  return storyId;
};

const storeEntities = async (entities, tableName) => {
  if (!entities || entities.length === 0) return [];
  
  const { data, error } = await supabase
    .from(tableName)
    .insert(entities)
    .select();
  
  if (error) {
    console.error(`Error storing ${tableName}:`, error);
    throw error;
  }
  
  return data || [];
};

// Handler implementations
const getCharacterJourney = async (args) => {
  try {
    const {
      character_id,
      story_id
    } = args;
    
    // First, get the character details
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', character_id)
      .single();
    
    if (characterError) {
      throw characterError;
    }
    
    // Get the character's events
    let eventQuery = supabase
      .from('character_events')
      .select('*, event:events(*)')
      .eq('character_id', character_id)
      .order('character_sequence_number', { ascending: true });
    
    if (story_id) {
      eventQuery = eventQuery.eq('events.story_id', story_id);
    }
    
    const { data: characterEvents, error: eventsError } = await eventQuery;
    
    if (eventsError) {
      throw eventsError;
    }
    
    return {
      success: true,
      character,
      event_count: characterEvents?.length || 0,
      journey: characterEvents?.map(ce => ({
        id: ce.event.id,
        title: ce.event.title,
        description: ce.event.description,
        importance: ce.importance,
        experience_type: ce.experience_type,
        sequence_number: ce.event.sequence_number,
        character_sequence_number: ce.character_sequence_number
      })) || []
    };
  } catch (error) {
    console.error('Error in getCharacterJourney:', error);
    throw error;
  }
};

const compareCharacterJourneys = async (args) => {
  try {
    const {
      character_ids,
      story_id
    } = args;
    
    // Get characters
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .in('id', character_ids);
    
    if (charactersError) {
      throw charactersError;
    }
    
    // Get journeys
    const journeys = [];
    for (const character of characters) {
      let eventQuery = supabase
        .from('character_events')
        .select('*, event:events(*)')
        .eq('character_id', character.id)
        .order('character_sequence_number', { ascending: true });
      
      if (story_id) {
        eventQuery = eventQuery.eq('events.story_id', story_id);
      }
      
      const { data: characterEvents, error: eventsError } = await eventQuery;
      
      if (eventsError) {
        throw eventsError;
      }
      
      journeys.push({
        character,
        event_count: characterEvents?.length || 0,
        events: characterEvents?.map(ce => ({
          id: ce.event.id,
          title: ce.event.title,
          description: ce.event.description,
          importance: ce.importance,
          experience_type: ce.experience_type,
          sequence_number: ce.event.sequence_number
        })) || []
      });
    }
    
    // Find shared events
    const eventMap = new Map();
    for (const journey of journeys) {
      for (const event of journey.events) {
        if (!eventMap.has(event.id)) {
          eventMap.set(event.id, {
            event,
            characters: []
          });
        }
        
        eventMap.get(event.id).characters.push({
          id: journey.character.id,
          name: journey.character.name,
          experience_type: event.experience_type,
          importance: event.importance
        });
      }
    }
    
    const sharedEvents = Array.from(eventMap.values())
      .filter(entry => entry.characters.length > 1)
      .sort((a, b) => a.event.sequence_number - b.event.sequence_number);
    
    return {
      success: true,
      journeys: journeys.map(j => ({
        character: j.character,
        event_count: j.event_count
      })),
      shared_events: sharedEvents
    };
  } catch (error) {
    console.error('Error in compareCharacterJourneys:', error);
    throw error;
  }
};

const updateEventSequence = async (args) => {
  try {
    const {
      event_id,
      new_sequence_number
    } = args;
    
    // Get the current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    
    if (eventError) {
      throw eventError;
    }
    
    const previousSequenceNumber = event.sequence_number;
    
    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ sequence_number: new_sequence_number, updated_at: new Date().toISOString() })
      .eq('id', event_id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return {
      success: true,
      event: updatedEvent,
      previous_sequence_number: previousSequenceNumber
    };
  } catch (error) {
    console.error('Error in updateEventSequence:', error);
    throw error;
  }
};

const normalizeEventSequence = async (args) => {
  try {
    const {
      story_id,
      start_value = 10,
      interval = 10
    } = args;
    
    // Get all events for the story, sorted by sequence number
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (!events || events.length === 0) {
      return {
        success: false,
        message: 'No events found for this story',
        events_normalized: 0
      };
    }
    
    // Update each event with normalized sequence numbers
    const updatePromises = events.map((event, index) => {
      const newSequence = start_value + (index * interval);
      return supabase
        .from('events')
        .update({ 
          sequence_number: newSequence,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);
    });
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      events_normalized: events.length,
      first_event: {
        id: events[0].id,
        title: events[0].title,
        new_sequence: start_value
      },
      last_event: {
        id: events[events.length - 1].id,
        title: events[events.length - 1].title,
        new_sequence: start_value + ((events.length - 1) * interval)
      }
    };
  } catch (error) {
    console.error('Error in normalizeEventSequence:', error);
    throw error;
  }
};

const createStoryEvent = async (args) => {
  try {
    const {
      event_data,
      dependency_data
    } = args;
    
    // Generate a new ID for the event
    const eventId = uuidv4();
    
    // Create the event
    const eventToInsert = {
      id: eventId,
      ...event_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdEvent, error: eventError } = await supabase
      .from('events')
      .insert(eventToInsert)
      .select()
      .single();
    
    if (eventError) {
      throw eventError;
    }
    
    // Create dependencies if provided
    let createdDependencies = [];
    
    if (dependency_data) {
      // Handle predecessors
      if (dependency_data.predecessors && dependency_data.predecessors.length > 0) {
        const predecessorDependencies = dependency_data.predecessors.map(dep => ({
          id: uuidv4(),
          predecessor_event_id: dep.event_id,
          successor_event_id: eventId,
          dependency_type: dep.dependency_type || 'causal',
          strength: dep.strength || 5,
          created_at: new Date().toISOString()
        }));
        
        const { data: insertedPredecessors, error: predError } = await supabase
          .from('event_dependencies')
          .insert(predecessorDependencies)
          .select();
        
        if (predError) {
          console.error('Error creating predecessor dependencies:', predError);
        } else {
          createdDependencies = [...createdDependencies, ...insertedPredecessors];
        }
      }
      
      // Handle successors
      if (dependency_data.successors && dependency_data.successors.length > 0) {
        const successorDependencies = dependency_data.successors.map(dep => ({
          id: uuidv4(),
          predecessor_event_id: eventId,
          successor_event_id: dep.event_id,
          dependency_type: dep.dependency_type || 'causal',
          strength: dep.strength || 5,
          created_at: new Date().toISOString()
        }));
        
        const { data: insertedSuccessors, error: succError } = await supabase
          .from('event_dependencies')
          .insert(successorDependencies)
          .select();
        
        if (succError) {
          console.error('Error creating successor dependencies:', succError);
        } else {
          createdDependencies = [...createdDependencies, ...insertedSuccessors];
        }
      }
    }
    
    return {
      success: true,
      event: createdEvent,
      dependencies: createdDependencies
    };
  } catch (error) {
    console.error('Error in createStoryEvent:', error);
    throw error;
  }
};

const addEventWithDependencies = async (args) => {
  try {
    const {
      event_data,
      predecessors = [],
      successors = []
    } = args;
    
    // First, determine an appropriate sequence number
    let sequenceNumber = 10; // Default starting point
    
    if (predecessors.length > 0 || successors.length > 0) {
      // Get sequence numbers of predecessor and successor events
      const { data: relatedEvents, error: relatedError } = await supabase
        .from('events')
        .select('id, sequence_number')
        .in('id', [...predecessors, ...successors]);
      
      if (relatedError) {
        throw relatedError;
      }
      
      if (relatedEvents && relatedEvents.length > 0) {
        const predEvents = relatedEvents.filter(e => predecessors.includes(e.id));
        const succEvents = relatedEvents.filter(e => successors.includes(e.id));
        
        if (predEvents.length > 0 && succEvents.length > 0) {
          // Position between predecessors and successors
          const maxPred = Math.max(...predEvents.map(e => e.sequence_number));
          const minSucc = Math.min(...succEvents.map(e => e.sequence_number));
          sequenceNumber = Math.floor((maxPred + minSucc) / 2);
        } else if (predEvents.length > 0) {
          // Position after predecessors
          const maxPred = Math.max(...predEvents.map(e => e.sequence_number));
          sequenceNumber = maxPred + 10;
        } else if (succEvents.length > 0) {
          // Position before successors
          const minSucc = Math.min(...succEvents.map(e => e.sequence_number));
          sequenceNumber = Math.max(minSucc - 10, 1);
        }
      }
    }
    
    // Create the event
    const eventId = uuidv4();
    const eventToInsert = {
      id: eventId,
      ...event_data,
      sequence_number: sequenceNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdEvent, error: eventError } = await supabase
      .from('events')
      .insert(eventToInsert)
      .select()
      .single();
    
    if (eventError) {
      throw eventError;
    }
    
    // Create dependencies
    let createdDependencies = {
      predecessors: [],
      successors: []
    };
    
    // Handle predecessors
    if (predecessors.length > 0) {
      const predecessorDependencies = predecessors.map(predId => ({
        id: uuidv4(),
        predecessor_event_id: predId,
        successor_event_id: eventId,
        dependency_type: 'causal', // Default type
        strength: 5, // Default strength
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedPreds, error: predError } = await supabase
        .from('event_dependencies')
        .insert(predecessorDependencies)
        .select();
      
      if (predError) {
        console.error('Error creating predecessor dependencies:', predError);
      } else {
        createdDependencies.predecessors = insertedPreds;
      }
    }
    
    // Handle successors
    if (successors.length > 0) {
      const successorDependencies = successors.map(succId => ({
        id: uuidv4(),
        predecessor_event_id: eventId,
        successor_event_id: succId,
        dependency_type: 'causal', // Default type
        strength: 5, // Default strength
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedSuccs, error: succError } = await supabase
        .from('event_dependencies')
        .insert(successorDependencies)
        .select();
      
      if (succError) {
        console.error('Error creating successor dependencies:', succError);
      } else {
        createdDependencies.successors = insertedSuccs;
      }
    }
    
    return {
      success: true,
      event: createdEvent,
      dependencies: createdDependencies
    };
  } catch (error) {
    console.error('Error in addEventWithDependencies:', error);
    throw error;
  }
};

const addCharacterEvent = async (args) => {
  try {
    const {
      character_id,
      event_data,
      journey_position = null
    } = args;
    
    // Create the event first
    const eventId = uuidv4();
    const eventToInsert = {
      id: eventId,
      ...event_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdEvent, error: eventError } = await supabase
      .from('events')
      .insert(eventToInsert)
      .select()
      .single();
    
    if (eventError) {
      throw eventError;
    }
    
    // Determine character sequence number
    let characterSequenceNumber = 10; // Default
    
    if (journey_position !== null) {
      characterSequenceNumber = journey_position;
    } else {
      // Get highest sequence number for this character
      const { data: lastEvent, error: seqError } = await supabase
        .from('character_events')
        .select('character_sequence_number')
        .eq('character_id', character_id)
        .order('character_sequence_number', { ascending: false })
        .limit(1)
        .single();
      
      if (!seqError && lastEvent) {
        characterSequenceNumber = lastEvent.character_sequence_number + 10;
      }
    }
    
    // Create the character event link
    const characterEventId = uuidv4();
    const characterEventToInsert = {
      id: characterEventId,
      character_id,
      event_id: eventId,
      importance: event_data.importance || 5,
      experience_type: event_data.experience_type || 'active',
      character_sequence_number: characterSequenceNumber,
      created_at: new Date().toISOString()
    };
    
    const { data: createdCharacterEvent, error: charEventError } = await supabase
      .from('character_events')
      .insert(characterEventToInsert)
      .select()
      .single();
    
    if (charEventError) {
      throw charEventError;
    }
    
    return {
      success: true,
      event: createdEvent,
      character_event: createdCharacterEvent
    };
  } catch (error) {
    console.error('Error in addCharacterEvent:', error);
    throw error;
  }
};

const findSharedEvents = async (args) => {
  try {
    const {
      character_ids,
      story_id
    } = args;
    
    if (!character_ids || character_ids.length < 2) {
      return {
        success: false,
        message: 'At least two character IDs are required',
        total_events: 0,
        events: []
      };
    }
    
    // First, get all events for each character
    const eventsByCharacter = new Map();
    
    for (const charId of character_ids) {
      let query = supabase
        .from('character_events')
        .select('*, event:events(*), character:characters(id, name)')
        .eq('character_id', charId);
      
      if (story_id) {
        query = query.eq('events.story_id', story_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        for (const charEvent of data) {
          if (!eventsByCharacter.has(charEvent.event_id)) {
            eventsByCharacter.set(charEvent.event_id, {
              event: charEvent.event,
              characters: []
            });
          }
          
          eventsByCharacter.get(charEvent.event_id).characters.push({
            id: charEvent.character.id,
            name: charEvent.character.name,
            experience_type: charEvent.experience_type,
            importance: charEvent.importance
          });
        }
      }
    }
    
    // Filter for shared events
    const sharedEvents = Array.from(eventsByCharacter.values())
      .filter(e => e.characters.length > 1)
      .map(e => ({
        id: e.event.id,
        title: e.event.title,
        description: e.event.description,
        sequence_number: e.event.sequence_number,
        shared_by: e.characters.length,
        characters: e.characters
      }))
      .sort((a, b) => a.sequence_number - b.sequence_number);
    
    return {
      success: true,
      total_events: sharedEvents.length,
      fully_shared_events: sharedEvents.filter(e => e.shared_by === character_ids.length).length,
      events: sharedEvents
    };
  } catch (error) {
    console.error('Error in findSharedEvents:', error);
    throw error;
  }
};

const addSceneWithEvents = async (args) => {
  try {
    const {
      scene_data,
      event_data
    } = args;
    
    // First, handle the event (create or link)
    let eventId = null;
    let createdEvent = null;
    
    if (event_data) {
      if (event_data.id) {
        // Link to existing event
        eventId = event_data.id;
        
        // Verify the event exists
        const { data: existingEvent, error: verifyError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (verifyError) {
          throw new Error(`Event with ID ${eventId} not found`);
        }
        
        createdEvent = existingEvent;
      } else {
        // Create new event
        eventId = uuidv4();
        const eventToInsert = {
          id: eventId,
          title: event_data.title || scene_data.title,
          description: event_data.description || scene_data.description,
          story_id: scene_data.story_id,
          sequence_number: scene_data.sequence_number || 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: newEvent, error: eventError } = await supabase
          .from('events')
          .insert(eventToInsert)
          .select()
          .single();
        
        if (eventError) {
          throw eventError;
        }
        
        createdEvent = newEvent;
      }
    }
    
    // Create the scene
    const sceneId = uuidv4();
    const format = scene_data.format || 'plain';
    const sceneToInsert = {
      id: sceneId,
      title: scene_data.title,
      description: scene_data.description,
      content: scene_data.content,
      event_id: eventId,
      story_id: scene_data.story_id,
      sequence_number: scene_data.sequence_number,
      is_visible: scene_data.is_visible !== undefined ? scene_data.is_visible : true,
      format,
      type: scene_data.type || 'scene',
      status: scene_data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdScene, error: sceneError } = await supabase
      .from('scenes')
      .insert(sceneToInsert)
      .select()
      .single();
    
    if (sceneError) {
      throw sceneError;
    }
    
    // Handle character links if provided
    let sceneCharacters = [];
    if (scene_data.characters && scene_data.characters.length > 0) {
      const charLinks = scene_data.characters.map(char => ({
        id: uuidv4(),
        scene_id: sceneId,
        character_id: char.id,
        importance: char.importance || 'secondary',
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedChars, error: charError } = await supabase
        .from('scene_characters')
        .insert(charLinks)
        .select();
      
      if (charError) {
        console.error('Error linking characters to scene:', charError);
      } else {
        sceneCharacters = insertedChars;
      }
    }
    
    // Handle location links if provided
    let sceneLocations = [];
    if (scene_data.locations && scene_data.locations.length > 0) {
      const locLinks = scene_data.locations.map(loc => ({
        id: uuidv4(),
        scene_id: sceneId,
        location_id: loc.id,
        created_at: new Date().toISOString()
      }));
      
      const { data: insertedLocs, error: locError } = await supabase
        .from('scene_locations')
        .insert(locLinks)
        .select();
      
      if (locError) {
        console.error('Error linking locations to scene:', locError);
      } else {
        sceneLocations = insertedLocs;
      }
    }
    
    return {
      success: true,
      scene: createdScene,
      event: createdEvent,
      scene_characters: sceneCharacters,
      scene_locations: sceneLocations
    };
  } catch (error) {
    console.error('Error in addSceneWithEvents:', error);
    throw error;
  }
};

const visualizeTimeline = async (args) => {
  try {
    const {
      story_id,
      format = 'react-flow'
    } = args;
    
    // Get all events for the story
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (!events || events.length === 0) {
      return {
        success: false,
        message: 'No events found for this story',
        type: format
      };
    }
    
    // Get dependencies between events
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select('*')
      .or(`predecessor_event_id.in.(${events.map(e => e.id).join(',')}),successor_event_id.in.(${events.map(e => e.id).join(',')})`);
    
    if (depError) {
      throw depError;
    }
    
    if (format === 'react-flow') {
      // Create nodes and edges for React Flow visualization
      const nodes = events.map((event, index) => ({
        id: event.id,
        type: 'event',
        data: { label: event.title, description: event.description },
        position: { x: index * 250, y: event.sequence_number }
      }));
      
      const edges = dependencies ? dependencies.map(dep => ({
        id: `edge-${dep.id}`,
        source: dep.predecessor_event_id,
        target: dep.successor_event_id,
        label: dep.dependency_type,
        type: 'straight',
        animated: dep.strength > 7,
        style: { strokeWidth: Math.max(1, dep.strength / 2) }
      })) : [];
      
      return {
        success: true,
        type: 'react-flow',
        elements: {
          nodes,
          edges
        }
      };
    } else if (format === 'timeline') {
      // Create timeline visualization
      const items = events.map(event => ({
        id: event.id,
        content: event.title,
        start: event.chronological_time || new Date(2000, 0, 1 + event.sequence_number).toISOString().split('T')[0],
        description: event.description
      }));
      
      return {
        success: true,
        type: 'timeline',
        items
      };
    } else {
      // Default structured format
      return {
        success: true,
        type: 'structured',
        events,
        dependencies: dependencies || []
      };
    }
  } catch (error) {
    console.error('Error in visualizeTimeline:', error);
    throw error;
  }
};

const analyzeEventImpact = async (args) => {
  try {
    const {
      event_id
    } = args;
    
    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    
    if (eventError) {
      throw eventError;
    }
    
    // Get characters involved in this event
    const { data: characterEvents, error: charError } = await supabase
      .from('character_events')
      .select('*, character:characters(*)')
      .eq('event_id', event_id);
    
    if (charError) {
      throw charError;
    }
    
    // Get dependencies (causes and effects)
    const { data: causesDeps, error: causesError } = await supabase
      .from('event_dependencies')
      .select('*, predecessor:events(*)')
      .eq('successor_event_id', event_id);
    
    if (causesError) {
      throw causesError;
    }
    
    const { data: effectsDeps, error: effectsError } = await supabase
      .from('event_dependencies')
      .select('*, successor:events(*)')
      .eq('predecessor_event_id', event_id);
    
    if (effectsError) {
      throw effectsError;
    }
    
    // Get scenes related to this event
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('event_id', event_id);
    
    if (scenesError) {
      throw scenesError;
    }
    
    // Organize characters by importance
    const characters = {
      primary: [],
      secondary: []
    };
    
    if (characterEvents) {
      for (const ce of characterEvents) {
        const char = {
          id: ce.character.id,
          name: ce.character.name,
          role: ce.character.role,
          experience_type: ce.experience_type,
          importance: ce.importance
        };
        
        if (ce.importance >= 7) {
          characters.primary.push(char);
        } else {
          characters.secondary.push(char);
        }
      }
    }
    
    // Extract causes and effects
    const causes = causesDeps ? causesDeps.map(dep => ({
      id: dep.predecessor.id,
      title: dep.predecessor.title,
      relationship: dep.dependency_type,
      strength: dep.strength
    })) : [];
    
    const effects = effectsDeps ? effectsDeps.map(dep => ({
      id: dep.successor.id,
      title: dep.successor.title,
      relationship: dep.dependency_type,
      strength: dep.strength
    })) : [];
    
    return {
      success: true,
      event,
      impact: {
        character_count: characterEvents ? characterEvents.length : 0,
        cause_count: causes.length,
        effect_count: effects.length,
        scene_count: scenes ? scenes.length : 0
      },
      characters,
      causes,
      effects,
      scenes: scenes || []
    };
  } catch (error) {
    console.error('Error in analyzeEventImpact:', error);
    throw error;
  }
};

const detectDependencyConflicts = async (args) => {
  try {
    const {
      story_id
    } = args;
    
    // Get all events for the story
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (!events || events.length === 0) {
      return {
        success: false,
        message: 'No events found for this story',
        conflicts: []
      };
    }
    
    // Get all dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select('*, predecessor:events(id, title, sequence_number), successor:events(id, title, sequence_number)')
      .or(`predecessor_event_id.in.(${events.map(e => e.id).join(',')}),successor_event_id.in.(${events.map(e => e.id).join(',')})`);
    
    if (depError) {
      throw depError;
    }
    
    if (!dependencies || dependencies.length === 0) {
      return {
        success: true,
        message: 'No dependencies found for events in this story',
        conflicts: []
      };
    }
    
    // Detect sequence conflicts
    const sequenceConflicts = [];
    for (const dep of dependencies) {
      if (dep.predecessor && dep.successor && 
          dep.predecessor.sequence_number >= dep.successor.sequence_number) {
        sequenceConflicts.push({
          type: 'sequence_conflict',
          predecessor: dep.predecessor,
          successor: dep.successor,
          dependency_id: dep.id
        });
      }
    }
    
    // Detect circular dependencies
    const circularConflicts = [];
    const graph = new Map();
    
    // Build dependency graph
    for (const dep of dependencies) {
      if (!graph.has(dep.predecessor_event_id)) {
        graph.set(dep.predecessor_event_id, []);
      }
      graph.get(dep.predecessor_event_id).push(dep.successor_event_id);
    }
    
    // Check for cycles
    const visited = new Set();
    const recursionStack = new Set();
    
    function detectCycle(nodeId, path = []) {
      if (!graph.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const currentPath = [...path, nodeId];
      
      for (const neighbor of graph.get(nodeId)) {
        if (!visited.has(neighbor)) {
          if (detectCycle(neighbor, currentPath)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStartIndex = currentPath.indexOf(neighbor);
          const cycle = currentPath.slice(cycleStartIndex).concat(neighbor);
          
          // Get event details for each node in the cycle
          const cycleEvents = cycle.map(id => events.find(e => e.id === id)).filter(e => e);
          
          if (cycleEvents.length > 1) {
            circularConflicts.push({
              type: 'circular_dependency',
              events: cycleEvents
            });
          }
          
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    }
    
    // Check each unvisited node
    for (const eventId of graph.keys()) {
      if (!visited.has(eventId)) {
        detectCycle(eventId);
      }
    }
    
    return {
      success: true,
      conflicts: [...sequenceConflicts, ...circularConflicts]
    };
  } catch (error) {
    console.error('Error in detectDependencyConflicts:', error);
    throw error;
  }
};

const suggestMissingEvents = async (args) => {
  try {
    const {
      story_id
    } = args;
    
    // Get all events for the story
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventsError) {
      throw eventsError;
    }
    
    if (!events || events.length < 2) {
      return {
        success: false,
        message: 'Not enough events to suggest missing events',
        suggestions: []
      };
    }
    
    // Get all dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select('*')
      .or(`predecessor_event_id.in.(${events.map(e => e.id).join(',')}),successor_event_id.in.(${events.map(e => e.id).join(',')})`);
    
    if (depError) {
      throw depError;
    }
    
    // Get all characters for this story
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('story_id', story_id);
    
    if (charError) {
      throw charError;
    }
    
    // Get character events
    const { data: characterEvents, error: ceError } = await supabase
      .from('character_events')
      .select('*')
      .or(`event_id.in.(${events.map(e => e.id).join(',')})`);
    
    if (ceError) {
      throw ceError;
    }
    
    const suggestions = [];
    
    // Detect sequence gaps
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      // Check if there's a significant gap in sequence numbers
      if (next.sequence_number - current.sequence_number > 50) {
        suggestions.push({
          type: 'sequence_gap',
          before_event: { id: current.id, title: current.title },
          after_event: { id: next.id, title: next.title },
          suggested_event: {
            title: `Event between "${current.title}" and "${next.title}"`,
            description: `This event fills the narrative gap between the events "${current.title}" and "${next.title}".`
          }
        });
      }
    }
    
    // Detect causal chain gaps
    if (dependencies) {
      const depMap = new Map();
      for (const dep of dependencies) {
        if (dep.dependency_type === 'causal' && dep.strength >= 7) {
          // Check if there's a direct causal link between events that are far apart in sequence
          const pred = events.find(e => e.id === dep.predecessor_event_id);
          const succ = events.find(e => e.id === dep.successor_event_id);
          
          if (pred && succ && succ.sequence_number - pred.sequence_number > 30) {
            suggestions.push({
              type: 'causal_chain_gap',
              source_event: { id: pred.id, title: pred.title },
              target_event: { id: succ.id, title: succ.title },
              suggested_event: {
                title: `Causal Link between "${pred.title}" and "${succ.title}"`,
                description: `This event explains how "${pred.title}" leads to "${succ.title}" and bridges the causal gap.`
              }
            });
          }
        }
      }
    }
    
    // Detect character continuity gaps
    if (characters && characterEvents) {
      for (const character of characters) {
        // Get events for this character
        const charEvts = characterEvents
          .filter(ce => ce.character_id === character.id)
          .map(ce => ({
            ...ce,
            event: events.find(e => e.id === ce.event_id)
          }))
          .filter(ce => ce.event)
          .sort((a, b) => a.event.sequence_number - b.event.sequence_number);
        
        // Check for gaps in character appearances
        for (let i = 0; i < charEvts.length - 1; i++) {
          const current = charEvts[i];
          const next = charEvts[i + 1];
          
          // If there's a big gap between appearances, suggest a character continuity event
          if (next.event.sequence_number - current.event.sequence_number > 40) {
            suggestions.push({
              type: 'character_continuity_gap',
              character: { id: character.id, name: character.name },
              last_appearance: { id: current.event_id, title: current.event.title },
              next_appearance: { id: next.event_id, title: next.event.title },
              suggested_event: {
                title: `${character.name}'s Activities`,
                description: `This event explains what ${character.name} was doing between "${current.event.title}" and "${next.event.title}".`
              }
            });
          }
        }
      }
    }
    
    return {
      success: true,
      suggestions
    };
  } catch (error) {
    console.error('Error in suggestMissingEvents:', error);
    throw error;
  }
};

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
      }
    }
    
    // Step 4: Relationship detection
    let characterRelationships = [];
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
      events: extractedEvents.map(event => {
        const { involved_characters, locations, ...eventData } = event;
        return eventData;
      }),
      relationships: characterRelationships,
      dependencies: eventDependencies,
      plotlines: extractedPlotlines
    };
  } catch (error) {
    console.error('Error in analyzeStory:', error);
    throw error;
  }
};

export default {
  getCharacterJourney,
  compareCharacterJourneys,
  updateEventSequence,
  normalizeEventSequence,
  createStoryEvent,
  addEventWithDependencies,
  addCharacterEvent,
  findSharedEvents,
  addSceneWithEvents,
  visualizeTimeline,
  analyzeEventImpact,
  detectDependencyConflicts,
  suggestMissingEvents,
  analyzeStory
};