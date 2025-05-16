import { v4 as uuidv4 } from 'uuid';

// Helper function to extract plotlines based on recurring themes and section headers
export const extractPlotlineNames = (text: string): string[] => {
  const plotlines = new Set<string>();
  
  // Look for section headers (e.g., "CHAPTER 1", "ACT I", etc.)
  const sectionRegex = /\b(CHAPTER|ACT|PART|BOOK)\s+([IVX0-9]+)(?:\s*:\s*|\s+)([A-Z][A-Za-z0-9\s']+)/gi;
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    if (match[3] && match[3].trim().length > 0) {
      plotlines.add(match[0].trim());
    }
  }
  
  // Look for theme indicators like "SUBPLOT:" or "STORY ARC:"
  const themeRegex = /\b(SUBPLOT|STORY ARC|PLOTLINE|ARC|THREAD)(?:\s*:\s*|\s+)([A-Z][A-Za-z0-9\s']+)/gi;
  while ((match = themeRegex.exec(text)) !== null) {
    if (match[2] && match[2].trim().length > 0) {
      plotlines.add(match[2].trim());
    }
  }
  
  // If no explicit plotlines found, generate a main plotline from the title or first ALL CAPS phrase
  if (plotlines.size === 0) {
    // Try to find a title-like phrase at the beginning
    const titleRegex = /^(?:\s*)((?:[A-Z][A-Za-z0-9\s']+){2,})(?:\s*$)/m;
    match = titleRegex.exec(text);
    if (match && match[1]) {
      plotlines.add(`Main Plot: ${match[1].trim()}`);
    } else {
      // Fallback to first ALL CAPS phrase if found
      const capsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/;
      match = capsRegex.exec(text);
      if (match && match[0]) {
        plotlines.add(`Main Plot: ${match[0]} Journey`);
      } else {
        // Last resort
        plotlines.add("Main Plot");
      }
    }
  }
  
  return [...plotlines];
};

// Create plotline objects from plotline names/titles
export const createPlotlineObjects = (plotlineNames: string[], storyId: string): any[] => {
  return plotlineNames.map(title => ({
    id: uuidv4(),
    title: title,
    description: `Plotline: ${title}`,
    plotline_type: determinePlotlineType(title),
    story_id: storyId,
    confidence: 0.6
  }));
};

// Helper function to determine plotline type based on title
const determinePlotlineType = (title: string): 'main' | 'subplot' | 'character' | 'thematic' | 'other' => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('main plot') || 
      lowerTitle.includes('act ') || 
      lowerTitle.includes('chapter ')) {
    return 'main';
  }
  
  if (lowerTitle.includes('subplot') || 
      lowerTitle.includes('side') || 
      lowerTitle.includes('secondary')) {
    return 'subplot';
  }
  
  if (lowerTitle.includes('character') || 
      lowerTitle.includes(' arc') || 
      lowerTitle.includes('journey') ||
      lowerTitle.includes('development')) {
    return 'character';
  }
  
  if (lowerTitle.includes('theme') || 
      lowerTitle.includes('motif') || 
      lowerTitle.includes('symbol')) {
    return 'thematic';
  }
  
  return 'other';
};

// Main function to extract and create plotline objects
export const extractPlotlines = (text: string, storyId: string): any[] => {
  const plotlineNames = extractPlotlineNames(text);
  return createPlotlineObjects(plotlineNames, storyId);
};
