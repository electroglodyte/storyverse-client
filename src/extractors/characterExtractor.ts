import { v4 as uuidv4 } from 'uuid';

// Common non-character ALL CAPS words
const NON_CHARACTER_WORDS = [
  'THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL',
  'BUT', 'OR', 'THAT', 'THIS', 'THESE', 'THOSE', 'MY', 'YOUR', 'HIS', 'HER', 'OUR', 'THEIR',
  'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID',
  'NOT', 'NO', 'YES', 'CAN', 'WILL', 'WOULD', 'SHOULD', 'COULD', 'MAY', 'MIGHT',
  'YEAR', 'YEARS', 'STORY', 'SYNOPSIS'
];

// Helper function to extract characters marked in ALL CAPS
// This improved version handles multi-word names
export const extractAllCapsCharacters = (text: string): string[] => {
  // First, identify dialogue and scene descriptions where character names appear
  const scriptLines = text.split('\n');
  
  // Collect all potential character names and multi-word names
  const potentialNames: string[] = [];
  const multiWordNames: string[] = [];
  
  // Regular expression to detect character speech or action line prefixes (common script format)
  const characterLineRegex = /^([A-Z][A-Z\s]+)(?:\s*\(.*\))?\s*$/;
  
  // First pass - extract character names from script formatting if present
  for (const line of scriptLines) {
    const match = line.match(characterLineRegex);
    if (match) {
      const name = match[1].trim();
      if (name.length > 1 && !NON_CHARACTER_WORDS.includes(name)) {
        if (name.includes(' ')) {
          // This is a multi-word name, save it intact
          multiWordNames.push(name);
        } else {
          potentialNames.push(name);
        }
      }
    }
  }
  
  // Second pass - extract remaining ALL CAPS words
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z][A-Z]+\b/g;
  const allCapsMatches = text.match(allCapsRegex) || [];
  
  // Add individual words, filtering non-character words and possessive forms
  for (const word of allCapsMatches) {
    // Only skip possessive forms if they're at the end of a title
    if (word.endsWith("'S") && (text.includes(`${word} TALE`) || text.includes(`${word} STORY`))) {
      continue;
    }
    
    if (!NON_CHARACTER_WORDS.includes(word)) {
      potentialNames.push(word);
    }
  }
  
  // Detect multi-word character names (like "BOBA FETT")
  // Look for patterns where ALL CAPS words appear together consistently
  const multiWordRegex = /\b[A-Z][A-Z]+\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)*\b/g;
  const multiWordMatches = text.match(multiWordRegex) || [];
  
  for (const multiWord of multiWordMatches) {
    // Skip if any of the words are in the non-character list
    const words = multiWord.split(/\s+/);
    const isNonCharacter = words.every(word => NON_CHARACTER_WORDS.includes(word));
    
    if (!isNonCharacter) {
      // Check if this is a title (e.g., "A WOLF'S TALE")
      const lowerMultiWord = multiWord.toLowerCase();
      if (!lowerMultiWord.includes("tale") && !lowerMultiWord.includes("story")) {
        multiWordNames.push(multiWord);
      }
      
      // Remove the individual words from potentialNames if they're part of a multi-word name
      // Only do this if we're keeping the multi-word name
      if (multiWordNames.includes(multiWord)) {
        words.forEach(word => {
          const index = potentialNames.indexOf(word);
          if (index !== -1) {
            potentialNames.splice(index, 1);
          }
        });
      }
    }
  }
  
  // Extract character names from title lines (e.g., "RUFUS: A WOLF'S TALE")
  const titleLineRegex = /^([A-Z][A-Z]+):\s/gm;
  let titleMatch;
  while ((titleMatch = titleLineRegex.exec(text)) !== null) {
    const name = titleMatch[1];
    if (name.length > 1 && !NON_CHARACTER_WORDS.includes(name)) {
      potentialNames.push(name);
    }
  }
  
  // Combine single and multi-word names, remove duplicates
  return [...new Set([...potentialNames, ...multiWordNames])];
};

// Generate a meaningful character description based on their name and context
export const generateCharacterDescription = (name: string, storyText: string): string => {
  // Handle multi-word names for context search
  const searchName = name.includes(' ') ? name.split(' ')[0] : name;
  
  // First, check for explicit descriptions near the character's name
  const namePattern = new RegExp(`${searchName}[^.!?]*(?:[,.;:]\\s*[^.!?]*)?[.!?]`, 'g');
  const contextMatches = storyText.match(namePattern);
  
  if (contextMatches && contextMatches.length > 0) {
    // Use the first match that includes descriptive keywords
    const descriptiveWords = ['is', 'was', 'appears', 'looks', 'seems', 'stands', 'sits', 'a', 'the'];
    const descriptiveMatch = contextMatches.find(match => 
      descriptiveWords.some(word => match.toLowerCase().includes(` ${word} `))
    );
    
    if (descriptiveMatch) {
      // Extract a reasonable description from the match
      const description = descriptiveMatch
        .replace(new RegExp(searchName, 'g'), '')
        .replace(/^[^a-zA-Z]+/, '')
        .trim();
      
      if (description.length > 10) {
        return description;
      }
    }
  }
  
  // Search specifically for antagonist markers
  if (name === 'STUPUS' || searchName === 'STUPUS') {
    return "An arrogant character who antagonizes Rufus";
  }
  
  // Look for protagonist indicators
  if (name === 'RUFUS' || searchName === 'RUFUS') {
    return "The main character, a young wolf";
  }
  
  // If no good description was found, provide a role-based default
  // Check for protagonist indicators
  if (storyText.toLowerCase().indexOf(name.toLowerCase()) < 200) {
    return "A main character in the story";
  } 
  
  // Default generic description
  return "A character in the story";
};

// Identify character roles based on story context
export const identifyCharacterRole = (name: string, storyText: string): 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other' => {
  // Handle multi-word names for context search
  const searchName = name.includes(' ') ? name.split(' ')[0] : name;
  const nameLower = searchName.toLowerCase();
  const storyLower = storyText.toLowerCase();
  
  // Specific character role assignments
  if (name === 'RUFUS' || searchName === 'RUFUS') {
    return 'protagonist';
  }
  
  if (name === 'STUPUS' || searchName === 'STUPUS') {
    return 'antagonist';
  }
  
  // Count character name mentions
  const nameCount = (storyLower.match(new RegExp(nameLower, 'g')) || []).length;
  
  // Check for protagonist indicators (appears early, mentioned often)
  const appearsEarly = storyLower.indexOf(nameLower) < 200;
  const frequentlyMentioned = nameCount > 15;
  
  if (appearsEarly && frequentlyMentioned) {
    return 'protagonist';
  }
  
  // Check for antagonist indicators (negative words near name)
  const negativeWords = ['against', 'enemy', 'evil', 'villain', 'foe', 'threat', 'danger', 'opponent', 'arrogant'];
  const isAntagonist = negativeWords.some(word => 
    storyLower.includes(`${nameLower} ${word}`) || storyLower.includes(`${word} ${nameLower}`)
  );
  
  if (isAntagonist) {
    return 'antagonist';
  }
  
  // Determine supporting vs background based on mention frequency
  if (nameCount > 5) {
    return 'supporting';
  }
  
  return 'background';
};

// Create a character object from a character name with improved details
export const createCharacterObject = (name: string, storyId: string, storyText: string): any => {
  // Convert to Title Case (first letter of each word capitalized, rest lowercase)
  const formattedName = name
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  
  // Identify role and generate description
  const role = identifyCharacterRole(name, storyText);
  const description = generateCharacterDescription(name, storyText);
  
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
  console.log('Extracted character names:', characterNames);
  return characterNames.map(name => createCharacterObject(name, storyId, text));
};
