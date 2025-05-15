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

// Enhanced StoryAnalysisProgress component that uses the improved analyze-story edge function
// to detect and display comprehensive story elements
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
  
  const navigate = useNavigate();

  useEffect(() => {
    const analyzeStory = async () => {
      // Get analysis data from session storage
      const analysisDataStr = sessionStorage.getItem('analysisData');
      
      if (!analysisDataStr) {
        navigate('/import');
        return;
      }
      
      const analysisData: AnalysisData = JSON.parse(analysisDataStr);
      
      // Process each file
      for (const file of analysisData.files) {
        if (!file.content) continue;
        
        setCurrentFile(file.name);
        
        try {
          // Show stages of analysis
          setAnalysisStage('Extracting characters and locations...');
          await addDetectedItem('System', 'Starting narrative analysis');
          
          // Call the analyze-story edge function with our improved implementation
          const { data, error } = await supabase.functions.invoke('analyze-story', {
            body: {
              story_text: file.content,
              story_title: file.name.replace(/\.[^/.]+$/, ""),
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
                interactive_mode: true
              }
            }
          });
          
          if (error) {
            console.error("Error analyzing story:", error);
            await addDetectedItem('Error', `Analysis error: ${error.message}`);
            continue;
          }
          
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
          }
          
          // Process event dependencies
          if (data.eventDependencies && data.eventDependencies.length > 0) {
            setAnalysisStage('Identifying causal relationships between events...');
            
            const deps = data.eventDependencies;
            
            // Show some dependencies in detection log
            for (const dep of deps.slice(0, 5)) {
              await addDetectedItem('Dependency', `Event ${dep.predecessor_sequence} → Event ${dep.successor_sequence}`);
            }
            
            setEventDependencies(deps);
          }
          
          // Process character arcs
          if (data.characterArcs && data.characterArcs.length > 0) {
            setAnalysisStage('Mapping character development arcs...');
            
            const arcs = data.characterArcs;
            
            // Show character arcs in detection log
            for (const arc of arcs) {
              await addDetectedItem('Character Arc', arc.title || `${arc.character_name}'s Arc`);
            }
            
            setCharacterArcs(arcs);
          }
          
          setAnalysisStage('Finalizing analysis...');
          await addDetectedItem('System', 'Analysis completed successfully');
          
        } catch (err) {
          console.error("Error in analysis process:", err);
          await addDetectedItem('Error', `Analysis error: ${err}`);
        }
      }
      
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
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId
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
            </div>
          </div>
        </>
      ) : (
        <div className="analysis-complete">
          <div className="success-icon">✓</div>
          <h2>Analysis Complete!</h2>
          <p>Successfully analyzed all files and extracted narrative elements.</p>
          
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
          
          <button className="view-results-button" onClick={handleViewResults}>
            View Results
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryAnalysisProgress;