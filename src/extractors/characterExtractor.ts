import { v4 as uuidv4 } from 'uuid';

// Common non-character ALL CAPS words
const NON_CHARACTER_WORDS = [
  'THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL',
  'BUT', 'OR', 'THAT', 'THIS', 'THESE', 'THOSE', 'MY', 'YOUR', 'HIS', 'HER', 'OUR', 'THEIR',
  'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID',
  'NOT', 'NO', 'YES', 'CAN', 'WILL', 'WOULD', 'SHOULD', 'COULD', 'MAY', 'MIGHT'
];

// Helper function to extract characters marked in ALL CAPS
export const extractAllCapsCharacters = (text: string): string[] => {
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;
  const matches = text.match(allCapsRegex) || [];
  
  // Filter out common non-character ALL CAPS words
  return [...new Set(matches)].filter(word => !NON_CHARACTER_WORDS.includes(word));
};

// Create a character object from a character name
export const createCharacterObject = (name: string, storyId: string): any => {
  // Set role based on character name if possible (can be enhanced with better detection)
  let role: 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other' = 'supporting';
  let description = 'A character in the story';
  
  // Convert to Title Case (first letter capitalized, rest lowercase)
  const formattedName = name.charAt(0) + name.slice(1).toLowerCase();
  
  return {
    id: uuidv4(),
    name: formattedName,
    role,
    description,
    story_id: storyId,
    confidence: 0.9 // High confidence for ALL CAPS characters
  };
};

// Main function to extract and create character objects
export const extractCharacters = (text: string, storyId: string): any[] => {
  const characterNames = extractAllCapsCharacters(text);
  return characterNames.map(name => createCharacterObject(name, storyId));
};
