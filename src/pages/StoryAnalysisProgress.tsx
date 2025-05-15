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
  const [analysisPhase, setAnalysisPhase] = useState<'extracting' | 'saving' | 'complete' | 'error'>('extracting');
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
  const [extractedElements, setExtractedElements] = useState<any | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  
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
  
  // Stage 2: Save extracted elements to database
  const saveAnalysisResults = async (
    storyId: string, 
    storyWorldId: string, 
    elements: any
  ) => {
    try {
      setAnalysisStage('Saving elements to database...');
      
      // Save characters
      if (elements.characters?.length > 0) {
        setAnalysisStage('Saving character information...');
        await addDetectedItem('System', `Saving ${elements.characters.length} characters`);
        
        const charData = elements.characters.map((char: any) => ({
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
        }));
        
        try {
          const result = await SupabaseService.createCharacters(charData);
          
          for (const char of result) {
            await addDetectedItem('Character', char.name);
            setCharacters(prev => [...prev, char]);
          }
        } catch (err) {
          console.error("Error saving characters:", err);
          await addDetectedItem('Error', `Failed to save some characters`);
          // Continue with other elements instead of throwing
        }
      }
      
      // Save locations
      if (elements.locations?.length > 0) {
        setAnalysisStage('Saving location information...');
        await addDetectedItem('System', `Saving ${elements.locations.length} locations`);
        
        const locData = elements.locations.map((loc: any) => ({
          name: loc.name,
          location_type: loc.location_type || 'other',
          story_id: storyId,
          story_world_id: storyWorldId,
          description: loc.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        try {
          const result = await SupabaseService.createLocations(locData);
          
          for (const loc of result) {
            await addDetectedItem('Location', loc.name);
            setLocations(prev => [...prev, loc]);
          }
        } catch (err) {
          console.error("Error saving locations:", err);
          await addDetectedItem('Error', `Failed to save some locations`);
          // Continue with other elements
        }
      }
      
      // Save scenes
      if (elements.scenes?.length > 0) {
        setAnalysisStage('Saving scene information...');
        await addDetectedItem('System', `Saving ${elements.scenes.length} scenes`);
        
        const sceneData = elements.scenes.map((scene: any) => ({
          title: scene.title,
          content: scene.content,
          type: scene.type || 'scene',
          story_id: storyId,
          sequence_number: scene.sequence_number || 0,
          description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
          status: 'finished',
          is_visible: true
        }));
        
        try {
          const result = await SupabaseService.createScenes(sceneData);
          
          for (const scene of result) {
            await addDetectedItem('Scene', scene.title);
            setScenes(prev => [...prev, scene]);
          }
        } catch (err) {
          console.error("Error saving scenes:", err);
          await addDetectedItem('Error', `Failed to save some scenes`);
          // Continue with other elements
        }
      }
      
      // Save events
      if (elements.events?.length > 0) {
        setAnalysisStage('Saving event information...');
        await addDetectedItem('System', `Saving ${elements.events.length} events`);
        
        const eventData = elements.events.map((evt: any) => ({
          title: evt.title || evt.name,
          story_id: storyId,
          description: evt.description || '',
          sequence_number: evt.sequence_number || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        try {
          const result = await SupabaseService.createEvents(eventData);
          
          for (const evt of result) {
            await addDetectedItem('Event', evt.title);
            setEvents(prev => [...prev, evt]);
          }
        } catch (err) {
          console.error("Error saving events:", err);
          await addDetectedItem('Error', `Failed to save some events`);
          // Continue with other elements
        }
      }
      
      // Save plotlines
      if (elements.plotlines?.length > 0) {
        setAnalysisStage('Saving plotline information...');
        await addDetectedItem('System', `Saving ${elements.plotlines.length} plotlines`);
        
        const plotlineData = elements.plotlines.map((plot: any) => ({
          title: plot.title,
          description: plot.description || '',
          plotline_type: plot.plotline_type || 'main',
          story_id: storyId
        }));
        
        try {
          const result = await SupabaseService.createPlotlines(plotlineData);
          
          for (const plot of result) {
            await addDetectedItem('Plotline', plot.title);
            setPlotlines(prev => [...prev, plot]);
          }
        } catch (err) {
          console.error("Error saving plotlines:", err);
          await addDetectedItem('Error', `Failed to save some plotlines`);
          // Continue with other elements
        }
      }
      
      // Save character relationships (after characters are saved)
      if (elements.characterRelationships?.length > 0 && characters.length > 0) {
        setAnalysisStage('Saving character relationships...');
        await addDetectedItem('System', `Processing ${elements.characterRelationships.length} character relationships`);
        
        // Create a map of character names to IDs
        const characterMap: Record<string, string> = {};
        characters.forEach(char => {
          characterMap[char.name] = char.id;
        });
        
        // Filter relationships where both characters exist
        const relationshipsToSave = elements.characterRelationships
          .filter((rel: any) => 
            rel.character1_name && 
            rel.character2_name && 
            characterMap[rel.character1_name] && 
            characterMap[rel.character2_name]
          )
          .map((rel: any) => ({
            character1_id: characterMap[rel.character1_name],
            character2_id: characterMap[rel.character2_name],
            relationship_type: rel.relationship_type || 'other',
            description: rel.description || '',
            intensity: rel.intensity || 5,
            story_id: storyId
          }));
        
        if (relationshipsToSave.length > 0) {
          await addDetectedItem('System', `Saving ${relationshipsToSave.length} character relationships`);
          
          try {
            const result = await SupabaseService.createCharacterRelationships(relationshipsToSave);
            
            for (const rel of result) {
              const char1 = characters.find(c => c.id === rel.character1_id);
              const char2 = characters.find(c => c.id === rel.character2_id);
              if (char1 && char2) {
                await addDetectedItem('Relationship', `${char1.name} - ${char2.name}`);
              }
              setCharacterRelationships(prev => [...prev, rel]);
            }
          } catch (err) {
            console.error("Error saving relationships:", err);
            await addDetectedItem('Error', `Failed to save some relationships`);
            // Continue with other elements
          }
        }
      }
      
      // Process other elements (character arcs, event dependencies, etc.) following the same pattern
      // ...
      
      // Finalize
      setAnalysisStage('Finalizing analysis...');
      await addDetectedItem('System', 'Analysis completed successfully');
      
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
    return `${type}-${name}`;
  };

  // Add a detected item with a small delay to create visual feedback
  const addDetectedItem = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const itemId = generateUniqueId(type, name);
        
        // Check if this item has already been displayed
        if (!displayedItemsRef.current[itemId]) {
          displayedItemsRef.current[itemId] = true;
          setDetectedItems(prev => [...prev, { type, name, id: itemId }]);
        }
        
        resolve();
      }, Math.random() * 200 + 50); // Random delay between 50-250ms
    });
  };

  useEffect(() => {
    // Split the analysis process into two distinct phases
    const processAnalysis = async () => {
      // Reset the displayed items tracking on each analysis process
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
            setExtractedElements(elements);
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
        
        // Continue with Phase 2 only if extraction was successful
        setAnalysisPhase('saving');
        
        // Phase 2: Save extracted elements to database
        await saveAnalysisResults(
          analysisData.storyId,
          analysisData.storyWorldId,
          elements
        );
        
        setAnalysisPhase('complete');
      } catch (err: any) {
        console.error("Error during analysis:", err);
        setError(`Analysis error: ${err.message || 'Unknown error'}`);
        await addDetectedItem('Error', `Analysis error: ${err.message || 'Unknown error'}`);
        setAnalysisPhase('error');
      } finally {
        setIsAnalyzing(false);
        
        // Only store results if we have them
        if (analysisPhase !== 'error') {
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
            storyId: JSON.parse(analysisDataStr).storyId,
            storyWorldId: JSON.parse(analysisDataStr).storyWorldId
          }));
        }
      }
    };
    
    processAnalysis();
  }, []);

  const handleViewResults = () => {
    navigate('/analysis-results');
  };

  const handleRetry = () => {
    // If we have extracted elements but failed to save, retry only the saving phase
    if (extractedElements && analysisPhase === 'saving') {
      // Get analysis data from session storage
      const analysisDataStr = sessionStorage.getItem('analysisData');
      if (analysisDataStr) {
        const analysisData = JSON.parse(analysisDataStr);
        // Reset only relevant states
        setError(null);
        setIsAnalyzing(true);
        
        // Reset the displayed items tracking for the saving phase
        const newDisplayedItems: DisplayedItems = {};
        for (const item of detectedItems) {
          if (item.type === 'System' || item.type === 'Error' || item.type === 'Warning') {
            newDisplayedItems[item.id] = true;
          }
        }
        displayedItemsRef.current = newDisplayedItems;
        
        // Start from saving phase
        (async () => {
          try {
            await saveAnalysisResults(
              analysisData.storyId,
              analysisData.storyWorldId,
              extractedElements
            );
            setAnalysisPhase('complete');
          } catch (err: any) {
            console.error("Error during retry of saving:", err);
            setError(`Saving error: ${err.message || 'Unknown error'}`);
            setAnalysisPhase('error');
          } finally {
            setIsAnalyzing(false);
          }
        })();
      }
    } else {
      // Full retry - Reset everything and reload
      displayedItemsRef.current = {};
      setDetectedItems([]);
      window.location.reload();
    }
  };

  const getAnalysisPhaseDisplay = () => {
    switch (analysisPhase) {
      case 'extracting':
        return 'Phase 1 of 2: Extracting narrative elements';
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
          </div>
          
          <div className="detection-log">
            <h3>Detection Log</h3>
            <div className="log-entries">
              {detectedItems.map((item, index) => (
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
                {analysisPhase === 'saving' && extractedElements ? 'Retry Saving' : 'Retry Analysis'}
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