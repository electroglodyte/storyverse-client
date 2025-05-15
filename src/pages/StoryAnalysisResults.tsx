import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService, Character, Location, Event, Story, StoryWorld } from '../services/SupabaseService';

import './StoryAnalysisResults.css';

interface AnalysisResults {
  characters: Character[];
  locations: Location[];
  events: Event[];
  storyId: string;
  storyWorldId: string;
}

const StoryAnalysisResults: React.FC = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [storyWorld, setStoryWorld] = useState<StoryWorld | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'events'>('characters');
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadResults = async () => {
      const resultsStr = sessionStorage.getItem('analysisResults');
      
      if (!resultsStr) {
        navigate('/import');
        return;
      }
      
      const parsedResults: AnalysisResults = JSON.parse(resultsStr);
      setResults(parsedResults);
      
      // Load story and story world details
      const stories = await SupabaseService.getStories(parsedResults.storyWorldId);
      const storyItem = stories.find(s => s.id === parsedResults.storyId);
      if (storyItem) {
        setStory(storyItem);
      }
      
      const storyWorlds = await SupabaseService.getStoryWorlds();
      const worldItem = storyWorlds.find(w => w.id === parsedResults.storyWorldId);
      if (worldItem) {
        setStoryWorld(worldItem);
      }
    };
    
    loadResults();
  }, [navigate]);

  const handleTabChange = (tab: 'characters' | 'locations' | 'events') => {
    setActiveTab(tab);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (!results || !story || !storyWorld) {
    return (
      <div className="analysis-results-container">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="analysis-results-container">
      <header className="results-header">
        <h1>Analysis Results</h1>
        <div className="story-details">
          <div className="detail-item">
            <span className="label">Story World:</span>
            <span className="value">{storyWorld.name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Story:</span>
            <span className="value">{story.title}</span>
          </div>
        </div>
      </header>
      
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => handleTabChange('characters')}
          >
            Characters ({results.characters.length})
          </button>
          <button 
            className={`tab ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => handleTabChange('locations')}
          >
            Locations ({results.locations.length})
          </button>
          <button 
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            Events ({results.events.length})
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'characters' && (
            <div className="characters-list">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {results.characters.map(character => (
                    <tr key={character.id}>
                      <td>{character.name}</td>
                      <td>{character.description || 'No description available'}</td>
                      <td>{character.role || 'Unspecified'}</td>
                    </tr>
                  ))}
                  {results.characters.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={3}>No characters detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'locations' && (
            <div className="locations-list">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {results.locations.map(location => (
                    <tr key={location.id}>
                      <td>{location.name}</td>
                      <td>{location.description || 'No description available'}</td>
                      <td>{location.location_type || 'Unspecified'}</td>
                    </tr>
                  ))}
                  {results.locations.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={3}>No locations detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'events' && (
            <div className="events-list">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Sequence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.events.map(event => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{event.description || 'No description available'}</td>
                      <td>{event.sequence_number || 'Unknown'}</td>
                    </tr>
                  ))}
                  {results.events.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={3}>No events detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="actions">
        <button className="secondary-button" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default StoryAnalysisResults;
