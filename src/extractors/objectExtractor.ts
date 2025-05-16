import { v4 as uuidv4 } from 'uuid';
import { extractAllCapsCharacters } from './characterExtractor';

// Helper function to extract important objects mentioned in the text
export const extractObjectNames = (text: string): string[] => {
  const objects = new Set<string>();
  
  // Common object indicators
  const objectIndicators = [
    'holds', 'carries', 'picks up', 'puts down', 'takes', 'drops', 'finds', 
    'sees', 'looks at', 'examines', 'opens', 'closes', 'wears', 'carrying'
  ];
  
  // Object types that are commonly important in stories
  const objectTypes = [
    'sword', 'gun', 'knife', 'book', 'letter', 'key', 'map', 'phone', 'computer',
    'necklace', 'ring', 'amulet', 'crown', 'scepter', 'wand', 'staff', 'shield',
    'armor', 'robe', 'cloak', 'hat', 'mask', 'potion', 'scroll', 'artifact'
  ];
  
  // Look for objects after object indicators
  const lines = text.split('\n');
  for (const line of lines) {
    for (const indicator of objectIndicators) {
      // Object is often a noun phrase after the indicator
      const regex = new RegExp(`\\b${indicator}\\s+(?:a|an|the|his|her|their|its)\\s+([a-z]+(?:\\s+[a-z]+){0,2})`, 'gi');
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          objects.add(match[1].trim());
        }
      }
    }
  }
  
  // Look for specific object types
  for (const type of objectTypes) {
    const regex = new RegExp(`\\b(?:a|an|the|his|her|their|its)\\s+([a-z]+\\s+)?${type}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const objectName = match[1] ? `${match[1].trim()} ${type}` : type;
      objects.add(objectName);
    }
  }
  
  // Look for objects in ALL CAPS that aren't character names
  const allCapsCharacters = extractAllCapsCharacters(text);
  const allCapsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;
  const allCapsMatches = text.match(allCapsRegex) || [];
  
  for (const match of allCapsMatches) {
    // If it's not already detected as a character and not a common word
    if (!allCapsCharacters.includes(match) && match.length > 2) {
      // Check if it's mentioned with object verbs
      for (const indicator of objectIndicators) {
        if (text.includes(`${indicator} ${match}`) || text.includes(`${match} is`)) {
          objects.add(match.toLowerCase());
          break;
        }
      }
    }
  }

  // Look for objects marked as "OBJECT:" or "ITEM:"
  const objectMarkerRegex = /\b(?:OBJECT|ITEM|PROP|ARTIFACT)\s*:\s*([^\n.!?]+)/gi;
  let match;
  while ((match = objectMarkerRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      objects.add(match[1].trim().toLowerCase());
    }
  }
  
  return [...objects];
};

// Create object objects from object names
export const createObjectObjects = (objectNames: string[], storyId: string, storyWorldId: string): any[] => {
  return objectNames.map(name => ({
    id: uuidv4(),
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
    description: `An item in the story: ${name}`,
    item_type: determineObjectType(name),
    story_id: storyId,
    story_world_id: storyWorldId,
    confidence: 0.6
  }));
};

// Helper function to determine object type based on name
const determineObjectType = (name: string): 'weapon' | 'tool' | 'clothing' | 'magical' | 'technology' | 'document' | 'other' => {
  const lowerName = name.toLowerCase();
  
  // Check for weapons
  if (lowerName.includes('sword') || lowerName.includes('knife') || 
      lowerName.includes('gun') || lowerName.includes('bow') || 
      lowerName.includes('arrow') || lowerName.includes('axe') || 
      lowerName.includes('dagger') || lowerName.includes('spear') ||
      lowerName.includes('weapon')) {
    return 'weapon';
  }
  
  // Check for tools
  if (lowerName.includes('tool') || lowerName.includes('hammer') || 
      lowerName.includes('wrench') || lowerName.includes('key') || 
      lowerName.includes('lock') || lowerName.includes('rope') ||
      lowerName.includes('compass')) {
    return 'tool';
  }
  
  // Check for clothing
  if (lowerName.includes('hat') || lowerName.includes('robe') || 
      lowerName.includes('cloak') || lowerName.includes('armor') || 
      lowerName.includes('dress') || lowerName.includes('shirt') ||
      lowerName.includes('clothing') || lowerName.includes('costume')) {
    return 'clothing';
  }
  
  // Check for magical items
  if (lowerName.includes('wand') || lowerName.includes('staff') || 
      lowerName.includes('potion') || lowerName.includes('magical') || 
      lowerName.includes('amulet') || lowerName.includes('talisman') ||
      lowerName.includes('crystal') || lowerName.includes('spell')) {
    return 'magical';
  }
  
  // Check for technology
  if (lowerName.includes('phone') || lowerName.includes('computer') || 
      lowerName.includes('laptop') || lowerName.includes('device') || 
      lowerName.includes('machine') || lowerName.includes('robot') ||
      lowerName.includes('tech')) {
    return 'technology';
  }
  
  // Check for documents
  if (lowerName.includes('book') || lowerName.includes('letter') || 
      lowerName.includes('map') || lowerName.includes('scroll') || 
      lowerName.includes('manuscript') || lowerName.includes('note') ||
      lowerName.includes('document')) {
    return 'document';
  }
  
  return 'other';
};

// Main function to extract and create object objects
export const extractObjects = (text: string, storyId: string, storyWorldId: string): any[] => {
  const objectNames = extractObjectNames(text);
  return createObjectObjects(objectNames, storyId, storyWorldId);
};
