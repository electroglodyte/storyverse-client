import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

import './StoryAnalysisProgress.css';

/**
 * EMERGENCY FIX VERSION - DIRECT DATABASE ACCESS
 * 
 * This version bypasses the SupabaseService class and communicates directly with
 * the database to ensure entities are properly saved without duplication.
 */

interface AnalysisData {
  storyId: string;
  storyWorldId: string;
  files: Array<{
    name: string;
    type: string;
    content: string | null;
  }>;
}

// StoryAnalysisProgress component - simplified with direct database access
const StoryAnalysisProgress: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [analysisPhase, setAnalysisPhase] = useState<'extracting' | 'saving' | 'complete' | 'error' | 'extracted'>('extracting');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<Array<{type: string; name: string; id: string}>>([]);
  const [analysisStage, setAnalysisStage] = useState<string>('Preparing text analysis...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>('');
  const [storyWorldId, setStoryWorldId] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState<number>(0);
  const [extractionSummary, setExtractionSummary] = useState<any>(null);
  const [saveResults, setSaveResults] = useState<any>({
    characters: 0,
    locations: 0,
    events: 0,
    scenes: 0,
    plotlines: 0,
    relationships: 0
  });
  const [extractionTimestamp, setExtractionTimestamp] = useState<string>('');
  const [extractedElements, setExtractedElements] = useState<any>(null);
  const [extractionStarted, setExtractionStarted] = useState<boolean>(false);
  const [fullErrorDetails, setFullErrorDetails] = useState<string | null>(null);
  const [savedEntityIds, setSavedEntityIds] = useState<{[key: string]: string[]}>({
    characters: [],
    locations: [],
    events: [],
    scenes: [],
    plotlines: []
  });
  
  const navigate = useNavigate();

  // Clear session storage on component mount
  useEffect(() => {
    // Only keep analysisData but remove ALL other items
    const analysisData = sessionStorage.getItem('analysisData');
    sessionStorage.clear();
    if (analysisData) {
      sessionStorage.setItem('analysisData', analysisData);
    }
    console.log("Session storage cleared on component mount");
  }, []);

  // Analyze text and extract narrative elements
  const analyzeText = async (analysisData: AnalysisData) => {
    try {
      console.log("Beginning text analysis with fresh state");
      setAnalysisStage('Extracting narrative elements from text...');
      const file = analysisData.files[0];
      
      if (!file || !file.content) {
        throw new Error('No file content found for analysis');
      }
      
      // Generate a unique request ID to ensure we're not getting cached results
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`Calling analyze-story edge function with request ID: ${requestId}`);
      await addDetectedItem('System', `Analyzing ${file.name} text...`);
      
      // Setup timeout handling
      const TIMEOUT_MS = 45000; // 45 seconds - increased from 30
      let timeoutId: NodeJS.Timeout;
      
      // Create a promise that will reject after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Analysis timed out. The story may be too large to process in one go.'));
        }, TIMEOUT_MS);
      });
      
      // Create the actual analysis promise
      const analysisPromise = supabase.functions.invoke('analyze-story', {
        body: {
          story_text: file.content,
          story_title: file.name.replace(/\\.[^/.]+$/, ""),
          story_world_id: analysisData.storyWorldId,
          options: {
            create_project: false, // We'll handle saving manually
            story_id: analysisData.storyId,
            extract_characters: true,
            extract_locations: true,
            extract_events: true,
            extract_scenes: true,
            extract_relationships: true,
            extract_dependencies: true, 
            extract_plotlines: true,
            extract_arcs: true,
            debug: true,
            retry_attempt: retryAttempt,
            request_id: requestId,
            bypass_cache: true,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      // Race the analysis against the timeout
      const response = await Promise.race([analysisPromise, timeoutPromise]) as any;
      
      // Clear the timeout if the analysis completed
      clearTimeout(timeoutId!);
      
      if (response.error) {
        console.error("Error from analyze-story edge function:", response.error);
        throw new Error(`Analysis error: ${response.error.message || 'Unknown error'}`);
      }
      
      // Get the actual data
      const data = response.data;
      
      console.log("Received analysis response:", data);
      
      // Validate each element type explicitly
      if (!data.characters || !Array.isArray(data.characters)) {
        console.error("Missing or invalid characters array in response");
        data.characters = [];
      }
      
      if (!data.locations || !Array.isArray(data.locations)) {
        console.error("Missing or invalid locations array in response");
        data.locations = [];
      }
      
      if (!data.scenes || !Array.isArray(data.scenes)) {
        console.error("Missing or invalid scenes array in response");
        data.scenes = [];
      }
      
      if (!data.events || !Array.isArray(data.events)) {
        console.error("Missing or invalid events array in response");
        data.events = [];
      }
      
      if (!data.plotlines || !Array.isArray(data.plotlines)) {
        console.error("Missing or invalid plotlines array in response");
        data.plotlines = [];
      }
      
      // Ensure all elements have an ID if not already present
      for (let char of data.characters) {
        if (!char.id) char.id = uuidv4();
      }
      
      for (let loc of data.locations) {
        if (!loc.id) loc.id = uuidv4();
      }
      
      for (let scene of data.scenes) {
        if (!scene.id) scene.id = uuidv4();
      }
      
      for (let event of data.events || []) {
        if (!event.id) event.id = uuidv4();
      }
      
      for (let plot of data.plotlines || []) {
        if (!plot.id) plot.id = uuidv4();
      }
      
      console.log(`Analysis returned: ${data.characters.length} characters, ${data.locations.length} locations, ${data.scenes.length} scenes, ${data.events?.length || 0} events, ${data.plotlines?.length || 0} plotlines`);
      
      await addDetectedItem('System', 'Text analysis complete');
      
      // Store directly in component state
      setExtractedElements(data);
      
      return data;
    } catch (err: any) {
      console.error("Error analyzing text:", err);
      throw err;
    }
  };
  
  // DIRECT DATABASE OPERATIONS - BYPASSING SUPABASESERVICE CLASS
  
  // Direct save character
  const saveCharacterDirect = async (char: any, storyId: string, storyWorldId: string) => {
    try {
      if (!char.name) {
        console.warn("Skipping character with no name:", char);
        return null;
      }
      
      console.log("Saving character:", char.name);
      
      // FIRST: Check for existing character with this name in this context
      const { data: existingChars, error: checkError } = await supabase
        .from('characters')
        .select('*')
        .ilike('name', char.name)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing character:', checkError);
        throw checkError;
      }
      
      // If character already exists, return it
      if (existingChars && existingChars.length > 0) {
        const existingChar = existingChars[0];
        console.log(`Character "${char.name}" already exists, skipping creation`);
        await addDetectedItem('Character', existingChar.name + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          characters: prev.characters + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          characters: [...prev.characters, existingChar.id]
        }));
        
        return existingChar;
      }
      
      // If no existing character, create a new one
      const charData = {
        id: char.id || uuidv4(),
        name: char.name,
        role: char.role || 'supporting',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: char.description || '',
        appearance: char.appearance || '',
        personality: char.personality || '',
        background: char.background || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('characters')
        .insert(charData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving character:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Character', data.name + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          characters: prev.characters + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          characters: [...prev.characters, data.id]
        }));
        
        console.log(`Character ${data.name} saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct character save:", errorDetails);
      setFullErrorDetails(`Character save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save character: ${char.name}`);
      return null;
    }
  };
  
  // Direct save location
  const saveLocationDirect = async (loc: any, storyId: string, storyWorldId: string) => {
    try {
      if (!loc.name) {
        console.warn("Skipping location with no name:", loc);
        return null;
      }
      
      console.log("Saving location:", loc.name);
      
      // FIRST: Check for existing location with this name in this context
      const { data: existingLocs, error: checkError } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', loc.name)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing location:', checkError);
        throw checkError;
      }
      
      // If location already exists, return it
      if (existingLocs && existingLocs.length > 0) {
        const existingLoc = existingLocs[0];
        console.log(`Location "${loc.name}" already exists, skipping creation`);
        await addDetectedItem('Location', existingLoc.name + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          locations: prev.locations + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          locations: [...prev.locations, existingLoc.id]
        }));
        
        return existingLoc;
      }
      
      // If no existing location, create a new one
      const locData = {
        id: loc.id || uuidv4(),
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('locations')
        .insert(locData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving location:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Location', data.name + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          locations: prev.locations + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          locations: [...prev.locations, data.id]
        }));
        
        console.log(`Location ${data.name} saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct location save:", errorDetails);
      setFullErrorDetails(`Location save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save location: ${loc.name}`);
      return null;
    }
  };
  
  // Direct save scene
  const saveSceneDirect = async (scene: any, storyId: string) => {
    try {
      if (!scene.title) {
        console.warn("Skipping scene with no title:", scene);
        return null;
      }
      
      console.log("Saving scene:", scene.title);
      
      // FIRST: Check for existing scene with this title in this story
      const { data: existingScenes, error: checkError } = await supabase
        .from('scenes')
        .select('*')
        .ilike('title', scene.title)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing scene:', checkError);
        throw checkError;
      }
      
      // If scene already exists, return it
      if (existingScenes && existingScenes.length > 0) {
        const existingScene = existingScenes[0];
        console.log(`Scene "${scene.title}" already exists, skipping creation`);
        await addDetectedItem('Scene', existingScene.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          scenes: prev.scenes + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          scenes: [...prev.scenes, existingScene.id]
        }));
        
        return existingScene;
      }
      
      // If no existing scene, create a new one
      const sceneData = {
        id: scene.id || uuidv4(),
        title: scene.title,
        content: scene.content || '',
        type: scene.type || 'scene',
        story_id: storyId,
        sequence_number: scene.sequence_number || 0,
        description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
        status: 'finished',
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('scenes')
        .insert(sceneData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving scene:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Scene', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          scenes: prev.scenes + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          scenes: [...prev.scenes, data.id]
        }));
        
        console.log(`Scene ${data.title} saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct scene save:", errorDetails);
      setFullErrorDetails(`Scene save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save scene: ${scene.title}`);
      return null;
    }
  };
  
  // Direct save event
  const saveEventDirect = async (event: any, storyId: string) => {
    try {
      const eventTitle = event.title || event.name;
      if (!eventTitle) {
        console.warn("Skipping event with no title:", event);
        return null;
      }
      
      console.log("Saving event:", eventTitle);
      
      // FIRST: Check for existing event with this title in this story
      const { data: existingEvents, error: checkError } = await supabase
        .from('events')
        .select('*')
        .ilike('title', eventTitle)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing event:', checkError);
        throw checkError;
      }
      
      // If event already exists, return it
      if (existingEvents && existingEvents.length > 0) {
        const existingEvent = existingEvents[0];
        console.log(`Event "${eventTitle}" already exists, skipping creation`);
        await addDetectedItem('Event', existingEvent.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          events: prev.events + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          events: [...prev.events, existingEvent.id]
        }));
        
        return existingEvent;
      }
      
      // If no existing event, create a new one
      const eventData = {
        id: event.id || uuidv4(),
        title: eventTitle,
        story_id: storyId,
        description: event.description || '',
        sequence_number: event.sequence_number || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving event:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Event', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          events: prev.events + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          events: [...prev.events, data.id]
        }));
        
        console.log(`Event ${data.title} saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct event save:", errorDetails);
      setFullErrorDetails(`Event save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save event: ${event.title || event.name}`);
      return null;
    }
  };
  
  // Direct save plotline
  const savePlotlineDirect = async (plotline: any, storyId: string) => {
    try {
      if (!plotline.title) {
        console.warn("Skipping plotline with no title:", plotline);
        return null;
      }
      
      console.log("Saving plotline:", plotline.title);
      
      // FIRST: Check for existing plotline with this title in this story
      const { data: existingPlotlines, error: checkError } = await supabase
        .from('plotlines')
        .select('*')
        .ilike('title', plotline.title)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing plotline:', checkError);
        throw checkError;
      }
      
      // If plotline already exists, return it
      if (existingPlotlines && existingPlotlines.length > 0) {
        const existingPlotline = existingPlotlines[0];
        console.log(`Plotline "${plotline.title}" already exists, skipping creation`);
        await addDetectedItem('Plotline', existingPlotline.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          plotlines: prev.plotlines + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          plotlines: [...prev.plotlines, existingPlotline.id]
        }));
        
        return existingPlotline;
      }
      
      // If no existing plotline, create a new one
      const plotlineData = {
        id: plotline.id || uuidv4(),
        title: plotline.title,
        description: plotline.description || '',
        plotline_type: plotline.plotline_type || 'main',
        story_id: storyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('plotlines')
        .insert(plotlineData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving plotline:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Plotline', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          plotlines: prev.plotlines + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          plotlines: [...prev.plotlines, data.id]
        }));
        
        console.log(`Plotline ${data.title} saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct plotline save:", errorDetails);
      setFullErrorDetails(`Plotline save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save plotline: ${plotline.title}`);
      return null;
    }
  };
  
  // DIRECT save of character relationships
  const saveCharacterRelationshipDirect = async (rel: any, characterNameToIdMap: Record<string, string>, storyId: string) => {
    try {
      if (!rel.character1_name || !rel.character2_name) {
        console.warn("Skipping relationship with missing character names:", rel);
        return null;
      }
      
      // Check if both characters exist in our map
      const char1Id = characterNameToIdMap[rel.character1_name];
      const char2Id = characterNameToIdMap[rel.character2_name];
      
      if (!char1Id || !char2Id) {
        console.warn(`Cannot save relationship: character ID not found for "${rel.character1_name}" or "${rel.character2_name}"`);
        return null;
      }
      
      console.log(`Saving relationship: ${rel.character1_name} - ${rel.character2_name}`);
      
      // Check for existing relationship between these characters
      const { data: existingRels, error: checkError } = await supabase
        .from('character_relationships')
        .select('*')
        .or(`and(character1_id.eq.${char1Id},character2_id.eq.${char2Id}),and(character1_id.eq.${char2Id},character2_id.eq.${char1Id})`)
        .eq('story_id', storyId);
      
      if (checkError) {
        console.error('Error checking for existing relationship:', checkError);
        throw checkError;
      }
      
      // If relationship already exists, return it
      if (existingRels && existingRels.length > 0) {
        const existingRel = existingRels[0];
        console.log(`Relationship between "${rel.character1_name}" and "${rel.character2_name}" already exists, skipping creation`);
        await addDetectedItem('Relationship', `${rel.character1_name} - ${rel.character2_name} (existing)`);
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          relationships: prev.relationships + 1
        }));
        
        return existingRel;
      }
      
      // If no existing relationship, create a new one
      const relData = {
        id: uuidv4(),
        character1_id: char1Id,
        character2_id: char2Id,
        relationship_type: rel.relationship_type || 'other',
        description: rel.description || '',
        intensity: rel.intensity || 5,
        story_id: storyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('character_relationships')
        .insert(relData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving relationship:', error);
        throw error;
      }
      
      if (data) {
        await addDetectedItem('Relationship', `${rel.character1_name} - ${rel.character2_name} (new)`);
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          relationships: prev.relationships + 1
        }));
        
        console.log(`Relationship saved successfully`);
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error in direct relationship save:", errorDetails);
      setFullErrorDetails(`Relationship save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save relationship`);
      return null;
    }
  };
  
  // Modified save approach using direct database operations
  const saveElementsDirectly = async () => {
    try {
      console.log("=== Starting direct database save process ===");
      
      // Get elements from component state
      if (!extractedElements) {
        console.error("No extracted elements found in state");
        throw new Error('No extracted elements found in component state');
      }
      
      const elements = extractedElements;
      console.log("Extracted elements from state:", elements);
      
      // Get analysis data from session storage
      const analysisDataStr = sessionStorage.getItem('analysisData');
      if (!analysisDataStr) {
        console.error("No analysis data found in session storage");
        throw new Error('No analysis data found in session storage');
      }
      
      const analysisData = JSON.parse(analysisDataStr);
      console.log("Analysis data from session storage:", analysisData);
      
      // Verify we have valid story and storyWorld IDs
      if (!analysisData.storyId) {
        console.error("Missing storyId in analysis data");
        throw new Error('Missing storyId in analysis data');
      }
      
      if (!analysisData.storyWorldId) {
        console.error("Missing storyWorldId in analysis data");
        throw new Error('Missing storyWorldId in analysis data');
      }
      
      console.log("Starting to save extracted elements:", elements);
      console.log(`Characters: ${elements.characters?.length || 0}, Locations: ${elements.locations?.length || 0}, Scenes: ${elements.scenes?.length || 0}`);
      
      // Reset saved entity IDs
      setSavedEntityIds({
        characters: [],
        locations: [],
        events: [],
        scenes: [],
        plotlines: []
      });
      
      // Reset save results counters
      setSaveResults({
        characters: 0,
        locations: 0,
        events: 0,
        scenes: 0,
        plotlines: 0,
        relationships: 0
      });
      
      const totalSteps = 5; // Characters, locations, scenes, events, plotlines
      let currentStep = 0;
      
      // Save characters with direct db access
      let savedCharacters = [];
      if (elements.characters?.length > 0) {
        setAnalysisStage(`Saving characters (${elements.characters.length})...`);
        await addDetectedItem('System', `Saving ${elements.characters.length} characters`);
        
        // Save each character individually
        for (let i = 0; i < elements.characters.length; i++) {
          try {
            const character = elements.characters[i];
            const savedChar = await saveCharacterDirect(character, analysisData.storyId, analysisData.storyWorldId);
            if (savedChar) {
              savedCharacters.push(savedChar);
            }
          } catch (err) {
            console.error(`Error saving character at index ${i}:`, err);
            // Continue with next character despite errors
          }
          
          // Update progress
          const characterProgress = (i + 1) / elements.characters.length;
          setSavingProgress((currentStep + characterProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save locations with direct db access
      let savedLocations = [];
      if (elements.locations?.length > 0) {
        setAnalysisStage(`Saving locations (${elements.locations.length})...`);
        await addDetectedItem('System', `Saving ${elements.locations.length} locations`);
        
        // Save each location individually
        for (let i = 0; i < elements.locations.length; i++) {
          try {
            const location = elements.locations[i];
            const savedLoc = await saveLocationDirect(location, analysisData.storyId, analysisData.storyWorldId);
            if (savedLoc) {
              savedLocations.push(savedLoc);
            }
          } catch (err) {
            console.error(`Error saving location at index ${i}:`, err);
            // Continue with next location despite errors
          }
          
          // Update progress
          const locationProgress = (i + 1) / elements.locations.length;
          setSavingProgress((currentStep + locationProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save scenes with direct db access
      let savedScenes = [];
      if (elements.scenes?.length > 0) {
        setAnalysisStage(`Saving scenes (${elements.scenes.length})...`);
        await addDetectedItem('System', `Saving ${elements.scenes.length} scenes`);
        
        // Save each scene individually
        for (let i = 0; i < elements.scenes.length; i++) {
          try {
            const scene = elements.scenes[i];
            const savedScene = await saveSceneDirect(scene, analysisData.storyId);
            if (savedScene) {
              savedScenes.push(savedScene);
            }
          } catch (err) {
            console.error(`Error saving scene at index ${i}:`, err);
            // Continue with next scene despite errors
          }
          
          // Update progress
          const sceneProgress = (i + 1) / elements.scenes.length;
          setSavingProgress((currentStep + sceneProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save events with direct db access
      let savedEvents = [];
      if (elements.events?.length > 0) {
        setAnalysisStage(`Saving events (${elements.events.length})...`);
        await addDetectedItem('System', `Saving ${elements.events.length} events`);
        
        // Save each event individually
        for (let i = 0; i < elements.events.length; i++) {
          try {
            const event = elements.events[i];
            const savedEvent = await saveEventDirect(event, analysisData.storyId);
            if (savedEvent) {
              savedEvents.push(savedEvent);
            }
          } catch (err) {
            console.error(`Error saving event at index ${i}:`, err);
            // Continue with next event despite errors
          }
          
          // Update progress
          const eventProgress = (i + 1) / elements.events.length;
          setSavingProgress((currentStep + eventProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save plotlines with direct db access
      let savedPlotlines = [];
      if (elements.plotlines?.length > 0) {
        setAnalysisStage(`Saving plotlines (${elements.plotlines.length})...`);
        await addDetectedItem('System', `Saving ${elements.plotlines.length} plotlines`);
        
        // Save each plotline individually
        for (let i = 0; i < elements.plotlines.length; i++) {
          try {
            const plotline = elements.plotlines[i];
            const savedPlotline = await savePlotlineDirect(plotline, analysisData.storyId);
            if (savedPlotline) {
              savedPlotlines.push(savedPlotline);
            }
          } catch (err) {
            console.error(`Error saving plotline at index ${i}:`, err);
            // Continue with next plotline despite errors
          }
          
          // Update progress
          const plotlineProgress = (i + 1) / elements.plotlines.length;
          setSavingProgress((currentStep + plotlineProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      setSavingProgress(100);
      
      // Save character relationships after characters are saved
      if (elements.characterRelationships?.length > 0 && savedCharacters.length > 0) {
        setAnalysisStage(`Saving character relationships (${elements.characterRelationships.length})...`);
        await addDetectedItem('System', `Processing ${elements.characterRelationships.length} character relationships`);
        
        // Create a map of character names to IDs
        const characterNameToIdMap: Record<string, string> = {};
        savedCharacters.forEach(char => {
          characterNameToIdMap[char.name] = char.id;
        });
        
        console.log("Character name to ID map:", characterNameToIdMap);
        
        // Save each relationship individually
        let validRelationships = 0;
        let failedRelationships = 0;
        
        for (let i = 0; i < elements.characterRelationships.length; i++) {
          try {
            const relationship = elements.characterRelationships[i];
            const result = await saveCharacterRelationshipDirect(
              relationship, 
              characterNameToIdMap, 
              analysisData.storyId
            );
            
            if (result) {
              validRelationships++;
            } else {
              failedRelationships++;
            }
          } catch (err) {
            failedRelationships++;
            console.error(`Error saving relationship at index ${i}:`, err);
            // Continue with next relationship despite errors
          }
        }
        
        await addDetectedItem('System', `Saved ${validRelationships} character relationships, ${failedRelationships} failed`);
      }
      
      // Finalize
      setAnalysisStage('Finalizing analysis...');
      await addDetectedItem('System', 'Analysis completed successfully');
      
      // Get final save counts
      const finalResults = {
        characters: saveResults.characters,
        locations: saveResults.locations,
        events: saveResults.events,
        scenes: saveResults.scenes,
        plotlines: saveResults.plotlines,
        relationships: saveResults.relationships
      };
      
      console.log("Final save results:", finalResults);
      
      // Store minimal results for the results page
      const analysisResults = {
        savedEntityIds,
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId,
        counts: finalResults
      };
      
      sessionStorage.setItem('analysisResults', JSON.stringify(analysisResults));
      console.log("=== Direct database save process completed successfully ===");
      
      return finalResults;
    } catch (err: any) {
      const errorDetails = err instanceof Error ? 
        `${err.message}\n${err.stack || ''}` : 
        String(err);
        
      console.error("Error in direct save process:", errorDetails);
      setFullErrorDetails(`Save error: ${errorDetails}`);
      throw err;
    }
  };

  // Utility function to generate a unique ID for detected items
  const generateUniqueId = (type: string, name: string): string => {
    return `${type}-${name}-${Date.now()}`;
  };

  // Add a detected item with a small delay to create visual feedback
  const addDetectedItem = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const itemId = generateUniqueId(type, name);
        setDetectedItems(prev => [...prev, { type, name, id: itemId }]);
        resolve();
      }, Math.random() * 50 + 10); // Faster delay between 10-60ms
    });
  };

  // Extract narrative elements phase
  const processExtraction = async () => {
    // Mark extraction as started
    setExtractionStarted(true);
    
    // Get analysis data from session storage
    const analysisDataStr = sessionStorage.getItem('analysisData');
    
    if (!analysisDataStr) {
      setError('No analysis data found. Please return to the import screen.');
      setIsAnalyzing(false);
      setAnalysisPhase('error');
      return;
    }
    
    try {
      const analysisData: AnalysisData = JSON.parse(analysisDataStr);
      setCurrentFile(analysisData.files[0]?.name || '');
      setStoryId(analysisData.storyId);
      setStoryWorldId(analysisData.storyWorldId);
      
      // Debug the stored analysis data
      console.log('Analysis data from session storage:', analysisData);
      setDebugInfo(`Story ID: ${analysisData.storyId}, Files: ${analysisData.files.length}`);
      
      // Check if there are any files to analyze
      if (!analysisData.files || analysisData.files.length === 0) {
        setError('No files found for analysis. Please upload a file and try again.');
        setIsAnalyzing(false);
        setAnalysisPhase('error');
        return;
      }
      
      // ALWAYS perform a fresh extraction - no caching
      let extractAttempts = 0;
      const MAX_EXTRACT_ATTEMPTS = 3;
      let elements = null;
      
      while (extractAttempts < MAX_EXTRACT_ATTEMPTS && !elements) {
        try {
          setAnalysisPhase('extracting');
          setRetryAttempt(extractAttempts);
          
          // Update UI if this is a retry
          if (extractAttempts > 0) {
            await addDetectedItem('System', `Retry attempt ${extractAttempts}...`);
            setAnalysisStage(`Retry ${extractAttempts}/${MAX_EXTRACT_ATTEMPTS}: Extracting narrative elements...`);
          }
          
          elements = await analyzeText(analysisData);
          
          if (elements) {
            // Create extraction timestamp
            const timestamp = new Date().toISOString();
            setExtractionTimestamp(timestamp);
            
            // Set extraction summary
            setExtractionSummary({
              characters: elements.characters?.length || 0,
              locations: elements.locations?.length || 0,
              events: elements.events?.length || 0,
              scenes: elements.scenes?.length || 0,
              plotlines: elements.plotlines?.length || 0,
              relationships: elements.characterRelationships?.length || 0
            });
            
            // Store in component state
            setExtractedElements(elements);
            
            // Continue to the saving phase
            setAnalysisPhase('extracted');
            setIsAnalyzing(false);
            
            // Display a sample of the extracted elements in the UI
            await addDetectedItem('System', 'Processing extracted elements...');
            
            if (elements.characters?.length > 0) {
              await addDetectedItem('System', `Found ${elements.characters.length} characters`);
              for (const char of elements.characters.slice(0, 3)) {
                await addDetectedItem('Character', char.name);
              }
            }
            
            if (elements.locations?.length > 0) {
              await addDetectedItem('System', `Found ${elements.locations.length} locations`);
              for (const loc of elements.locations.slice(0, 3)) {
                await addDetectedItem('Location', loc.name);
              }
            }
            
            if (elements.scenes?.length > 0) {
              await addDetectedItem('System', `Found ${elements.scenes.length} scenes`);
              for (const scene of elements.scenes.slice(0, 3)) {
                await addDetectedItem('Scene', scene.title);
              }
            }
            
            if (elements.plotlines?.length > 0) {
              await addDetectedItem('System', `Found ${elements.plotlines.length} plotlines`);
              for (const plot of elements.plotlines.slice(0, 3)) {
                await addDetectedItem('Plotline', plot.title);
              }
            }
          }
          
          break;
        } catch (err: any) {
          console.error(`Extract attempt ${extractAttempts + 1} failed:`, err);
          
          // If we've reached max attempts, propagate the error
          if (extractAttempts === MAX_EXTRACT_ATTEMPTS - 1) {
            throw err;
          }
          
          // Otherwise, log retry and continue
          await addDetectedItem('Warning', `Extraction attempt failed: ${err.message}`);
          extractAttempts++;
        }
      }
      
      if (!elements) {
        throw new Error('Failed to extract narrative elements after multiple attempts');
      }
    } catch (err: any) {
      console.error("Error during extraction:", err);
      setError(`Extraction error: ${err.message || 'Unknown error'}`);
      setFullErrorDetails(err instanceof Error ? err.stack || err.message : String(err));
      await addDetectedItem('Error', `Extraction error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
      setIsAnalyzing(false);
    }
  };
  
  // Direct database save phase
  const processSavingDirectly = async () => {
    try {
      console.log("=== Starting processSavingDirectly ===");
      setIsAnalyzing(true);
      setAnalysisPhase('saving');
      setAnalysisStage('Starting to save elements directly to database...');
      
      // First, verify we have extracted elements
      if (!extractedElements) {
        throw new Error('No extracted elements found. Please try extracting the data again.');
      }
      
      // Verify we have valid IDs
      if (!storyId || !storyWorldId) {
        throw new Error('Missing story or story world ID. Please restart the analysis process.');
      }
      
      // Save extracted elements to database using direct approach
      const results = await saveElementsDirectly();
      
      console.log("=== Direct save results complete ===");
      console.log("Final save results:", results);
      
      setAnalysisPhase('complete');
    } catch (err: any) {
      console.error("Error during direct saving:", err);
      
      // Get detailed error info
      const detailedError = err instanceof Error ? 
        `${err.message}\n${err.stack || ''}` : 
        String(err);
      
      setError(`Saving error: ${err.message || 'Unknown error'}`);
      setFullErrorDetails(detailedError);
      await addDetectedItem('Error', `Saving error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  useEffect(() => {
    // Start extraction only if it's not already started
    if (!extractionStarted) {
      console.log("Starting initial extraction");
      processExtraction();
    }
  }, [extractionStarted]);
  
  const handleViewResults = () => {
    navigate('/analysis-results');
  };

  const handleRetry = () => {
    // If we have extracted elements but failed to save, retry only the saving phase
    if (analysisPhase === 'error' && extractedElements) {
      // Reset relevant states
      setError(null);
      setFullErrorDetails(null);
      setIsAnalyzing(true);
      
      // Start from saving phase with direct approach
      processSavingDirectly();
    } else {
      // Full retry - Reset everything and reload
      setDetectedItems([]);
      setExtractedElements(null);
      setExtractionStarted(false);
      setFullErrorDetails(null);
      
      // Force page reload to clear any browser cache/state
      window.location.reload();
    }
  };

  const handleContinueToSaving = () => {
    processSavingDirectly();
  };

  const handleFreshExtraction = () => {
    // Clear state and restart extraction
    setDetectedItems([]);
    setExtractedElements(null);
    setExtractionStarted(false);
    setAnalysisPhase('extracting');
    setIsAnalyzing(true);
    setFullErrorDetails(null);
    
    // Force page reload to clear any browser cache/state
    window.location.reload();
  };

  const getAnalysisPhaseDisplay = () => {
    switch (analysisPhase) {
      case 'extracting':
        return 'Phase 1 of 2: Extracting narrative elements';
      case 'extracted':
        return 'Extraction Complete - Ready to Save';
      case 'saving':
        return 'Phase 2 of 2: Saving elements to database';
      case 'complete':
        return 'Analysis Complete';
      case 'error':
        return 'Analysis Error';
      default:
        return 'Analyzing...';
    }
  };

  return (
    <div className="analysis-progress-container">
      <h1>Analyzing Story</h1>
      
      {isAnalyzing ? (
        <>
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>Analyzing: {currentFile}</p>
            <div className="analysis-phase">{getAnalysisPhaseDisplay()}</div>
            <div className="analysis-stage">{analysisStage}</div>
            
            {analysisPhase === 'saving' && (
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${savingProgress}%` }}
                ></div>
                <span className="progress-text">{Math.round(savingProgress)}%</span>
              </div>
            )}
          </div>
          
          <div className="detection-log">
            <h3>Detection Log</h3>
            <div className="log-entries">
              {detectedItems.map((item) => (
                <div key={item.id} className="log-entry">
                  <span className={`item-type ${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className="item-name">{item.name}</span>
                </div>
              ))}
              {detectedItems.length === 0 && (
                <div className="log-entry">
                  <span className="item-type system">System</span>
                  <span className="item-name">Starting analysis...</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : analysisPhase === 'extracted' ? (
        <div className="extraction-complete">
          <div className="success-icon">✓</div>
          <h2>Extraction Complete!</h2>
          <p>The narrative elements have been successfully extracted. Ready to save to database.</p>
          
          <div className="extraction-summary">
            {extractionSummary && (
              <div className="summary">
                <div className="summary-item">
                  <h3>Characters</h3>
                  <span className="count">{extractionSummary.characters}</span>
                </div>
                <div className="summary-item">
                  <h3>Locations</h3>
                  <span className="count">{extractionSummary.locations}</span>
                </div>
                <div className="summary-item">
                  <h3>Events</h3>
                  <span className="count">{extractionSummary.events}</span>
                </div>
                <div className="summary-item">
                  <h3>Scenes</h3>
                  <span className="count">{extractionSummary.scenes}</span>
                </div>
                <div className="summary-item">
                  <h3>Plotlines</h3>
                  <span className="count">{extractionSummary.plotlines}</span>
                </div>
              </div>
            )}
            
            {extractionTimestamp && (
              <div className="extraction-timestamp">
                Extracted at: {new Date(extractionTimestamp).toLocaleString()}
              </div>
            )}
            
            {debugInfo && (
              <div className="debug-info">
                <h3>Debug Information</h3>
                <pre>{debugInfo}</pre>
              </div>
            )}
          </div>
          
          <div className="actions-container">
            <button className="continue-button" onClick={handleContinueToSaving}>
              Continue to Save Elements
            </button>
            <button className="retry-button" onClick={handleFreshExtraction}>
              Force New Extraction
            </button>
          </div>
        </div>
      ) : (
        <div className="analysis-complete">
          {error ? (
            <div className="error-container">
              <div className="error-icon">!</div>
              <h2>Analysis Error</h2>
              <p className="error-message">{error}</p>
              {debugInfo && (
                <div className="debug-info">
                  <h3>Debug Information</h3>
                  <pre>{debugInfo}</pre>
                </div>
              )}
              {fullErrorDetails && (
                <div className="full-error-details">
                  <h3>Detailed Error Information</h3>
                  <pre className="error-stack">{fullErrorDetails}</pre>
                </div>
              )}
              <button className="retry-button" onClick={handleRetry}>
                {extractedElements ? 'Retry Saving' : 'Retry Analysis'}
              </button>
              <button className="secondary-button" onClick={() => navigate('/import')}>
                Back to Import
              </button>
            </div>
          ) : (
            <>
              <div className="success-icon">✓</div>
              <h2>Analysis Complete!</h2>
              <p>Successfully analyzed all files and extracted narrative elements.</p>
              
              {debugInfo && (
                <div className="debug-info">
                  <h3>Debug Information</h3>
                  <pre>{debugInfo}</pre>
                </div>
              )}
              
              <div className="summary">
                <div className="summary-item">
                  <h3>Characters</h3>
                  <span className="count">{saveResults.characters}</span>
                </div>
                <div className="summary-item">
                  <h3>Locations</h3>
                  <span className="count">{saveResults.locations}</span>
                </div>
                <div className="summary-item">
                  <h3>Events</h3>
                  <span className="count">{saveResults.events}</span>
                </div>
                <div className="summary-item">
                  <h3>Scenes</h3>
                  <span className="count">{saveResults.scenes}</span>
                </div>
                <div className="summary-item">
                  <h3>Plotlines</h3>
                  <span className="count">{saveResults.plotlines}</span>
                </div>
              </div>
              
              <div className="actions-container">
                <button className="view-results-button" onClick={handleViewResults}>
                  View Results
                </button>
                {saveResults.characters === 0 && saveResults.locations === 0 && saveResults.scenes === 0 && (
                  <button className="retry-button" onClick={handleRetry}>
                    Retry Analysis
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryAnalysisProgress;