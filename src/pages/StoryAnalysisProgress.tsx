import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService, Character, Location, Event } from '../services/SupabaseService';

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
        
        // Simulate detecting items with delays
        await simulateDetection('Character', 'John Smith');
        await simulateDetection('Character', 'Sarah Johnson');
        await simulateDetection('Location', 'Downtown Café');
        await simulateDetection('Event', 'First Meeting');
        await simulateDetection('Character', 'Detective Williams');
        await simulateDetection('Location', 'Police Station');
        await simulateDetection('Event', 'The Investigation Begins');
        
        // Call the actual analysis service
        const results = await SupabaseService.analyzeStory(
          analysisData.storyId,
          analysisData.storyWorldId,
          file.content
        );
        
        setCharacters(results.characters);
        setLocations(results.locations);
        setEvents(results.events);
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

  const simulateDetection = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setDetectedItems(prev => [...prev, { type, name }]);
        resolve();
      }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
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
