// narrative-analysis.js 
// Provides improved analysis tools for story importer

import { supabase } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import enhancedCharacterExtraction from './enhanced-character-detection.js';

/**
 * Analyze a story text and extract comprehensive narrative elements
 * 
 * @param {string} text - The story text to analyze
 * @param {string} title - Story title
 * @param {string} storyId - ID of the story record
 * @param {object} options - Analysis options
 * @returns {object} Extracted narrative elements
 */
export const analyzeStoryText = async (text, title, storyId, options = {}) => {
  try {
    const {
      extractCharacters = true,
      extractLocations = true,
      extractPlotlines = true,
      extractScenes = true,
      interactiveMode = false,
      confidenceThreshold = 0.6
    } = options;
    
    // Initialize results object
    const results = {
      story: {
        id: storyId,
        title
      },
      characters: [],
      locations: [],
      plotlines: [],
      scenes: []
    };
    
    // Step 1: Extract characters
    if (extractCharacters) {
      const characters = await enhancedCharacterExtraction(text, storyId);
      
      // Filter by confidence and add to results
      results.characters = characters
        .filter(char => char.confidence >= confidenceThreshold)
        .map(char => ({
          id: char.id,
          name: char.name,
          role: char.role || 'supporting',
          description: generateCharacterDescription(char),
          appearance: char.appearance,
          personality: char.personality,
          confidence: char.confidence,
          detectionMethods: char.sources || []
        }));
    }
    
    // Step 2: Extract locations
    if (extractLocations) {
      const locations = await extractStoryLocations(text, storyId);
      
      // Filter by confidence
      results.locations = locations
        .filter(loc => loc.confidence >= confidenceThreshold)
        .map(loc => ({
          id: loc.id,
          name: loc.name,
          description: loc.description,
          locationType: loc.locationType || loc.location_type,
          confidence: loc.confidence
        }));
    }
    
    // Step 3: Extract plotlines
    if (extractPlotlines) {
      const plotlines = await extractStoryPlotlines(text, storyId, results.characters);
      results.plotlines = plotlines.map(plot => ({
        id: plot.id,
        title: plot.title,
        description: plot.description,
        plotlineType: plot.plotline_type || plot.type,
        mainCharacters: plot.mainCharacters || []
      }));
    }
    
    // Step 4: Extract scenes (optional)
    if (extractScenes) {
      const scenes = await extractStoryScenes(text, storyId, results.characters, results.locations);
      results.scenes = scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        content: scene.content,
        characters: scene.characters || [],
        locations: scene.locations || []
      }));
    }
    
    return results;
  } catch (error) {
    console.error('Error in analyzeStoryText:', error);
    throw error;
  }
};

/**
 * Generate a descriptive summary for a character
 */
const generateCharacterDescription = (character) => {
  const parts = [];
  
  // Start with role
  if (character.role === 'protagonist') {
    parts.push('The main character');
  } else if (character.role === 'antagonist') {
    parts.push('The primary antagonist');
  } else if (character.role === 'supporting') {
    parts.push('A supporting character');
  } else if (character.role === 'background') {
    parts.push('A minor character');
  } else {
    parts.push('A character in the story');
  }
  
  // Add appearance if available
  if (character.appearance) {
    parts.push(`who ${character.appearance}`);
  }
  
  // Add personality if available
  if (character.personality) {
    if (character.appearance) {
      parts.push(`and is ${character.personality}`);
    } else {
      parts.push(`who is ${character.personality}`);
    }
  }
  
  return parts.join(' ');
};

/**
 * Extract locations from story text
 */
const extractStoryLocations = async (text, storyId) => {
  // First, identify potential locations
  const locationPatterns = [
    // Setting introductions: "In the [Location]"
    /\b(?:in|at|to|from) the ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    
    // Direct location mentions
    /\bThe ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*) (?:was|is|had|has)/g,
    
    // Location descriptions
    /\b(?:village|town|city|castle|house|building|forest|mountain|lake|river|ocean|valley|kingdom|realm|land|country|room|hall|chamber) (?:of|called|named) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  const locationSet = new Set();
  const locationMap = new Map();
  
  // Extract potential locations from patterns
  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const location = match[1];
      
      // Filter out likely non-locations
      if (location.length < 3) continue;
      if (/^(The|And|But|Or|If|Then|When|Where|Why|How|What|This|That|These|Those)$/.test(location)) continue;
      
      // Skip if likely a person's name (preceded by honorifics, etc.)
      const prevText = text.substring(Math.max(0, match.index - 20), match.index);
      if (/\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Professor|Sir|Lady|Lord)\s*$/.test(prevText)) continue;
      
      locationSet.add(location);
    }
  }
  
  // Process potential locations
  for (const location of locationSet) {
    // Check frequency
    const locationRegex = new RegExp(`\\b${location}\\b`, 'g');
    const frequency = (text.match(locationRegex) || []).length;
    
    if (frequency >= 2) {
      // Extract location description and type
      const contextRegex = new RegExp(`.{0,100}\\b${location}\\b.{0,150}`, 'g');
      const contexts = text.match(contextRegex) || [];
      let description = '';
      let locationType = 'other';
      
      for (const context of contexts) {
        // Extract description
        const descRegex = new RegExp(`${location}\\s+(?:was|is|seemed|looked)\\s+(.*?)(?:\\.|,|;|:)`, 'i');
        const descMatch = context.match(descRegex);
        if (descMatch && descMatch[1] && descMatch[1].length > description.length) {
          description = descMatch[1].trim();
        }
        
        // Determine location type
        if (/\b(?:city|town|village|suburb|neighborhood)\b/i.test(context)) {
          locationType = 'city';
        } else if (/\b(?:building|house|apartment|castle|tower|room|hall|chamber)\b/i.test(context)) {
          locationType = 'building';
        } else if (/\b(?:forest|mountain|river|lake|ocean|sea|beach|valley|hill|cave|cliff)\b/i.test(context)) {
          locationType = 'natural';
        } else if (/\b(?:country|nation|state|province|county|territory|kingdom|realm|empire)\b/i.test(context)) {
          locationType = 'country';
        }
      }
      
      // Create location object
      locationMap.set(location, {
        id: uuidv4(),
        name: location,
        description: description || `A location in the story`,
        story_id: storyId,
        location_type: locationType,
        confidence: Math.min(0.4 + (frequency * 0.05), 0.9)
      });
    }
  }
  
  return Array.from(locationMap.values());
};

/**
 * Extract plotlines from a story
 */
const extractStoryPlotlines = async (text, storyId, characters = []) => {
  const plotlines = [];
  
  // Extract main plot (character-focused)
  if (characters.length > 0) {
    // Find the protagonist
    const protagonist = characters.find(c => c.role === 'protagonist');
    
    if (protagonist) {
      plotlines.push({
        id: uuidv4(),
        title: "Main Character Journey",
        description: `${protagonist.name}'s journey through the story`,
        plotline_type: 'main',
        mainCharacters: [protagonist.id]
      });
    }
    
    // Find antagonist plot
    const antagonist = characters.find(c => c.role === 'antagonist');
    
    if (antagonist) {
      plotlines.push({
        id: uuidv4(),
        title: "Conflict Plot",
        description: `The conflict between ${protagonist?.name || 'the protagonist'} and ${antagonist.name}`,
        plotline_type: 'conflict',
        mainCharacters: [protagonist?.id, antagonist.id].filter(Boolean)
      });
    }
  }
  
  // Look for common plotline themes
  const plotThemes = [
    { keyword: /love|romance|relationship|marriage|wedding/, type: 'romance', title: 'Romance Plot' },
    { keyword: /quest|mission|journey|adventure|discover/, type: 'quest', title: 'Quest Plot' },
    { keyword: /mystery|solve|investigate|detective|clue/, type: 'mystery', title: 'Mystery Plot' },
    { keyword: /war|battle|fight|conflict|struggle/, type: 'conflict', title: 'Conflict Plot' },
    { keyword: /grow|learn|change|become|realize|understand/, type: 'coming-of-age', title: 'Coming of Age' }
  ];
  
  // Check for theme presence
  for (const theme of plotThemes) {
    if (theme.keyword.test(text)) {
      // Find content related to this theme
      const themeRegex = new RegExp(`.{0,200}${theme.keyword.source}.{0,200}`, 'gi');
      const themeMatches = text.match(themeRegex) || [];
      
      if (themeMatches.length >= 2) {
        // This theme appears multiple times, likely an actual plotline
        const description = themeMatches[0].trim();
        
        // Don't duplicate existing plotlines
        if (!plotlines.some(p => p.plotline_type === theme.type)) {
          plotlines.push({
            id: uuidv4(),
            title: theme.title,
            description: `A plotline centered around ${theme.type}`,
            plotline_type: theme.type,
            mainCharacters: []
          });
        }
      }
    }
  }
  
  return plotlines;
};

/**
 * Extract scenes from a story
 */
const extractStoryScenes = async (text, storyId, characters = [], locations = []) => {
  const scenes = [];
  
  // Split text into potential scenes
  const sceneDelimiters = [
    /\n\s*\n+\s*(?:Chapter|Scene|Act|Part)\s+\w+/gi, // Chapter/Scene breaks
    /\n\s*\n+\s*\*\s*\*\s*\*/g,                      // Asterisk breaks
    /\n\s*\n+\s*[-_]{3,}\s*\n/g,                    // Line breaks
    /\n\s*\n+\s*#\s*\n/g                            // Hash breaks
  ];
  
  // Combine all delimiters
  const delimiterPattern = new RegExp(
    sceneDelimiters.map(d => d.source).join('|'), 
    'g'
  );
  
  // Split at scene delimiters, preserving delimiters
  let segmentTexts = text.split(delimiterPattern);
  let delimiters = text.match(delimiterPattern) || [];
  
  // If no explicit scene delimiters, use paragraph breaks for longer texts
  if (segmentTexts.length <= 1 && text.length > 1000) {
    const paragraphs = text.split(/\n\s*\n+/);
    
    // Group paragraphs into scenes (roughly 3-5 paragraphs per scene)
    const parGroupSize = Math.max(3, Math.min(5, Math.ceil(paragraphs.length / 8)));
    
    for (let i = 0; i < paragraphs.length; i += parGroupSize) {
      const sceneText = paragraphs.slice(i, i + parGroupSize).join('\n\n');
      if (sceneText.trim().length > 0) {
        segmentTexts.push(sceneText);
      }
    }
  }
  
  // Process scene segments
  for (let i = 0; i < segmentTexts.length; i++) {
    const sceneText = segmentTexts[i];
    if (!sceneText.trim()) continue;
    
    // Extract scene title
    let title = '';
    const firstLine = sceneText.split('\n')[0].trim();
    
    if (i > 0 && delimiters[i-1]) {
      // Use delimiter as title if available
      const delimiterText = delimiters[i-1].trim();
      if (delimiterText.match(/Chapter|Scene|Act|Part/i)) {
        title = delimiterText;
      }
    }
    
    // If no title from delimiter, use first line if it's short
    if (!title && firstLine.length < 60) {
      title = firstLine;
    } else if (!title) {
      // Generate generic title
      title = `Scene ${i+1}`;
    }
    
    // Identify characters in this scene
    const sceneCharacters = [];
    for (const character of characters) {
      const charRegex = new RegExp(`\\b${character.name}\\b`, 'g');
      const charMatches = sceneText.match(charRegex) || [];
      
      if (charMatches.length > 0) {
        sceneCharacters.push({
          id: character.id,
          name: character.name,
          importance: charMatches.length > 3 ? 'primary' : 'secondary'
        });
      }
    }
    
    // Identify locations in this scene
    const sceneLocations = [];
    for (const location of locations) {
      const locRegex = new RegExp(`\\b${location.name}\\b`, 'g');
      if (locRegex.test(sceneText)) {
        sceneLocations.push({
          id: location.id,
          name: location.name
        });
      }
    }
    
    // Create scene object
    scenes.push({
      id: uuidv4(),
      title,
      content: sceneText,
      story_id: storyId,
      sequence_number: (i + 1) * 10,
      characters: sceneCharacters,
      locations: sceneLocations
    });
  }
  
  return scenes;
};

export default {
  analyzeStoryText
};