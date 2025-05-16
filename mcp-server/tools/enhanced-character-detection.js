//  Enhanced character detection system for StoryVerse
// This module improves character detection and extraction from stories

import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced character detection that employs multiple techniques to identify characters
 * 
 * @param {string} text - The full text of the story to analyze
 * @param {string} storyId - The ID of the story to link characters to
 * @return {Array} - Array of detected characters with their attributes
 */
export const enhancedCharacterExtraction = async (text, storyId) => {
  const characterMap = new Map();
  
  // Techniques to identify characters
  const techniques = [
    detectNamedCharacters,
    detectDialogueSpeakers,
    detectCapitalizedNames,
    detectPronouns,
    detectCharacterDescriptions,
    detectRelationships,
    detectTitlesAndHonorifics,
    detectActionVerbs
  ];
  
  // Apply each detection technique
  for (const technique of techniques) {
    const detectedCharacters = await technique(text);
    
    for (const character of detectedCharacters) {
      if (!characterMap.has(character.name)) {
        characterMap.set(character.name, {
          id: uuidv4(),
          name: character.name,
          story_id: storyId,
          ...character,
          confidence: character.confidence || 0.5,
          sources: [technique.name]
        });
      } else {
        // Update existing character with new information
        const existingChar = characterMap.get(character.name);
        
        // Update confidence based on multiple detections
        existingChar.confidence = Math.min(
          0.95, 
          existingChar.confidence + (character.confidence || 0.1)
        );
        
        // Add detection source
        if (!existingChar.sources.includes(technique.name)) {
          existingChar.sources.push(technique.name);
        }
        
        // Merge additional information
        Object.keys(character).forEach(key => {
          if (key !== 'name' && key !== 'id' && key !== 'story_id' && 
              character[key] && (!existingChar[key] || existingChar[key].length < character[key].length)) {
            existingChar[key] = character[key];
          }
        });
      }
    }
  }
  
  // Final post-processing
  const characters = Array.from(characterMap.values());
  
  // Distinguish primary/secondary/background characters based on frequency
  const frequencyMap = new Map();
  for (const character of characters) {
    const nameRegex = new RegExp(`\\b${character.name}\\b`, 'gi');
    const matches = text.match(nameRegex) || [];
    frequencyMap.set(character.name, matches.length);
  }
  
  // Sort by frequency
  const sortedFrequencies = [...frequencyMap.entries()].sort((a, b) => b[1] - a[1]);
  
  // Assign roles based on frequency ranking
  for (let i = 0; i < sortedFrequencies.length; i++) {
    const [name, frequency] = sortedFrequencies[i];
    const character = characters.find(c => c.name === name);
    
    if (i === 0) {
      // Main character - protagonist
      character.role = 'protagonist';
    } else if (i < 3 && frequency > 10) {
      // Top frequently mentioned characters
      character.role = character.role || 'supporting';
      if (charactersAreOpposed(text, sortedFrequencies[0][0], name)) {
        character.role = 'antagonist';
      }
    } else if (frequency < 3) {
      // Rarely mentioned
      character.role = 'background';
    } else {
      // Default
      character.role = character.role || 'supporting';
    }
  }
  
  return characters;
};

/**
 * Detect characters based on proper names (capitalized words not at start of sentences)
 */
const detectNamedCharacters = async (text) => {
  const characters = [];
  
  // Find patterns like "Name" or "First Last"
  const nameMatches = text.match(/(?<!\\.)(?<!^|\\?|\\!)[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*/g) || [];
  
  // Process potential character names
  for (const name of new Set(nameMatches)) {
    // Filter out common non-character words, places, etc.
    if (name.length < 3) continue;
    if (/^(The|And|But|Or|If|Then|When|Where|Why|How|What|This|That|These|Those)$/.test(name)) continue;
    
    // Check frequency to determine if it's likely a character
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    const frequency = (text.match(nameRegex) || []).length;
    
    // Names that appear multiple times are likely characters
    if (frequency >= 2) {
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
        } else if (/supporting|helper|friend|ally/i.test(context)) {
          role = 'supporting';
        }
        
        // Appearance extraction
        const appearanceMatch = context.match(/(?:appears|looks|is|was)(?:\\s+\\w+){0,3}\\s+(?:tall|short|young|old|beautiful|handsome|wearing|dressed|thin|fat|bald|dark|pale|slender)([^.!?;]*)/i) || [];
        if (appearanceMatch[1] && appearanceMatch[1].length > appearance.length) {
          appearance = appearanceMatch[1].trim();
        }
        
        // Personality extraction
        const personalityMatch = context.match(/(?:personality|character|is|was)(?:\\s+\\w+){0,3}\\s+(?:kind|mean|brave|cowardly|intelligent|stupid|friendly|hostile|caring|selfish|ambitious|lazy)([^.!?;]*)/i) || [];
        if (personalityMatch[1] && personalityMatch[1].length > personality.length) {
          personality = personalityMatch[1].trim();
        }
      }
      
      characters.push({
        name,
        role,
        appearance: appearance || undefined,
        personality: personality || undefined,
        confidence: Math.min(0.5 + (frequency * 0.05), 0.9)
      });
    }
  }
  
  return characters;
};

/**
 * Detect characters from dialogue (speakers)
 */
const detectDialogueSpeakers = async (text) => {
  const characters = [];
  const speakerSet = new Set();
  
  // Find dialogue patterns: "Speaker said/asked/replied..."
  const dialoguePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|asked|replied|shouted|whispered|mumbled|responded|exclaimed|questioned)/g,
    /"([^"]+)"\s*,\s*(?:said|muttered|whispered)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  for (const pattern of dialoguePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const speaker = match[1];
      if (speaker && speaker.length > 2 && /^[A-Z]/.test(speaker)) {
        speakerSet.add(speaker);
      }
    }
  }
  
  // Convert detected speakers to characters
  for (const speaker of speakerSet) {
    characters.push({
      name: speaker,
      confidence: 0.8, // High confidence for dialogue speakers
      role: 'unknown' // Will be determined later
    });
  }
  
  return characters;
};

/**
 * Detect capitalized names that might be characters
 */
const detectCapitalizedNames = async (text) => {
  const characters = [];
  const paragraphs = text.split(/\n\n+/);
  const nameSet = new Set();
  
  // Process each paragraph to avoid false positives from sentence starts
  for (const paragraph of paragraphs) {
    // Find capitalized words inside sentences
    const sentences = paragraph.split(/[.!?]\s+/);
    for (const sentence of sentences) {
      // Skip empty or short sentences
      if (sentence.length < 5) continue;
      
      // Find capitalized words not at the start of sentences
      const words = sentence.split(/\s+/);
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
          // Avoid common non-character capitalized words
          if (!/^(The|And|But|Or|If|Then|When|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/.test(word)) {
            nameSet.add(word);
          }
        }
      }
    }
  }
  
  // Process identified names
  for (const name of nameSet) {
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    const frequency = (text.match(nameRegex) || []).length;
    
    // Names that appear several times are likely characters
    if (frequency >= 3) {
      characters.push({
        name,
        confidence: 0.6 + (Math.min(frequency, 20) * 0.01)
      });
    }
  }
  
  return characters;
};

/**
 * Detect character descriptions (someone who...)
 */
const detectCharacterDescriptions = async (text) => {
  const characters = [];
  
  // Find description patterns
  const descriptionPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+was\s+(?:a|an|the)\s+([^.!?;]+)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+(?:a|an|the)\s+([^.!?;]+)/g
  ];
  
  for (const pattern of descriptionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      const description = match[2];
      
      if (name && name.length > 2 && description && description.length > 3) {
        // Determine possible role from description
        let role = 'unknown';
        if (/protagonist|hero|main character/i.test(description)) {
          role = 'protagonist';
        } else if (/antagonist|villain|enemy/i.test(description)) {
          role = 'antagonist';
        } else if (/supporting|helper|friend/i.test(description)) {
          role = 'supporting';
        }
        
        // Determine if description contains appearance or personality traits
        let appearance = '';
        let personality = '';
        
        if (/tall|short|young|old|beautiful|handsome|wearing|dressed|looks/i.test(description)) {
          appearance = description;
        } else if (/kind|cruel|brave|cowardly|intelligent|stupid|friendly|hostile/i.test(description)) {
          personality = description;
        }
        
        characters.push({
          name,
          role,
          description,
          appearance: appearance || undefined,
          personality: personality || undefined,
          confidence: 0.7
        });
      }
    }
  }
  
  return characters;
};

/**
 * Detect characters from action verbs
 */
const detectActionVerbs = async (text) => {
  const characters = [];
  const actionSet = new Set();
  
  // Common action verbs that characters perform
  const actionVerbs = [
    'walked', 'ran', 'jumped', 'moved', 'sat', 'stood', 'laughed', 'cried',
    'looked', 'saw', 'watched', 'observed', 'heard', 'listened',
    'thought', 'decided', 'planned', 'remembered', 'forgot', 'knew',
    'took', 'gave', 'handed', 'received', 'grabbed', 'held', 
    'ate', 'drank', 'slept', 'woke', 'dreamed', 'smiled', 'frowned'
  ];
  
  // Build regex pattern for action verbs
  const verbPattern = actionVerbs.join('|');
  const actionPattern = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+(${verbPattern})\\b`, 'g');
  
  let match;
  while ((match = actionPattern.exec(text)) !== null) {
    const name = match[1];
    if (name && name.length > 2 && /^[A-Z]/.test(name)) {
      actionSet.add(name);
    }
  }
  
  // Convert detected subjects to characters
  for (const name of actionSet) {
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    const frequency = (text.match(nameRegex) || []).length;
    
    // Names that perform actions and appear multiple times are likely characters
    if (frequency >= 2) {
      characters.push({
        name,
        confidence: 0.7 + (Math.min(frequency, 10) * 0.02)
      });
    }
  }
  
  return characters;
};

/**
 * Detect characters from pronouns and pronoun references
 */
const detectPronouns = async (text) => {
  // This method requires more complex context tracking
  // Not implemented in this basic version
  return [];
};

/**
 * Detect characters from relationship mentions
 */
const detectRelationships = async (text) => {
  const characters = [];
  const relationshipPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:father|mother|brother|sister|son|daughter|friend|enemy|boss|teacher|student)/g,
    /(?:father|mother|brother|sister|son|daughter|friend|enemy|boss|teacher|student)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  for (const pattern of relationshipPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (name && name.length > 2) {
        characters.push({
          name,
          confidence: 0.75
        });
      }
    }
  }
  
  return characters;
};

/**
 * Detect characters from titles and honorifics
 */
const detectTitlesAndHonorifics = async (text) => {
  const characters = [];
  const titlePatterns = [
    /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sir|Lady|Lord|King|Queen|Prince|Princess|Captain|General|Agent)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (name && name.length > 2) {
        characters.push({
          name: match[0], // Include the title with the name
          confidence: 0.85 // High confidence for titled characters
        });
      }
    }
  }
  
  return characters;
};

/**
 * Determine if two characters appear to be opposed to each other
 */
const charactersAreOpposed = (text, char1, char2) => {
  // Look for opposition patterns between characters
  const oppositionPatterns = [
    new RegExp(`${char1}[^.!?;]{1,50}(?:against|versus|vs\.|opposed|fought|battled|attacked|hated|disliked)[^.!?;]{1,50}${char2}`, 'i'),
    new RegExp(`${char2}[^.!?;]{1,50}(?:against|versus|vs\.|opposed|fought|battled|attacked|hated|disliked)[^.!?;]{1,50}${char1}`, 'i')
  ];
  
  for (const pattern of oppositionPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  return false;
};

export default enhancedCharacterExtraction;