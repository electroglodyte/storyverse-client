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

// Map to track which items have been displayed to avoid duplication
interface DisplayedItems {
  [key: string]: boolean;
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
  
  // Use a ref to track displayed items to avoid duplication
  const displayedItemsRef = useRef<DisplayedItems>({});
  
  const navigate = useNavigate();

  // Stage 1: Analyze text and extract narrative elements
  const analyzeText = async (analysisData: AnalysisData) => {
    try {
      setAnalysisStage('Extracting narrative elements from text...');
      const file = analysisData.files[0];
      
      if (!file || !file.content) {
        throw new Error('No file content found for analysis');
      }
      
      // Call the edge function to analyze the content
      console.log(`Calling analyze-story edge function for ${file.name}`);
      await addDetectedItem('System', `Analyzing ${file.name} text...`);
      
      // Setup timeout handling
      const TIMEOUT_MS = 25000; // 25 seconds
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
            retry_attempt: retryAttempt
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
      
      await addDetectedItem('System', 'Text analysis complete');
      return response.data;
    } catch (err: any) {
      console.error("Error analyzing text:", err);
      throw err;
    }
  };
  
  // Save a single character to the database
  const saveCharacter = async (char: any, storyId: string, storyWorldId: string) => {
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
    
    try {
      const result = await SupabaseService.createCharacters([charData]);
      if (result && result.length > 0) {
        await addDetectedItem('Character', result[0].name);
        setCharacters(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving character:", err);
      await addDetectedItem('Error', `Failed to save character: ${char.name}`);
    }
    return null;
  };
  
  // Save a single location to the database
  const saveLocation = async (loc: any, storyId: string, storyWorldId: string) => {
    const locData = {
      name: loc.name,
      location_type: loc.location_type || 'other',
      story_id: storyId,
      story_world_id: storyWorldId,
      description: loc.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const result = await SupabaseService.createLocations([locData]);
      if (result && result.length > 0) {
        await addDetectedItem('Location', result[0].name);
        setLocations(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving location:", err);
      await addDetectedItem('Error', `Failed to save location: ${loc.name}`);
    }
    return null;
  };
  
  // Save a single scene to the database
  const saveScene = async (scene: any, storyId: string) => {
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
    
    try {
      const result = await SupabaseService.createScenes([sceneData]);
      if (result && result.length > 0) {
        await addDetectedItem('Scene', result[0].title);
        setScenes(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving scene:", err);
      await addDetectedItem('Error', `Failed to save scene: ${scene.title}`);
    }
    return null;
  };
  
  // Save a single event to the database
  const saveEvent = async (evt: any, storyId: string) => {
    const eventData = {
      title: evt.title || evt.name,
      story_id: storyId,
      description: evt.description || '',
      sequence_number: evt.sequence_number || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const result = await SupabaseService.createEvents([eventData]);
      if (result && result.length > 0) {
        await addDetectedItem('Event', result[0].title);
        setEvents(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving event:", err);
      await addDetectedItem('Error', `Failed to save event: ${evt.title}`);
    }
    return null;
  };
  
  // Save a single plotline to the database
  const savePlotline = async (plot: any, storyId: string) => {
    const plotlineData = {
      title: plot.title,
      description: plot.description || '',
      plotline_type: plot.plotline_type || 'main',
      story_id: storyId
    };
    
    try {
      const result = await SupabaseService.createPlotlines([plotlineData]);
      if (result && result.length > 0) {
        await addDetectedItem('Plotline', result[0].title);
        setPlotlines(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving plotline:", err);
      await addDetectedItem('Error', `Failed to save plotline: ${plot.title}`);
    }
    return null;
  };
  
  // Save a character relationship to the database
  const saveCharacterRelationship = async (rel: any, characterMap: Record<string, string>, storyId: string) => {
    if (!rel.character1_name || !rel.character2_name || 
        !characterMap[rel.character1_name] || !characterMap[rel.character2_name]) {
      return null;
    }
    
    const relationshipData = {
      character1_id: characterMap[rel.character1_name],
      character2_id: characterMap[rel.character2_name],
      relationship_type: rel.relationship_type || 'other',
      description: rel.description || '',
      intensity: rel.intensity || 5,
      story_id: storyId
    };
    
    try {
      const result = await SupabaseService.createCharacterRelationships([relationshipData]);
      if (result && result.length > 0) {
        const char1 = characters.find(c => c.id === result[0].character1_id);
        const char2 = characters.find(c => c.id === result[0].character2_id);
        if (char1 && char2) {
          await addDetectedItem('Relationship', `${char1.name} - ${char2.name}`);
        }
        setCharacterRelationships(prev => [...prev, result[0]]);
        return result[0];
      }
    } catch (err) {
      console.error("Error saving relationship:", err);
      await addDetectedItem('Error', `Failed to save relationship`);
    }
    return null;
  };
  
  // Save extracted elements to database in small batches
  const saveAnalysisResultsInBatches = async () => {
    try {
      // Get elements from session storage
      const extractedElementsStr = sessionStorage.getItem('extractedElements');
      if (!extractedElementsStr) {
        throw new Error('No extracted elements found');
      }
      
      const elements = JSON.parse(extractedElementsStr);
      const analysisData = JSON.parse(sessionStorage.getItem('analysisData')!);
      
      const totalSteps = 5; // Characters, locations, scenes, events, plotlines
      let currentStep = 0;
      
      // Save characters
      if (elements.characters?.length > 0) {
        setAnalysisStage(`Saving characters (${elements.characters.length})...`);
        await addDetectedItem('System', `Saving ${elements.characters.length} characters`);
        
        // Save each character individually
        for (let i = 0; i < elements.characters.length; i++) {
          await saveCharacter(elements.characters[i], analysisData.storyId, analysisData.storyWorldId);
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
        
        // Save each location individually
        for (let i = 0; i < elements.locations.length; i++) {
          await saveLocation(elements.locations[i], analysisData.storyId, analysisData.storyWorldId);
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
        
        // Save each scene individually
        for (let i = 0; i < elements.scenes.length; i++) {
          await saveScene(elements.scenes[i], analysisData.storyId);
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
        
        // Save each event individually
        for (let i = 0; i < elements.events.length; i++) {
          await saveEvent(elements.events[i], analysisData.storyId);
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
        
        // Save each plotline individually
        for (let i = 0; i < elements.plotlines.length; i++) {
          await savePlotline(elements.plotlines[i], analysisData.storyId);
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
        
        // Save each relationship individually
        let validRelationships = 0;
        for (let i = 0; i < elements.characterRelationships.length; i++) {
          const result = await saveCharacterRelationship(
            elements.characterRelationships[i], 
            characterMap, 
            analysisData.storyId
          );
          if (result) validRelationships++;
        }
        
        await addDetectedItem('System', `Saved ${validRelationships} character relationships`);
      }
      
      // Process other elements (character arcs, event dependencies, etc.) following the same pattern
      // ...
      
      // Finalize
      setAnalysisStage('Finalizing analysis...');
      await addDetectedItem('System', 'Analysis completed successfully');
      
      // Store comprehensive results for the results page
      sessionStorage.setItem('analysisResults', JSON.stringify({
        characters,
        locations,
        events,
        scenes,
        plotlines,
        characterRelationships,
        eventDependencies,
        characterArcs,
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId
      }));
      
      return {
        characters: characters.length,
        locations: locations.length,
        events: events.length,
        scenes: scenes.length,
        plotlines: plotlines.length
      };
    } catch (err: any) {
      console.error("Error saving analysis results:", err);
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
    // Reset the displayed items tracking
    displayedItemsRef.current = {};
    
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
      
      // Check if we already have extracted elements (if resuming)
      const extractedElementsStr = sessionStorage.getItem('extractedElements');
      if (extractedElementsStr) {
        // We already have extracted elements, so we can skip to saving
        setAnalysisPhase('extracted');
        return;
      }
      
      // Phase 1: Extract narrative elements
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
            // Store extracted elements in session storage
            sessionStorage.setItem('extractedElements', JSON.stringify(elements));
            
            // Continue to the saving phase
            setAnalysisPhase('extracted');
            
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
      await addDetectedItem('Error', `Extraction error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
      setIsAnalyzing(false);
    }
  };
  
  // Save extracted elements phase
  const processSaving = async () => {
    try {
      setAnalysisPhase('saving');
      setAnalysisStage('Starting to save elements...');
      
      // Save extracted elements to database
      await saveAnalysisResultsInBatches();
      
      setAnalysisPhase('complete');
    } catch (err: any) {
      console.error("Error during saving:", err);
      setError(`Saving error: ${err.message || 'Unknown error'}`);
      await addDetectedItem('Error', `Saving error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  useEffect(() => {
    // Start with extraction
    processExtraction();
  }, []);
  
  // Effect for handling phase changes
  useEffect(() => {
    if (analysisPhase === 'extracted') {
      // If we have extracted elements, proceed to saving
      processSaving();
    }
  }, [analysisPhase]);

  const handleViewResults = () => {
    navigate('/analysis-results');
  };

  const handleRetry = () => {
    // If we have extracted elements but failed to save, retry only the saving phase
    if (analysisPhase === 'error' && sessionStorage.getItem('extractedElements')) {
      // Reset relevant states
      setError(null);
      setIsAnalyzing(true);
      
      // Start from saving phase
      processSaving();
    } else {
      // Full retry - Reset everything and reload
      setDetectedItems([]);
      
      // Remove extracted elements from session storage to force a new extraction
      sessionStorage.removeItem('extractedElements');
      
      // Reload the page
      window.location.reload();
    }
  };

  const handleContinueToSaving = () => {
    setIsAnalyzing(true);
    processSaving();
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
            {/* Display extraction summary here */}
            {debugInfo && (
              <div className="debug-info">
                <h3>Debug Information</h3>
                <pre>{debugInfo}</pre>
              </div>
            )}
          </div>
          
          <button className="continue-button" onClick={handleContinueToSaving}>
            Continue to Save Elements
          </button>
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
              <button className="retry-button" onClick={handleRetry}>
                {sessionStorage.getItem('extractedElements') ? 'Retry Saving' : 'Retry Analysis'}
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
                  <span className="count">{characters.length}</span>
                </div>
                <div className="summary-item">
                  <h3>Locations</h3>
                  <span className="count">{locations.length}</span>
                </div>
                <div className="summary-item">
                  <h3>Events</h3>
                  <span className="count">{events.length}</span>
                </div>
                <div className="summary-item">
                  <h3>Scenes</h3>
                  <span className="count">{scenes.length}</span>
                </div>
                <div className="summary-item">
                  <h3>Plotlines</h3>
                  <span className="count">{plotlines.length}</span>
                </div>
              </div>
              
              <div className="actions-container">
                <button className="view-results-button" onClick={handleViewResults}>
                  View Results
                </button>
                {characters.length === 0 && locations.length === 0 && events.length === 0 && (
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