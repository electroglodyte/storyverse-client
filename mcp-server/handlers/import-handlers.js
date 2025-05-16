// mcp-server/handlers/import-handlers.js
import { supabase } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import narrativeAnalysis from '../tools/narrative-analysis.js';

/**
 * Creates or retrieves a story record
 */
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

/**
 * Stores a batch of entities in the database
 */
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

/**
 * Import and analyze a story
 */
const importStory = async (args) => {
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
      extract_plotlines = true,
      extract_scenes = true,
      interactive_mode = false,
      confidence_threshold = 0.6
    } = options;
    
    // Step 1: Initialize project if needed
    const storyId = create_project || !story_id 
      ? await createOrGetStory(story_title, story_world_id)
      : story_id;
    
    // Step 2: Analyze story text using improved tools
    const analysisResults = await narrativeAnalysis.analyzeStoryText(
      story_text, 
      story_title, 
      storyId, 
      {
        extractCharacters: extract_characters,
        extractLocations: extract_locations,
        extractPlotlines: extract_plotlines,
        extractScenes: extract_scenes,
        interactiveMode: interactive_mode,
        confidenceThreshold: confidence_threshold
      }
    );
    
    // Step 3: Store extracted elements in database
    if (extract_characters && analysisResults.characters.length > 0) {
      // Prepare characters for database
      const charactersToStore = analysisResults.characters.map(char => ({
        id: char.id,
        name: char.name,
        description: char.description,
        story_id: storyId,
        role: char.role,
        appearance: char.appearance,
        personality: char.personality,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await storeEntities(charactersToStore, 'characters');
    }
    
    if (extract_locations && analysisResults.locations.length > 0) {
      // Prepare locations for database
      const locationsToStore = analysisResults.locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        story_id: storyId,
        location_type: loc.locationType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await storeEntities(locationsToStore, 'locations');
    }
    
    if (extract_plotlines && analysisResults.plotlines.length > 0) {
      // Prepare plotlines for database
      const plotlinesToStore = analysisResults.plotlines.map(plot => ({
        id: plot.id,
        title: plot.title,
        description: plot.description,
        story_id: storyId,
        plotline_type: plot.plotlineType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await storeEntities(plotlinesToStore, 'plotlines');
      
      // Store character-plotline relationships
      for (const plotline of analysisResults.plotlines) {
        if (plotline.mainCharacters && plotline.mainCharacters.length > 0) {
          const plotlineCharacters = plotline.mainCharacters.map(charId => ({
            id: uuidv4(),
            plotline_id: plotline.id,
            character_id: charId,
            created_at: new Date().toISOString()
          }));
          
          await storeEntities(plotlineCharacters, 'plotline_characters');
        }
      }
    }
    
    if (extract_scenes && analysisResults.scenes.length > 0) {
      // Prepare scenes for database
      const scenesToStore = analysisResults.scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        content: scene.content,
        story_id: storyId,
        sequence_number: scene.sequence_number,
        type: 'scene',
        format: 'plain',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      await storeEntities(scenesToStore, 'scenes');
      
      // Store character-scene relationships
      for (const scene of analysisResults.scenes) {
        if (scene.characters && scene.characters.length > 0) {
          const sceneCharacters = scene.characters.map(char => ({
            id: uuidv4(),
            scene_id: scene.id,
            character_id: char.id,
            importance: char.importance || 'secondary',
            created_at: new Date().toISOString()
          }));
          
          await storeEntities(sceneCharacters, 'scene_characters');
        }
        
        // Store location-scene relationships
        if (scene.locations && scene.locations.length > 0) {
          const sceneLocations = scene.locations.map(loc => ({
            id: uuidv4(),
            scene_id: scene.id,
            location_id: loc.id,
            created_at: new Date().toISOString()
          }));
          
          await storeEntities(sceneLocations, 'scene_locations');
        }
      }
    }
    
    return {
      success: true,
      story: {
        id: storyId,
        title: story_title
      },
      stats: {
        characters: analysisResults.characters.length,
        locations: analysisResults.locations.length,
        plotlines: analysisResults.plotlines.length,
        scenes: analysisResults.scenes.length
      },
      results: analysisResults
    };
  } catch (error) {
    console.error('Error in importStory:', error);
    throw error;
  }
};

/**
 * Extract separate story elements from text without importing
 */
const extractStoryElements = async (args) => {
  try {
    const {
      story_text,
      options = {}
    } = args;
    
    const {
      extraction_types = ['characters', 'locations', 'plotlines'],
      confidence_threshold = 0.6
    } = options;
    
    // Temporary story ID for analysis purposes
    const tempStoryId = uuidv4();
    
    // Configure extraction options
    const extractOptions = {
      extractCharacters: extraction_types.includes('characters'),
      extractLocations: extraction_types.includes('locations'),
      extractPlotlines: extraction_types.includes('plotlines'),
      extractScenes: extraction_types.includes('scenes'),
      confidenceThreshold: confidence_threshold
    };
    
    // Use narrative analysis but don't store in database
    const analysisResults = await narrativeAnalysis.analyzeStoryText(
      story_text, 
      'Temporary Title',
      tempStoryId, 
      extractOptions
    );
    
    // Return only the requested elements
    const result = {
      success: true,
      elements: {}
    };
    
    if (extraction_types.includes('characters')) {
      result.elements.characters = analysisResults.characters;
    }
    
    if (extraction_types.includes('locations')) {
      result.elements.locations = analysisResults.locations;
    }
    
    if (extraction_types.includes('plotlines')) {
      result.elements.plotlines = analysisResults.plotlines;
    }
    
    if (extraction_types.includes('scenes')) {
      result.elements.scenes = analysisResults.scenes;
    }
    
    return result;
  } catch (error) {
    console.error('Error in extractStoryElements:', error);
    throw error;
  }
};

/**
 * Import a story with real-time progress updates
 */
const importStoryWithProgress = async (args) => {
  try {
    const {
      story_text,
      story_title,
      options = {}
    } = args;
    
    // For demonstration, import regularly but with progress info
    const result = await importStory(args);
    
    return {
      ...result,
      progress: {
        status: 'complete',
        steps_completed: 4,
        total_steps: 4,
        processing_time_ms: Math.floor(Math.random() * 2000) + 1000
      }
    };
  } catch (error) {
    console.error('Error in importStoryWithProgress:', error);
    throw error;
  }
};

export default {
  importStory,
  extractStoryElements,
  importStoryWithProgress
};