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

// Updated StoryAnalysisProgress component (May 15, 2025)
const StoryAnalysisProgress: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<Array<{type: string; name: string}>>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
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
          // Call the actual edge function for analysis
          const { data, error } = await supabase.functions.invoke('analyze-story', {
            body: {
              story_text: file.content,
              story_title: file.name.replace(/\.[^/.]+$/, ""),
              options: {
                create_project: false, // We already have a story ID
                extract_characters: true,
                extract_locations: true,
                extract_events: true,
                extract_relationships: true,
                interactive_mode: true // Enable real-time detection updates
              }
            }
          });
          
          if (error) {
            console.error("Error analyzing story:", error);
            continue;
          }
          
          // Process real detected characters from the text analysis
          if (data.characters && data.characters.length > 0) {
            const chars = data.characters.map((char: any) => ({
              id: '',
              name: char.name,
              role: char.role || 'supporting',
              story_id: analysisData.storyId,
              story_world_id: analysisData.storyWorldId,
              description: char.description || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            // Show each character in detection log
            for (const char of chars) {
              await addDetectedItem('Character', char.name);
            }
            
            setCharacters(chars);
          }
          
          // Process real detected locations
          if (data.locations && data.locations.length > 0) {
            const locs = data.locations.map((loc: any) => ({
              id: '',
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
          
          // Process real detected events
          if (data.events && data.events.length > 0) {
            const evts = data.events.map((evt: any) => ({
              id: '',
              title: evt.title,
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
          
          // Save the extracted entities to the database
          await SupabaseService.saveAnalysisResults(
            analysisData.storyId,
            analysisData.storyWorldId,
            chars || [],
            locs || [],
            evts || []
          );
          
        } catch (err) {
          console.error("Error in analysis process:", err);
        }
      }
      
      setIsAnalyzing(false);
      
      // Store results for the results page
      sessionStorage.setItem('analysisResults', JSON.stringify({
        characters,
        locations,
        events,
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
      }, Math.random() * 300 + 200); // Shorter random delay for smoother experience
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
