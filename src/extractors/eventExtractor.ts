import { v4 as uuidv4 } from 'uuid';

// Helper function to extract events based on time markers and action sequences
export const extractEventNames = (text: string): string[] => {
  const events = new Set<string>();
  
  // Common time and event markers
  const timeMarkers = [
    'suddenly', 'later', 'meanwhile', 'after', 'before', 'during', 'when', 
    'next day', 'that night', 'morning', 'afternoon', 'evening', 'midnight',
    'yesterday', 'tomorrow', 'last week', 'next month'
  ];
  
  // Look for capitalized actions after time markers
  const lines = text.split('\n');
  for (const line of lines) {
    for (const marker of timeMarkers) {
      const regex = new RegExp(`\\b${marker}\\b.*?([A-Z][a-z]+(?:\\s+[a-z]+){2,})`, 'gi');
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          events.add(`${marker.charAt(0).toUpperCase() + marker.slice(1)}: ${match[1].trim()}`);
        }
      }
    }
  }
  
  // Look for sentences with strong action verbs in ALL CAPS
  const actionRegex = /\b([A-Z]{3,}S|ATTACK|FIGHT|BATTLE|CONFRONT|REVEAL|DISCOVER|ESCAPE|ENTER|EXIT|ARRIVE|LEAVE)\b[^.!?]*[.!?]/gi;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    if (match[0]) {
      const eventText = match[0].trim();
      if (eventText.length > 10 && eventText.length < 100) {
        events.add(eventText);
      }
    }
  }
  
  // Look for explicit "EVENT:" markers
  const eventMarkerRegex = /\bEVENT\s*:\s*([^.!?]+)/gi;
  while ((match = eventMarkerRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      events.add(match[1].trim());
    }
  }

  // Look for scene transitions which often indicate events
  const sceneTransitionRegex = /^(?:\s*)(?:FADE |CUT |DISSOLVE |TRANSITION |WIPE |SCENE )[^.!?]*[.!?]/gim;
  while ((match = sceneTransitionRegex.exec(text)) !== null) {
    if (match[0]) {
      const eventText = match[0].trim();
      if (eventText.length > 10) {
        events.add(`Scene: ${eventText}`);
      }
    }
  }
  
  // Add key emotional moments as events
  const emotionRegex = /\b(SCREAMS|CRIES|LAUGHS|YELLS|SHOUTS|WHISPERS|GASPS|SOBS)\b[^.!?]*[.!?]/gi;
  while ((match = emotionRegex.exec(text)) !== null) {
    if (match[0]) {
      const eventText = match[0].trim();
      if (eventText.length > 10 && eventText.length < 100) {
        events.add(eventText);
      }
    }
  }
  
  return [...events];
};

// Create event objects from event titles
export const createEventObjects = (eventNames: string[], storyId: string): any[] => {
  return eventNames.map((title, index) => ({
    id: uuidv4(),
    title: title,
    description: title,
    story_id: storyId,
    sequence_number: index * 10, // Simple sequential ordering
    confidence: 0.5
  }));
};

// Main function to extract and create event objects
export const extractEvents = (text: string, storyId: string): any[] => {
  const eventNames = extractEventNames(text);
  return createEventObjects(eventNames, storyId);
};
