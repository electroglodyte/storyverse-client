import React, { useState, useEffect } from 'react';
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
  const [currentFile, setCurrentFile] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<Array<{type: string; name: string}>>([]);
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
  const [analyzeResponse, setAnalyzeResponse] = useState<any | null>(null);
  
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
      const response = await supabase.functions.invoke('analyze-story', {
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
            debug: true
          }
        }
      });
      
      if (response.error) {
        console.error("Error from analyze-story edge function:", response.error);
        throw new Error(`Analysis error: ${response.error.message || 'Unknown error'}`);
      }
      
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
    extractedElements: any
  ) => {
    try {
      setAnalysisStage('Saving elements to database...');
      
      // Prepare data for database
      const charData = extractedElements.characters?.map((char: any) => ({
        name: char.name,
        role: char.role || 'supporting',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: char.description || '',
        appearance: char.appearance,
        personality: char.personality,
        background: char.background,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [];
      
      // Process each element type in order
      if (charData.length > 0) {
        setAnalysisStage('Saving character information...');
        await addDetectedItem('System', `Saving ${charData.length} characters`);
        
        const result = await SupabaseService.createCharacters(charData);
        
        for (const char of result) {
          await addDetectedItem('Character', char.name);
          setCharacters(prev => [...prev, char]);
        }
      }
      
      const locData = extractedElements.locations?.map((loc: any) => ({
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [];
      
      if (locData.length > 0) {
        setAnalysisStage('Saving location information...');
        await addDetectedItem('System', `Saving ${locData.length} locations`);
        
        const result = await SupabaseService.createLocations(locData);
        
        for (const loc of result) {
          await addDetectedItem('Location', loc.name);
          setLocations(prev => [...prev, loc]);
        }
      }
      
      const sceneData = extractedElements.scenes?.map((scene: any) => ({
        title: scene.title,
        content: scene.content,
        type: scene.type || 'scene',
        story_id: storyId,
        sequence_number: scene.sequence_number || 0,
        description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
        status: 'finished',
        is_visible: true
      })) || [];
      
      if (sceneData.length > 0) {
        setAnalysisStage('Saving scene information...');
        await addDetectedItem('System', `Saving ${sceneData.length} scenes`);
        
        const result = await SupabaseService.createScenes(sceneData);
        
        for (const scene of result) {
          await addDetectedItem('Scene', scene.title);
          setScenes(prev => [...prev, scene]);
        }
      }
      
      const eventData = extractedElements.events?.map((evt: any) => ({
        title: evt.title || evt.name,
        story_id: storyId,
        description: evt.description || '',
        sequence_number: evt.sequence_number || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [];
      
      if (eventData.length > 0) {
        setAnalysisStage('Saving event information...');
        await addDetectedItem('System', `Saving ${eventData.length} events`);
        
        const result = await SupabaseService.createEvents(eventData);
        
        for (const evt of result) {
          await addDetectedItem('Event', evt.title);
          setEvents(prev => [...prev, evt]);
        }
      }
      
      const plotlineData = extractedElements.plotlines?.map((plot: any) => ({
        title: plot.title,
        description: plot.description || '',
        plotline_type: plot.plotline_type || 'main',
        story_id: storyId
      })) || [];
      
      if (plotlineData.length > 0) {
        setAnalysisStage('Saving plotline information...');
        await addDetectedItem('System', `Saving ${plotlineData.length} plotlines`);
        
        const result = await SupabaseService.createPlotlines(plotlineData);
        
        for (const plot of result) {
          await addDetectedItem('Plotline', plot.title);
          setPlotlines(prev => [...prev, plot]);
        }
      }
      
      // After saving characters, we can save relationships
      if (extractedElements.characterRelationships?.length > 0 && characters.length > 0) {
        setAnalysisStage('Saving character relationships...');
        
        // Create a map of character names to IDs
        const characterMap: Record<string, string> = {};
        characters.forEach(char => {
          characterMap[char.name] = char.id;
        });
        
        // Filter relationships where both characters exist
        const relationshipsToSave = extractedElements.characterRelationships
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
          
          const result = await SupabaseService.createCharacterRelationships(relationshipsToSave);
          
          for (const rel of result) {
            const char1 = characters.find(c => c.id === rel.character1_id);
            const char2 = characters.find(c => c.id === rel.character2_id);
            if (char1 && char2) {
              await addDetectedItem('Relationship', `${char1.name} - ${char2.name}`);
            }
            setCharacterRelationships(prev => [...prev, rel]);
          }
        }
      }
      
      // After saving all elements, finalize
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

  useEffect(() => {
    const processAnalysis = async () => {
      // Get analysis data from session storage
      const analysisDataStr = sessionStorage.getItem('analysisData');
      
      if (!analysisDataStr) {
        setError('No analysis data found. Please return to the import screen.');
        setIsAnalyzing(false);
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
          return;
        }
        
        // Stage 1: Extract narrative elements
        try {
          const extractedElements = await analyzeText(analysisData);
          setAnalyzeResponse(extractedElements);
          
          // Add extracted items to UI
          if (extractedElements.characters) {
            for (const char of extractedElements.characters.slice(0, 5)) {
              await addDetectedItem('Character', char.name);
            }
          }
          
          if (extractedElements.locations) {
            for (const loc of extractedElements.locations) {
              await addDetectedItem('Location', loc.name);
            }
          }
          
          if (extractedElements.scenes) {
            for (const scene of extractedElements.scenes.slice(0, 5)) {
              await addDetectedItem('Scene', scene.title);
            }
          }
          
          if (extractedElements.events) {
            for (const evt of extractedElements.events.slice(0, 5)) {
              await addDetectedItem('Event', evt.title);
            }
          }
          
          if (extractedElements.plotlines) {
            for (const plot of extractedElements.plotlines) {
              await addDetectedItem('Plotline', plot.title);
            }
          }
          
          // Stage 2: Save extracted elements to database
          await saveAnalysisResults(
            analysisData.storyId,
            analysisData.storyWorldId,
            extractedElements
          );
        } catch (err: any) {
          console.error("Error during analysis:", err);
          setError(`Analysis error: ${err.message || 'Unknown error'}`);
          await addDetectedItem('Error', `Analysis error: ${err.message || 'Unknown error'}`);
        }
        
      } catch (err: any) {
        console.error("Error parsing analysis data:", err);
        setError(`Error preparing analysis: ${err.message || 'Unknown error'}`);
      } finally {
        setIsAnalyzing(false);
        
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
    };
    
    processAnalysis();
  }, []);

  const addDetectedItem = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setDetectedItems(prev => [...prev, { type, name }]);
        resolve();
      }, Math.random() * 200 + 50); // Quicker random delay
    });
  };

  const handleViewResults = () => {
    navigate('/analysis-results');
  };

  const handleRetry = () => {
    window.location.reload(); // Reload the page to retry the analysis
  };

  return (
    <div className="analysis-progress-container">
      <h1>Analyzing Story</h1>
      
      {isAnalyzing ? (
        <>
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>Analyzing: {currentFile}</p>
            <div className="analysis-stage">{analysisStage}</div>
          </div>
          
          <div className="detection-log">
            <h3>Detection Log</h3>
            <div className="log-entries">
              {detectedItems.map((item, index) => (
                <div key={index} className="log-entry">
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
                Retry Analysis
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