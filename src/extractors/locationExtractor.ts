import { v4 as uuidv4 } from 'uuid';

// Helper function to extract locations based on patterns
export const extractLocationNames = (text: string): string[] => {
  // Common location indicators
  const locationPrefixes = ['at', 'in', 'to', 'from', 'near', 'around', 'inside', 'outside'];
  const locationIndicators = [
    'street', 'avenue', 'road', 'lane', 'drive', 'boulevard', 'highway', 
    'park', 'building', 'house', 'apartment', 'office', 'room', 'city', 
    'town', 'village', 'country', 'kingdom', 'castle', 'palace', 'mountain',
    'river', 'lake', 'ocean', 'sea', 'forest', 'desert', 'cafe', 'restaurant',
    'bar', 'pub', 'hotel', 'motel', 'school', 'university', 'college', 'hospital'
  ];
  
  // Find potential locations: capitalized words after location prefixes
  const locations = new Set<string>();
  
  // Check for "INT." and "EXT." in screenplay format (interior/exterior locations)
  const scriptLocationRegex = /\b(INT\.|EXT\.)\s+([A-Z][A-Za-z0-9\s']+)(?:\s*-\s*|\s*–\s*|$)/g;
  let match;
  while ((match = scriptLocationRegex.exec(text)) !== null) {
    if (match[2] && match[2].trim().length > 0) {
      locations.add(match[2].trim());
    }
  }
  
  // Look for capitalized phrases after location prefixes
  const lines = text.split('\n');
  for (const line of lines) {
    for (const prefix of locationPrefixes) {
      const regex = new RegExp(`\\b${prefix}\\s+([A-Z][A-Za-z0-9\\s']+)\\b`, 'g');
      while ((match = regex.exec(line)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          locations.add(match[1].trim());
        }
      }
    }
  }
  
  // Look for capitalized phrases containing location indicators
  for (const indicator of locationIndicators) {
    const regex = new RegExp(`\\b([A-Z][A-Za-z0-9\\s']*\\s+${indicator})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        locations.add(match[1].trim());
      }
    }
  }
  
  return [...locations];
};

// Create location objects from location names
export const createLocationObjects = (locationNames: string[], storyId: string, storyWorldId: string): any[] => {
  return locationNames.map(name => ({
    id: uuidv4(),
    name: name,
    description: `A location in the story: ${name}`,
    location_type: determineLocationType(name),
    story_id: storyId,
    story_world_id: storyWorldId,
    confidence: 0.75
  }));
};

// Helper function to guess the location type based on name
const determineLocationType = (name: string): 'city' | 'building' | 'natural' | 'country' | 'planet' | 'realm' | 'other' => {
  const lowerName = name.toLowerCase();
  
  // Check for city indicators
  if (lowerName.includes(' city') || lowerName.includes(' town') || lowerName.includes(' village')) {
    return 'city';
  }
  
  // Check for building indicators
  if (lowerName.includes('house') || lowerName.includes('building') || 
      lowerName.includes('castle') || lowerName.includes('office') || 
      lowerName.includes('apartment') || lowerName.includes('room') ||
      lowerName.includes('hotel') || lowerName.includes('cafe') || 
      lowerName.includes('restaurant') || lowerName.includes('hospital') ||
      /\bint\./i.test(lowerName)) {
    return 'building';
  }
  
  // Check for natural indicators
  if (lowerName.includes('mountain') || lowerName.includes('forest') || 
      lowerName.includes('river') || lowerName.includes('lake') || 
      lowerName.includes('ocean') || lowerName.includes('sea') || 
      lowerName.includes('desert') || lowerName.includes('park') ||
      /\bext\./i.test(lowerName)) {
    return 'natural';
  }
  
  // Check for country indicators
  if (lowerName.includes('country') || lowerName.includes('nation') || 
      lowerName.includes('kingdom') || lowerName.includes('empire')) {
    return 'country';
  }
  
  // Default to other
  return 'other';
};

// Main function to extract and create location objects
export const extractLocations = (text: string, storyId: string, storyWorldId: string): any[] => {
  const locationNames = extractLocationNames(text);
  return createLocationObjects(locationNames, storyId, storyWorldId);
};
