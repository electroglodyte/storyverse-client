import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService, Character, Location, Event } from '../services/SupabaseService';
import { supabase } from '../services/supabase';

import './StoryAnalysisProgress.css';

interface AnalysisData {
  storyId: string;
  storyWorldId: string;
  files: Array<{
    name: string;
    type: string;
    content: string | null;
  }>;
}

// Enhanced StoryAnalysisProgress component with better error handling and debugging
const StoryAnalysisProgress: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [analysisPhase, setAnalysisPhase] = useState<'extracting' | 'saving' | 'complete' | 'error' | 'extracted'>('extracting');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<Array<{type: string; name: string; id: string}>>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [plotlines, setPlotlines] = useState<any[]>([]);
  const [characterRelationships, setCharacterRelationships] = useState<any[]>([]);
  const [eventDependencies, setEventDependencies] = useState<any[]>([]);
  const [characterArcs, setCharacterArcs] = useState<any[]>([]);
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
  
  const navigate = useNavigate();

  // IMPORTANT: Completely clear ALL session storage on component mount
  useEffect(() => {
    // Only keep analysisData but remove ALL other items
    const analysisData = sessionStorage.getItem('analysisData');
    sessionStorage.clear();
    if (analysisData) {
      sessionStorage.setItem('analysisData', analysisData);
    }
    console.log("Session storage completely cleared on component mount");
  }, []);

  // Stage 1: Analyze text and extract narrative elements with special handling
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
      console.log(`Calling analyze-story edge function for ${file.name} with request ID: ${requestId}`);
      await addDetectedItem('System', `Analyzing ${file.name} text...`);
      
      // Setup timeout handling
      const TIMEOUT_MS = 30000; // 30 seconds
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
          story_title: file.name.replace(/\.[^/.]+$/, ""),
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
            request_id: requestId, // Add unique request ID
            bypass_cache: true, // Tell the server to bypass cache
            timestamp: new Date().toISOString() // Add timestamp to ensure unique request
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
      
      // Log comprehensive info about what we received
      console.log(`Analysis returned: ${data.characters.length} characters, ${data.locations.length} locations, ${data.scenes.length} scenes, ${data.events?.length || 0} events, ${data.plotlines?.length || 0} plotlines`);
      
      // Log the first item of each type to verify we have real data
      if (data.characters.length > 0) console.log("First character:", data.characters[0]);
      if (data.locations.length > 0) console.log("First location:", data.locations[0]);
      if (data.scenes.length > 0) console.log("First scene:", data.scenes[0]);
      if (data.events?.length > 0) console.log("First event:", data.events[0]);
      if (data.plotlines?.length > 0) console.log("First plotline:", data.plotlines[0]);
      
      await addDetectedItem('System', 'Text analysis complete');
      
      // Store directly in component state instead of session storage
      setExtractedElements(data);
      
      return data;
    } catch (err: any) {
      console.error("Error analyzing text:", err);
      throw err;
    }
  };
  
  // Rest of the component remains unchanged
  const saveCharacter = async (char: any, storyId: string, storyWorldId: string) => {
    try {
      console.log("Saving character:", char.name);
      const charData = {
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
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createCharacters([charData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Character save operation for ${char.name} took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        await addDetectedItem('Character', result[0].name);
        setCharacters(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          characters: prev.characters + 1
        }));
        
        console.log(`Character ${result[0].name} saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving character ${char.name}`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving character:", errorDetails);
      setFullErrorDetails(`Character save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save character: ${char.name}`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save a single location to the database
  const saveLocation = async (loc: any, storyId: string, storyWorldId: string) => {
    try {
      console.log("Saving location:", loc.name);
      const locData = {
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createLocations([locData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Location save operation for ${loc.name} took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        await addDetectedItem('Location', result[0].name);
        setLocations(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          locations: prev.locations + 1
        }));
        
        console.log(`Location ${result[0].name} saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving location ${loc.name}`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving location:", errorDetails);
      setFullErrorDetails(`Location save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save location: ${loc.name}`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save a single scene to the database
  const saveScene = async (scene: any, storyId: string) => {
    try {
      console.log("Saving scene:", scene.title);
      const sceneData = {
        title: scene.title,
        content: scene.content,
        type: scene.type || 'scene',
        story_id: storyId,
        sequence_number: scene.sequence_number || 0,
        description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
        status: 'finished',
        is_visible: true
      };
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createScenes([sceneData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Scene save operation for ${scene.title} took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        await addDetectedItem('Scene', result[0].title);
        setScenes(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          scenes: prev.scenes + 1
        }));
        
        console.log(`Scene ${result[0].title} saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving scene ${scene.title}`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving scene:", errorDetails);
      setFullErrorDetails(`Scene save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save scene: ${scene.title}`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save a single event to the database
  const saveEvent = async (evt: any, storyId: string) => {
    try {
      console.log("Saving event:", evt.title || evt.name);
      const eventData = {
        title: evt.title || evt.name,
        story_id: storyId,
        description: evt.description || '',
        sequence_number: evt.sequence_number || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createEvents([eventData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Event save operation for ${eventData.title} took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        await addDetectedItem('Event', result[0].title);
        setEvents(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          events: prev.events + 1
        }));
        
        console.log(`Event ${result[0].title} saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving event ${eventData.title}`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving event:", errorDetails);
      setFullErrorDetails(`Event save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save event: ${evt.title}`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save a single plotline to the database
  const savePlotline = async (plot: any, storyId: string) => {
    try {
      console.log("Saving plotline:", plot.title);
      const plotlineData = {
        title: plot.title,
        description: plot.description || '',
        plotline_type: plot.plotline_type || 'main',
        story_id: storyId
      };
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createPlotlines([plotlineData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Plotline save operation for ${plot.title} took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        await addDetectedItem('Plotline', result[0].title);
        setPlotlines(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          plotlines: prev.plotlines + 1
        }));
        
        console.log(`Plotline ${result[0].title} saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving plotline ${plot.title}`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving plotline:", errorDetails);
      setFullErrorDetails(`Plotline save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save plotline: ${plot.title}`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save a character relationship to the database
  const saveCharacterRelationship = async (rel: any, characterMap: Record<string, string>, storyId: string) => {
    try {
      if (!rel.character1_name || !rel.character2_name || 
          !characterMap[rel.character1_name] || !characterMap[rel.character2_name]) {
        console.warn(`Skipping relationship: missing character names or IDs`, rel);
        return null;
      }
      
      console.log(`Saving relationship: ${rel.character1_name} - ${rel.character2_name}`);
      
      const relationshipData = {
        character1_id: characterMap[rel.character1_name],
        character2_id: characterMap[rel.character2_name],
        relationship_type: rel.relationship_type || 'other',
        description: rel.description || '',
        intensity: rel.intensity || 5,
        story_id: storyId
      };
      
      // Capture start time for performance logging
      const startTime = performance.now();
      
      const result = await SupabaseService.createCharacterRelationships([relationshipData]);
      
      // Calculate and log operation time
      const endTime = performance.now();
      console.log(`Relationship save operation took ${Math.round(endTime - startTime)}ms`);
      
      if (result && result.length > 0) {
        const char1 = characters.find(c => c.id === result[0].character1_id);
        const char2 = characters.find(c => c.id === result[0].character2_id);
        if (char1 && char2) {
          await addDetectedItem('Relationship', `${char1.name} - ${char2.name}`);
        }
        setCharacterRelationships(prev => [...prev, result[0]]);
        
        // Update save results
        setSaveResults(prev => ({
          ...prev,
          relationships: prev.relationships + 1
        }));
        
        console.log(`Relationship saved successfully`);
        return result[0];
      }
      
      // Return null if we couldn't save or get a result
      console.warn(`No result returned when saving relationship`);
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      console.error("Error saving relationship:", errorDetails);
      setFullErrorDetails(`Relationship save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save relationship`);
      // Return null but don't throw - we want to continue with other items
      return null;
    }
  };
  
  // Save extracted elements to database in small batches with individual tracking
  const saveAnalysisResultsInBatches = async () => {
    try {
      console.log("=== Starting saveAnalysisResultsInBatches ===");
      
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
      
      // Save characters
      if (elements.characters?.length > 0) {
        setAnalysisStage(`Saving characters (${elements.characters.length})...`);
        await addDetectedItem('System', `Saving ${elements.characters.length} characters`);
        
        // Log the first character to help with debugging
        console.log("First character to save:", elements.characters[0]);
        
        // Save each character individually
        for (let i = 0; i < elements.characters.length; i++) {
          const character = elements.characters[i];
          
          // Check for valid character data before trying to save
          if (!character || !character.name) {
            console.warn(`Skipping invalid character at index ${i}:`, character);
            continue;
          }
          
          // Save the character and handle any errors
          try {
            const savedChar = await saveCharacter(character, analysisData.storyId, analysisData.storyWorldId);
            if (savedChar) {
              console.log(`Successfully saved character ${i+1}/${elements.characters.length}: ${savedChar.name}`);
            } else {
              console.warn(`Failed to save character ${i+1}/${elements.characters.length}: ${character.name}`);
            }
          } catch (err) {
            console.error(`Error saving character ${character.name}:`, err);
            await addDetectedItem('Error', `Failed to save character: ${character.name}`);
            // Continue with next character despite errors
          }
          
          // Update progress
          const characterProgress = (i + 1) / elements.characters.length;
          setSavingProgress((currentStep + characterProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save locations
      if (elements.locations?.length > 0) {
        setAnalysisStage(`Saving locations (${elements.locations.length})...`);
        await addDetectedItem('System', `Saving ${elements.locations.length} locations`);
        
        // Log the first location to help with debugging
        console.log("First location to save:", elements.locations[0]);
        
        // Save each location individually
        for (let i = 0; i < elements.locations.length; i++) {
          const location = elements.locations[i];
          
          // Check for valid location data before trying to save
          if (!location || !location.name) {
            console.warn(`Skipping invalid location at index ${i}:`, location);
            continue;
          }
          
          // Save the location and handle any errors
          try {
            const savedLoc = await saveLocation(location, analysisData.storyId, analysisData.storyWorldId);
            if (savedLoc) {
              console.log(`Successfully saved location ${i+1}/${elements.locations.length}: ${savedLoc.name}`);
            } else {
              console.warn(`Failed to save location ${i+1}/${elements.locations.length}: ${location.name}`);
            }
          } catch (err) {
            console.error(`Error saving location ${location.name}:`, err);
            await addDetectedItem('Error', `Failed to save location: ${location.name}`);
            // Continue with next location despite errors
          }
          
          // Update progress
          const locationProgress = (i + 1) / elements.locations.length;
          setSavingProgress((currentStep + locationProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save scenes
      if (elements.scenes?.length > 0) {
        setAnalysisStage(`Saving scenes (${elements.scenes.length})...`);
        await addDetectedItem('System', `Saving ${elements.scenes.length} scenes`);
        
        // Log the first scene to help with debugging
        console.log("First scene to save:", elements.scenes[0]);
        
        // Save each scene individually
        for (let i = 0; i < elements.scenes.length; i++) {
          const scene = elements.scenes[i];
          
          // Check for valid scene data before trying to save
          if (!scene || !scene.title) {
            console.warn(`Skipping invalid scene at index ${i}:`, scene);
            continue;
          }
          
          // Save the scene and handle any errors
          try {
            const savedScene = await saveScene(scene, analysisData.storyId);
            if (savedScene) {
              console.log(`Successfully saved scene ${i+1}/${elements.scenes.length}: ${savedScene.title}`);
            } else {
              console.warn(`Failed to save scene ${i+1}/${elements.scenes.length}: ${scene.title}`);
            }
          } catch (err) {
            console.error(`Error saving scene ${scene.title}:`, err);
            await addDetectedItem('Error', `Failed to save scene: ${scene.title}`);
            // Continue with next scene despite errors
          }
          
          // Update progress
          const sceneProgress = (i + 1) / elements.scenes.length;
          setSavingProgress((currentStep + sceneProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save events
      if (elements.events?.length > 0) {
        setAnalysisStage(`Saving events (${elements.events.length})...`);
        await addDetectedItem('System', `Saving ${elements.events.length} events`);
        
        // Log the first event to help with debugging
        console.log("First event to save:", elements.events[0]);
        
        // Save each event individually
        for (let i = 0; i < elements.events.length; i++) {
          const event = elements.events[i];
          
          // Check for valid event data before trying to save
          if (!event || !(event.title || event.name)) {
            console.warn(`Skipping invalid event at index ${i}:`, event);
            continue;
          }
          
          // Save the event and handle any errors
          try {
            const savedEvent = await saveEvent(event, analysisData.storyId);
            if (savedEvent) {
              console.log(`Successfully saved event ${i+1}/${elements.events.length}: ${savedEvent.title}`);
            } else {
              console.warn(`Failed to save event ${i+1}/${elements.events.length}: ${event.title || event.name}`);
            }
          } catch (err) {
            console.error(`Error saving event ${event.title || event.name}:`, err);
            await addDetectedItem('Error', `Failed to save event: ${event.title || event.name}`);
            // Continue with next event despite errors
          }
          
          // Update progress
          const eventProgress = (i + 1) / elements.events.length;
          setSavingProgress((currentStep + eventProgress) / totalSteps * 100);
        }
      }
      
      currentStep++;
      
      // Save plotlines
      if (elements.plotlines?.length > 0) {
        setAnalysisStage(`Saving plotlines (${elements.plotlines.length})...`);
        await addDetectedItem('System', `Saving ${elements.plotlines.length} plotlines`);
        
        // Log the first plotline to help with debugging
        console.log("First plotline to save:", elements.plotlines[0]);
        
        // Save each plotline individually
        for (let i = 0; i < elements.plotlines.length; i++) {
          const plotline = elements.plotlines[i];
          
          // Check for valid plotline data before trying to save
          if (!plotline || !plotline.title) {
            console.warn(`Skipping invalid plotline at index ${i}:`, plotline);
            continue;
          }
          
          // Save the plotline and handle any errors
          try {
            const savedPlotline = await savePlotline(plotline, analysisData.storyId);
            if (savedPlotline) {
              console.log(`Successfully saved plotline ${i+1}/${elements.plotlines.length}: ${savedPlotline.title}`);
            } else {
              console.warn(`Failed to save plotline ${i+1}/${elements.plotlines.length}: ${plotline.title}`);
            }
          } catch (err) {
            console.error(`Error saving plotline ${plotline.title}:`, err);
            await addDetectedItem('Error', `Failed to save plotline: ${plotline.title}`);
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
      if (elements.characterRelationships?.length > 0 && characters.length > 0) {
        setAnalysisStage(`Saving character relationships (${elements.characterRelationships.length})...`);
        await addDetectedItem('System', `Processing ${elements.characterRelationships.length} character relationships`);
        
        // Create a map of character names to IDs
        const characterMap: Record<string, string> = {};
        characters.forEach(char => {
          characterMap[char.name] = char.id;
        });
        
        console.log("Character map for relationships:", characterMap);
        console.log("First relationship to save:", elements.characterRelationships[0]);
        
        // Save each relationship individually
        let validRelationships = 0;
        let failedRelationships = 0;
        
        for (let i = 0; i < elements.characterRelationships.length; i++) {
          try {
            const relationship = elements.characterRelationships[i];
            
            // Verify both character names exist
            if (!relationship.character1_name || !relationship.character2_name) {
              console.warn(`Skipping relationship at index ${i} due to missing character names:`, relationship);
              continue;
            }
            
            const result = await saveCharacterRelationship(
              relationship, 
              characterMap, 
              analysisData.storyId
            );
            
            if (result) {
              validRelationships++;
              console.log(`Successfully saved relationship ${i+1}/${elements.characterRelationships.length}`);
            } else {
              failedRelationships++;
              console.warn(`Failed to save relationship ${i+1}/${elements.characterRelationships.length}`);
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
      
      // Store comprehensive results for the results page
      const analysisResults = {
        characters: characters,
        locations: locations,
        events: events,
        scenes: scenes,
        plotlines: plotlines,
        characterRelationships: characterRelationships,
        eventDependencies: eventDependencies,
        characterArcs: characterArcs,
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId,
        // Include actual counts from database
        counts: finalResults
      };
      
      sessionStorage.setItem('analysisResults', JSON.stringify(analysisResults));
      console.log("=== saveAnalysisResultsInBatches completed successfully ===");
      
      return finalResults;
    } catch (err: any) {
      const errorDetails = err instanceof Error ? 
        `${err.message}\n${err.stack || ''}` : 
        String(err);
        
      console.error("Error in saveAnalysisResultsInBatches:", errorDetails);
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
      }, Math.random() * 200 + 50); // Random delay between 50-250ms
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
  
  // Save extracted elements phase
  const processSaving = async () => {
    try {
      console.log("=== Starting processSaving ===");
      setIsAnalyzing(true);
      setAnalysisPhase('saving');
      setAnalysisStage('Starting to save elements...');
      
      // First, verify we have extracted elements
      if (!extractedElements) {
        throw new Error('No extracted elements found. Please try extracting the data again.');
      }
      
      // Verify we have valid IDs
      if (!storyId || !storyWorldId) {
        throw new Error('Missing story or story world ID. Please restart the analysis process.');
      }
      
      // Save extracted elements to database
      const results = await saveAnalysisResultsInBatches();
      
      console.log("=== Save results complete ===");
      console.log("Final save results:", results);
      
      setAnalysisPhase('complete');
    } catch (err: any) {
      console.error("Error during saving:", err);
      
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
      
      // Start from saving phase
      processSaving();
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
    processSaving();
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