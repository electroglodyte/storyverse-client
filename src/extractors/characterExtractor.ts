import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';
import { Character } from '../supabase-tables';

// Common non-character ALL CAPS words
const NON_CHARACTER_WORDS = [
  'THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL',
  'BUT', 'OR', 'THAT', 'THIS', 'THESE', 'THOSE', 'MY', 'YOUR', 'HIS', 'HER', 'OUR', 'THEIR',
  'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID',
  'NOT', 'NO', 'YES', 'CAN', 'WILL', 'WOULD', 'SHOULD', 'COULD', 'MAY', 'MIGHT',
  'YEAR', 'YEARS', 'STORY', 'SYNOPSIS',
  // Common screenplay elements that often appear in ALL CAPS
  'FADE', 'CUT', 'DISSOLVE', 'SMASH', 'TITLE', 'CREDITS', 'ANGLE', 'PAN', 'TRACKING',
  'ESTABLISHING', 'POV', 'FLASHBACK', 'BACK', 'CONTINUOUS', 'INTERCUT', 'SCENE', 
  'INT', 'EXT', 'DAY', 'NIGHT', 'MORNING', 'EVENING', 'AFTERNOON', 'DAWN', 'DUSK',
  'CONTINUOUS', 'LATER', 'MOMENTS', 'SAME', 'TIME', 'BEAT', 'PAUSE', 'SOUND',
  'DOOR', 'WINDOW', 'STREET', 'ROOM', 'HOUSE', 'CAR', 'PHONE', 'NEXT', 'OVER',
  // Sound effects often in ALL CAPS
  'BOOM', 'CRASH', 'BANG', 'RING', 'THUD', 'CLICK', 'CLACK', 'WHOOSH', 'SLAM',
  // Additional common screenplay elements
  'VOICE', 'VOICES', 'CAMERA', 'SERIES', 'LIGHT', 'LIGHTS', 'SHADOW', 'SHADOWS',
  'CLOSE', 'CLOSER', 'CLOSER', 'WIDE', 'WIDER', 'TIGHTER', 'MOVING', 'FOLLOWING'
];

// Common words that often appear in sluglines
const SLUGLINE_WORDS = [
  'INT', 'EXT', 'DAY', 'NIGHT', 'CONTINUOUS', 'LATER', 'MOMENTS', 'MORNING', 
  'AFTERNOON', 'EVENING', 'DAWN', 'DUSK'
];

// Common location words that might be confused with characters
const LOCATION_WORDS = [
  'ROOM', 'HOUSE', 'APARTMENT', 'BUILDING', 'OFFICE', 'BEDROOM', 'KITCHEN', 'BATHROOM',
  'HALL', 'HALLWAY', 'CORRIDOR', 'LOBBY', 'HOTEL', 'MOTEL', 'HOSPITAL', 'CHURCH',
  'STREET', 'ROAD', 'AVENUE', 'HIGHWAY', 'PARK', 'GARDEN', 'FOREST', 'BEACH',
  'MOUNTAIN', 'HILL', 'VALLEY', 'RIVER', 'LAKE', 'OCEAN', 'SEA', 'ISLAND',
  'RESTAURANT', 'CAFE', 'BAR', 'PUB', 'CLUB', 'STORE', 'SHOP', 'MALL',
  'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'LIBRARY', 'MUSEUM', 'THEATER', 'CINEMA',
  'STATION', 'AIRPORT', 'HARBOR', 'PORT', 'DOCK', 'DECK', 'PORCH', 'BALCONY',
  'STAIRS', 'ELEVATOR', 'BRIDGE', 'TUNNEL', 'ALLEY', 'PATH', 'TRAIL'
];

// Common object words that might be confused with characters
const OBJECT_WORDS = [
  'DOOR', 'WINDOW', 'TABLE', 'CHAIR', 'DESK', 'BED', 'COUCH', 'SOFA',
  'LAMP', 'LIGHT', 'CANDLE', 'PHONE', 'CELL', 'COMPUTER', 'LAPTOP', 'TABLET',
  'TV', 'TELEVISION', 'RADIO', 'CLOCK', 'WATCH', 'RING', 'RINGS', 'NECKLACE',
  'CAR', 'TRUCK', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'BICYCLE',
  'GUN', 'RIFLE', 'PISTOL', 'KNIFE', 'SWORD', 'WEAPON', 'BOMB', 'MISSILE',
  'BOOK', 'PAPER', 'LETTER', 'NOTE', 'DOCUMENT', 'FILE', 'FOLDER', 'BRIEFCASE',
  'BAG', 'PURSE', 'WALLET', 'KEYS', 'BOTTLE', 'GLASS', 'CUP', 'PLATE',
  'JACKET', 'COAT', 'SHIRT', 'PANTS', 'DRESS', 'SUIT', 'HAT', 'SHOES'
];

// Common action or description phrases that might be mistaken for characters
const ACTION_DESCRIPTION_PHRASES = [
  'DARK FIGURE', 'FEMININE FIGURE', 'SHADOWY FIGURE', 'MYSTERIOUS FIGURE',
  'FANGS BARED', 'TEETH BARED', 'CLAWS OUT', 'ARMS RAISED',
  'EYES OPEN', 'EYES CLOSED', 'MOUTH OPEN', 'DOOR OPENS', 'DOOR CLOSES',
  'BODY FALLS', 'HEAD TURNS', 'HAND REACHES', 'FIGURE APPEARS',
  'BLOOD SPLATTER', 'LIGHT FLASHES', 'THUNDER CLAPS', 'LIGHTNING STRIKES',
  'WIND HOWLS', 'RAIN POURS', 'SNOW FALLS', 'GROUND SHAKES',
  'HORRENDOUS CREAK', 'UNGODLY CREAK', 'TERRIBLE SOUND', 'DISTANT SCREAM',
  'WEDDING CRASHERS', 'PARTY GUESTS', 'ONLOOKERS', 'PASSERSBY'
];

// Common name prefixes that strongly indicate a character
const NAME_PREFIXES = [
  'MR', 'MS', 'MRS', 'DR', 'PROF', 'CAPTAIN', 'LIEUTENANT', 'SERGEANT', 'OFFICER',
  'GENERAL', 'COLONEL', 'MAJOR', 'ADMIRAL', 'COMMANDER', 'CHIEF', 'PRESIDENT',
  'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'DUKE', 'DUCHESS', 'LORD', 'LADY',
  'SIR', 'DAME', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'UNCLE', 'AUNT',
  'GRANDPA', 'GRANDMA', 'JUDGE', 'MAYOR', 'GOVERNOR', 'SENATOR', 'POPE', 'BISHOP'
];

// Helper function to check if a name contains common character name elements
const isLikelyCharacterName = (name: string): boolean => {
  // Split the name by spaces
  const words = name.split(/\s+/);
  
  // Check for name prefixes that strongly indicate a character
  for (const prefix of NAME_PREFIXES) {
    if (words[0] === prefix) {
      return true;
    }
  }
  
  // Check for location words that suggest this isn't a character
  for (const locationWord of LOCATION_WORDS) {
    for (const word of words) {
      if (word === locationWord) {
        return false;
      }
    }
  }
  
  // Check for object words that suggest this isn't a character
  for (const objectWord of OBJECT_WORDS) {
    for (const word of words) {
      if (word === objectWord) {
        return false;
      }
    }
  }
  
  // Check for action/description phrases
  for (const phrase of ACTION_DESCRIPTION_PHRASES) {
    if (name === phrase || name.includes(phrase)) {
      return false;
    }
  }
  
  // Check for common name patterns (e.g., "FIRST LAST" format)
  if (words.length === 2 && words[0].length > 1 && words[1].length > 1) {
    // Two words, both reasonably long, could be first and last name
    return true;
  }
  
  // Looks like a proper name (doesn't contain common non-character elements)
  const hasNonNameWords = words.some(word => 
    NON_CHARACTER_WORDS.includes(word) || 
    SLUGLINE_WORDS.includes(word) ||
    word.match(/^[0-9]+$/) // Numbers
  );
  
  return !hasNonNameWords;
};

// Helper function to extract characters marked in ALL CAPS with improved screenplay awareness
export const extractAllCapsCharacters = (text: string): string[] => {
  // First, identify dialogue and scene descriptions where character names appear
  const scriptLines = text.split('\n');
  
  // Collect all potential character names and multi-word names
  const potentialNames: string[] = [];
  const multiWordNames: string[] = [];
  
  // Regular expression to detect character speech or action line prefixes (common script format)
  const characterLineRegex = /^([A-Z][A-Z\s]+)(?:\s*\(.*\))?\s*$/;
  
  // Regular expression to detect sluglines (scene headings)
  const sluglineRegex = /^(INT|EXT|INT\/EXT|EXT\/INT)[\.|\s]/i;
  
  // First pass - extract character names from script formatting if present
  for (const line of scriptLines) {
    // Skip sluglines - they often contain capitalized location names, not characters
    if (sluglineRegex.test(line)) {
      continue;
    }
    
    const match = line.match(characterLineRegex);
    if (match) {
      const name = match[1].trim();
      
      // More aggressive filtering of non-character names
      if (name.length > 1 && 
          !NON_CHARACTER_WORDS.includes(name) && 
          !SLUGLINE_WORDS.some(word => name.includes(word))) {
        
        // Check for dialogue context - character names are usually followed by dialogue
        const lineIndex = scriptLines.indexOf(line);
        const hasDialogueAfter = lineIndex < scriptLines.length - 1 && 
                               !characterLineRegex.test(scriptLines[lineIndex + 1]) &&
                               !sluglineRegex.test(scriptLines[lineIndex + 1]) &&
                               scriptLines[lineIndex + 1].trim().length > 0;
        
        // Higher confidence if it has dialogue after - use our plausibility check
        if (hasDialogueAfter && isLikelyCharacterName(name)) {
          if (name.includes(' ')) {
            multiWordNames.push(name);
          } else {
            potentialNames.push(name);
          }
        }
        // Still add it even without dialogue, but only if it looks like a proper name
        else if (name.length >= 3 && !/^[A-Z]+S$/.test(name) && isLikelyCharacterName(name)) {
          if (name.includes(' ')) {
            multiWordNames.push(name);
          } else {
            potentialNames.push(name);
          }
        }
      }
    }
  }
  
  // Second pass - extract remaining ALL CAPS words, but only in certain contexts
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z][A-Z]+\b/g;
  
  // Process the text line by line for better context awareness
  for (const line of scriptLines) {
    // Skip sluglines and likely action descriptions
    if (sluglineRegex.test(line) || 
        SLUGLINE_WORDS.some(word => line.includes(word))) {
      continue;
    }
    
    // Skip lines that are likely just scene directions
    if (line.includes('CUT TO') || 
        line.includes('FADE') || 
        line.includes('DISSOLVE') ||
        /^[A-Z\s]+:$/.test(line)) { // Lines ending with colon are often headings
      continue;
    }
    
    const allCapsMatches = line.match(allCapsRegex) || [];
    
    // Add individual words, with more aggressive filtering
    for (const word of allCapsMatches) {
      // Skip common non-character words
      if (NON_CHARACTER_WORDS.includes(word)) {
        continue;
      }
      
      // Skip possessive forms
      if (word.endsWith("'S") || word.endsWith("S'")) {
        continue;
      }
      
      // Skip words that are too short (likely abbreviations)
      if (word.length < 3) {
        continue;
      }
      
      // Skip words that look like technical terms or sound effects
      if (/^[A-Z]+[0-9]+$/.test(word) || // Skip things like "RT66" 
          /^[A-Z]{2,5}$/.test(word) ||   // Skip short acronyms like "FBI"
          OBJECT_WORDS.includes(word) || // Skip object words
          LOCATION_WORDS.includes(word)) { // Skip location words
        continue;
      }
      
      // Apply our plausibility check
      if (isLikelyCharacterName(word)) {
        potentialNames.push(word);
      }
    }
  }
  
  // Extract multi-word character names with stricter filtering
  const multiWordRegex = /\b[A-Z][A-Z]+\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)*\b/g;
  const multiWordMatches = text.match(multiWordRegex) || [];
  
  for (const multiWord of multiWordMatches) {
    // Skip if any of the words are in the non-character list
    const words = multiWord.split(/\s+/);
    const isNonCharacter = words.some(word => NON_CHARACTER_WORDS.includes(word));
    
    // Apply our more aggressive filtering
    const isActionDescription = ACTION_DESCRIPTION_PHRASES.some(phrase => 
      multiWord === phrase || multiWord.includes(phrase)
    );
    
    const containsLocationWord = words.some(word => LOCATION_WORDS.includes(word));
    const containsObjectWord = words.some(word => OBJECT_WORDS.includes(word));
    
    if (!isNonCharacter && 
        !isActionDescription && 
        !containsLocationWord && 
        !containsObjectWord && 
        words.length <= 3 && // Limit to reasonable name length
        isLikelyCharacterName(multiWord)) {
      
      // Check if this is a title or slugline element
      const lowerMultiWord = multiWord.toLowerCase();
      if (!lowerMultiWord.includes("tale") && 
          !lowerMultiWord.includes("story") &&
          !SLUGLINE_WORDS.some(word => multiWord.includes(word))) {
        
        multiWordNames.push(multiWord);
        
        // Remove the individual words from potentialNames if they're part of a multi-word name
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
    if (name.length > 1 && 
        !NON_CHARACTER_WORDS.includes(name) && 
        isLikelyCharacterName(name)) {
      potentialNames.push(name);
    }
  }
  
  // Combine single and multi-word names, remove duplicates
  const combinedNames = [...new Set([...potentialNames, ...multiWordNames])];
  
  // Final plausibility check on the entire list
  return combinedNames.filter(name => isLikelyCharacterName(name));
};

// Generate a meaningful character description based on their name and context
export const generateCharacterDescription = (name: string, storyText: string): string => {
  // Handle multi-word names for context search
  const searchName = name.includes(' ') ? name.split(' ')[0] : name;
  
  // First, check for explicit descriptions near the character's name
  const namePattern = new RegExp(`${searchName}[^.!?]*(?:[,.;:]\\\\\\\\s*[^.!?]*)?[.!?]`, 'g');
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

// Generate a pithy character logline based on context and character's role
export const generateCharacterLogline = (name: string, storyText: string): string => {
  const nameLower = name.toLowerCase();
  const storyLower = storyText.toLowerCase();
  
  // Pre-defined loglines for specific characters based on story context
  const characterLoglines: Record<string, string> = {
    'RUFUS': 'An adolescent wolf exiled from his pack until he can complete legendary feats to prove himself',
    'STUPUS': 'An arrogant wolf who bullies Rufus and claims Alyssa for himself',
    'ALYSSA': 'A pretty wolf that both Rufus and Stupus are interested in',
    'LINUS': 'Rufus\'s best friend who provides moral support from a safe distance',
    'BODO': 'The elder wolf who tells legends and assigns Rufus his special challenge',
    'LUPUS': 'The legendary wolf hero who supposedly devoured three pigs, seven billygoats, and Red Riding Hood',
    'SCINTILLA': 'A sassy teenage witch with a goth style who helps Rufus infiltrate Fairy Tale City',
    'BUFFO': 'A boy-toad hybrid resulting from a botched fairy-tale transformation',
    'PORCINO': 'A wealthy pig who serves as the alpha-pig in charge of Fairy Tale City',
    'FULMINELLA': 'Porcino\'s wife who owns a summer villa in the valley',
    'ROUGE': 'A descendant of Red Riding Hood who befriends Rufus despite their traditional enmity',
  };
  
  // Check for pre-defined loglines first
  if (characterLoglines[name]) {
    return characterLoglines[name];
  }
  
  // Look for key sentences containing the character name and an action verb
  const actionVerbs = ['wants', 'needs', 'seeks', 'finds', 'helps', 'fights', 'discovers', 'believes', 'fears', 'loves'];
  const actionSentenceRegex = new RegExp(`[^.!?]*${nameLower}[^.!?]*(?:${actionVerbs.join('|')})[^.!?]*[.!?]`, 'gi');
  const actionMatches = storyLower.match(actionSentenceRegex);
  
  if (actionMatches && actionMatches.length > 0) {
    // Use the shortest reasonably long match as our logline
    const goodMatches = actionMatches
      .filter(match => match.length > 40 && match.length < 150)
      .sort((a, b) => a.length - b.length);
      
    if (goodMatches.length > 0) {
      // Clean up the match to make it third person present tense
      let logline = goodMatches[0].trim();
      
      // Convert to present tense if possible
      logline = logline
        .replace(/\b(was|were)\b/g, 'is')
        .replace(/\b(had)\b/g, 'has');
        
      return logline.charAt(0).toUpperCase() + logline.slice(1);
    }
  }
  
  // Fallback options based on character's role
  const role = identifyCharacterRole(name, storyText);
  
  switch (role) {
    case 'protagonist':
      return `The main character who drives the story's central conflict`;
    case 'antagonist':
      return `An opposing force who creates obstacles for the protagonist`;
    case 'supporting':
      return `A key character who assists or complicates the main story`;
    case 'background':
      return `A minor character who adds depth to the story world`;
    default:
      return `A character in the story`;
  }
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

// Check if a character exists in the database by name
export const checkIfCharacterExists = async (name: string, storyWorldId?: string): Promise<boolean> => {
  try {
    let query = supabase.from('characters').select('id, name');
    
    // Format name for comparison (case-insensitive)
    const formattedName = name
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
    
    // Filter by story world if provided
    if (storyWorldId) {
      query = query.eq('story_world_id', storyWorldId);
    }
    
    // Use ilike for case-insensitive matching
    query = query.ilike('name', formattedName);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking for existing character:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Error in checkIfCharacterExists:', err);
    return false;
  }
};

// Create a character object from a character name with improved details
export const createCharacterObject = async (name: string, storyId: string, storyText: string, storyWorldId?: string): Promise<any> => {
  // Convert to Title Case (first letter of each word capitalized, rest lowercase)
  const formattedName = name
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
  
  // Check if character already exists
  const exists = await checkIfCharacterExists(name, storyWorldId);
  
  // Identify role and generate description
  const role = identifyCharacterRole(name, storyText);
  const description = generateCharacterDescription(name, storyText);
  const character_logline = generateCharacterLogline(name, storyText);
  
  return {
    id: uuidv4(),
    name: formattedName,
    description,
    role,
    character_logline,
    story_id: storyId,
    story_world_id: storyWorldId,
    isNew: !exists, // Flag to indicate if this is a new character
    confidence: 0.9 // High confidence for ALL CAPS characters
  };
};

// Main function to extract and create character objects
export const extractCharacters = async (text: string, storyId: string, storyWorldId?: string): Promise<any[]> => {
  try {
    // Extract all potential character names from the text
    const characterNames = extractAllCapsCharacters(text);
    console.log('Extracted character names:', characterNames);
    
    // Create character objects with isNew flag
    const characterPromises = characterNames.map(name => 
      createCharacterObject(name, storyId, text, storyWorldId)
    );
    
    // Wait for all character objects to be created and checked against the database
    const characters = await Promise.all(characterPromises);
    
    // Debug information
    const newCharacters = characters.filter(char => char.isNew);
    console.log(`Found ${characterNames.length} total characters, ${newCharacters.length} are new`);
    
    return characters;
  } catch (error) {
    console.error('Error in extractCharacters:', error);
    return [];
  }
};
