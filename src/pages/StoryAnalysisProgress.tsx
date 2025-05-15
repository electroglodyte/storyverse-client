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
  
  const navigate = useNavigate();

  useEffect(() => {
    const analyzeStory = async () => {
      // Get analysis data from session storage
      const analysisDataStr = sessionStorage.getItem('analysisData');
      
      if (!analysisDataStr) {
        setError('No analysis data found. Please return to the import screen.');
        setIsAnalyzing(false);
        return;
      }
      
      try {
        const analysisData: AnalysisData = JSON.parse(analysisDataStr);
        
        // Debug the stored analysis data
        console.log('Analysis data from session storage:', analysisData);
        setDebugInfo(`Story ID: ${analysisData.storyId}, Files: ${analysisData.files.length}`);
        
        // Check if there are any files to analyze
        if (!analysisData.files || analysisData.files.length === 0) {
          setError('No files found for analysis. Please upload a file and try again.');
          setIsAnalyzing(false);
          return;
        }
        
        // Process each file
        for (const file of analysisData.files) {
          setCurrentFile(file.name);
          
          // Check if the file has content
          if (!file.content) {
            await addDetectedItem('Error', `File ${file.name} has no content`);
            continue;
          }
          
          // Debug file content (truncated for large files)
          const contentPreview = file.content.length > 100 
            ? file.content.substring(0, 100) + '...' 
            : file.content;
          console.log(`File ${file.name} content preview:`, contentPreview);
          
          // Ensure we have some actual text content
          if (file.content.trim().length === 0) {
            await addDetectedItem('Error', `File ${file.name} is empty`);
            continue;
          }
          
          try {
            // Show stages of analysis
            setAnalysisStage('Extracting characters and locations...');
            await addDetectedItem('System', 'Starting narrative analysis');
            
            // Call the analyze-story edge function with our improved implementation
            console.log(`Calling analyze-story edge function for ${file.name}`);
            const response = await supabase.functions.invoke('analyze-story', {
              body: {
                story_text: file.content,
                story_title: file.name.replace(/\\.[^/.]+$/, ""),
                story_world_id: analysisData.storyWorldId,
                options: {
                  create_project: true, // Save directly to the database
                  story_id: analysisData.storyId,
                  extract_characters: true,
                  extract_locations: true,
                  extract_events: true,
                  extract_scenes: true,
                  extract_relationships: true,
                  extract_dependencies: true, 
                  extract_plotlines: true,
                  extract_arcs: true,
                  interactive_mode: true,
                  debug: true // Enable debug mode
                }
              }
            });
            
            // Debug the response from the edge function
            console.log('Edge function response:', response);
            
            if (response.error) {
              console.error("Error from analyze-story edge function:", response.error);
              await addDetectedItem('Error', `Analysis error: ${response.error.message}`);
              setError(`Analysis error: ${response.error.message}`);
              continue;
            }
            
            const data = response.data;
            
            // Extra validation that we got a valid response
            if (!data) {
              console.error("No data returned from analyze-story edge function");
              await addDetectedItem('Error', `No data returned from analysis`);
              setError('No data returned from analysis function');
              continue;
            }
            
            // Debug the extracted elements
            console.log('Extracted elements:', {
              characters: data.characters?.length || 0,
              locations: data.locations?.length || 0,
              scenes: data.scenes?.length || 0,
              events: data.events?.length || 0,
              plotlines: data.plotlines?.length || 0,
              relationships: data.characterRelationships?.length || 0
            });
            
            // Process detected characters from the edge function
            if (data.characters && data.characters.length > 0) {
              setAnalysisStage('Processing character information...');
              
              const chars = data.characters.map((char: any) => ({
                id: char.id || '',
                name: char.name,
                role: char.role || 'supporting',
                story_id: analysisData.storyId,
                story_world_id: analysisData.storyWorldId,
                description: char.description || '',
                appearance: char.appearance,
                personality: char.personality,
                background: char.background,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              // Show each character in detection log
              for (const char of chars) {
                await addDetectedItem('Character', char.name);
              }
              
              setCharacters(chars);
            } else {
              await addDetectedItem('System', 'No characters detected in the text');
            }
            
            // Process detected locations
            if (data.locations && data.locations.length > 0) {
              setAnalysisStage('Mapping locations...');
              
              const locs = data.locations.map((loc: any) => ({
                id: loc.id || '',
                name: loc.name,
                location_type: loc.location_type || 'other',
                story_id: analysisData.storyId,
                story_world_id: analysisData.storyWorldId,
                description: loc.description || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              // Show each location in detection log
              for (const loc of locs) {
                await addDetectedItem('Location', loc.name);
              }
              
              setLocations(locs);
            } else {
              await addDetectedItem('System', 'No locations detected in the text');
            }
            
            // Process detected scenes
            if (data.scenes && data.scenes.length > 0) {
              setAnalysisStage('Dividing content into scenes and chapters...');
              
              const scns = data.scenes.map((scene: any) => ({
                id: scene.id || '',
                title: scene.title,
                content: scene.content,
                type: scene.type || 'scene',
                story_id: analysisData.storyId,
                sequence_number: scene.sequence_number || 0
              }));
              
              // Show scene divisions in detection log
              for (const scene of scns) {
                await addDetectedItem('Scene', scene.title);
              }
              
              setScenes(scns);
            } else {
              await addDetectedItem('System', 'No scenes detected in the text');
            }
            
            // Process detected events
            if (data.events && data.events.length > 0) {
              setAnalysisStage('Identifying key story events...');
              
              const evts = data.events.map((evt: any) => ({
                id: evt.id || '',
                title: evt.title || evt.name,
                story_id: analysisData.storyId,
                description: evt.description || '',
                sequence_number: evt.sequence_number || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              // Show each event in detection log
              for (const evt of evts) {
                await addDetectedItem('Event', evt.title);
              }
              
              setEvents(evts);
            } else {
              await addDetectedItem('System', 'No events detected in the text');
            }
            
            // Process detected plotlines
            if (data.plotlines && data.plotlines.length > 0) {
              setAnalysisStage('Identifying narrative plotlines...');
              
              const plots = data.plotlines.map((plot: any) => ({
                id: plot.id || '',
                title: plot.title,
                description: plot.description || '',
                plotline_type: plot.plotline_type || 'main',
                story_id: analysisData.storyId
              }));
              
              // Show plotlines in detection log
              for (const plot of plots) {
                await addDetectedItem('Plotline', plot.title);
              }
              
              setPlotlines(plots);
            } else {
              await addDetectedItem('System', 'No plotlines detected in the text');
            }
            
            // Process character relationships
            if (data.characterRelationships && data.characterRelationships.length > 0) {
              setAnalysisStage('Mapping character relationships...');
              
              const rels = data.characterRelationships;
              
              // Show relationships in detection log
              for (const rel of rels) {
                await addDetectedItem('Relationship', `${rel.character1_name} - ${rel.character2_name}`);
              }
              
              setCharacterRelationships(rels);
            } else {
              await addDetectedItem('System', 'No character relationships detected');
            }
            
            // Add other element types with similar pattern...
            
            setAnalysisStage('Finalizing analysis...');
            await addDetectedItem('System', 'Analysis completed successfully');
            
            // If we haven't detected any narrative elements, add a warning
            if (
              (!data.characters || data.characters.length === 0) &&
              (!data.locations || data.locations.length === 0) &&
              (!data.events || data.events.length === 0) &&
              (!data.scenes || data.scenes.length === 0) &&
              (!data.plotlines || data.plotlines.length === 0)
            ) {
              await addDetectedItem('Warning', 'No narrative elements were detected in this text');
              setDebugInfo((prev) => `${prev}\nNo narrative elements detected. Text might be too short or in an unsupported format.`);
            }
            
          } catch (err: any) {
            console.error("Error in analysis process:", err);
            setError(`Analysis error: ${err.message || 'Unknown error'}`);
            await addDetectedItem('Error', `Analysis error: ${err.message || 'Unknown error'}`);
          }
        }
        
        // Attempt to save extracted elements to the database if we have any
        if (
          characters.length > 0 || 
          locations.length > 0 || 
          events.length > 0 || 
          scenes.length > 0 || 
          plotlines.length > 0
        ) {
          try {
            await SupabaseService.saveAnalysisResults(
              analysisData.storyId,
              analysisData.storyWorldId,
              characters,
              locations,
              events,
              scenes,
              plotlines,
              characterRelationships,
              eventDependencies,
              characterArcs
            );
            await addDetectedItem('System', 'Saved analysis results to database');
          } catch (saveErr: any) {
            console.error("Error saving analysis results:", saveErr);
            setError(`Error saving results: ${saveErr.message || 'Unknown error'}`);
            await addDetectedItem('Error', `Failed to save results: ${saveErr.message || 'Unknown error'}`);
          }
        }
        
      } catch (err: any) {
        console.error("Error parsing analysis data:", err);
        setError(`Error preparing analysis: ${err.message || 'Unknown error'}`);
      } finally {
        setIsAnalyzing(false);
      }
      
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
    };
    
    analyzeStory();
  }, [navigate]);

  const addDetectedItem = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setDetectedItems(prev => [...prev, { type, name }]);
        resolve();
      }, Math.random() * 300 + 100); // Random delay for visual effect
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