import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService, Character, Location, Event, Story, StoryWorld } from '../services/SupabaseService';

import './StoryAnalysisResults.css';

interface AnalysisResults {
  characters: Character[];
  locations: Location[];
  events: Event[];
  scenes?: any[];
  plotlines?: any[];
  characterRelationships?: any[];
  eventDependencies?: any[];
  characterArcs?: any[];
  storyId: string;
  storyWorldId: string;
}

// Enhanced StoryAnalysisResults component displaying the rich narrative elements
// extracted by our improved analyze-story edge function
const StoryAnalysisResults: React.FC = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [storyWorld, setStoryWorld] = useState<StoryWorld | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'events' | 'scenes' | 'plotlines' | 'relationships' | 'dependencies' | 'arcs'>('characters');
  
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

  const handleTabChange = (tab: 'characters' | 'locations' | 'events' | 'scenes' | 'plotlines' | 'relationships' | 'dependencies' | 'arcs') => {
    setActiveTab(tab);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleViewStory = () => {
    if (story && story.id) {
      navigate(`/stories/${story.id}`);
    }
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
          {results.scenes && results.scenes.length > 0 && (
            <button 
              className={`tab ${activeTab === 'scenes' ? 'active' : ''}`}
              onClick={() => handleTabChange('scenes')}
            >
              Scenes ({results.scenes.length})
            </button>
          )}
          {results.plotlines && results.plotlines.length > 0 && (
            <button 
              className={`tab ${activeTab === 'plotlines' ? 'active' : ''}`}
              onClick={() => handleTabChange('plotlines')}
            >
              Plotlines ({results.plotlines.length})
            </button>
          )}
          {results.characterRelationships && results.characterRelationships.length > 0 && (
            <button 
              className={`tab ${activeTab === 'relationships' ? 'active' : ''}`}
              onClick={() => handleTabChange('relationships')}
            >
              Relationships ({results.characterRelationships.length})
            </button>
          )}
          {results.characterArcs && results.characterArcs.length > 0 && (
            <button 
              className={`tab ${activeTab === 'arcs' ? 'active' : ''}`}
              onClick={() => handleTabChange('arcs')}
            >
              Character Arcs ({results.characterArcs.length})
            </button>
          )}
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
                    {/* Additional columns for enhanced character data */}
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.characters.map((character, index) => (
                    <tr key={character.id || index}>
                      <td>{character.name}</td>
                      <td>{character.description || 'No description available'}</td>
                      <td>{character.role || 'Unspecified'}</td>
                      <td>{(character as any).confidence ? `${Math.round((character as any).confidence * 100)}%` : '-'}</td>
                    </tr>
                  ))}
                  {results.characters.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No characters detected</td>
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
                    {/* Additional columns for enhanced location data */}
                    <th>Appearances</th>
                  </tr>
                </thead>
                <tbody>
                  {results.locations.map((location, index) => (
                    <tr key={location.id || index}>
                      <td>{location.name}</td>
                      <td>{location.description || 'No description available'}</td>
                      <td>{location.location_type || 'Unspecified'}</td>
                      <td>{(location as any).appearances || '-'}</td>
                    </tr>
                  ))}
                  {results.locations.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No locations detected</td>
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
                    {/* Additional column for characters involved */}
                    <th>Characters</th>
                  </tr>
                </thead>
                <tbody>
                  {results.events.map((event, index) => (
                    <tr key={event.id || index}>
                      <td>{event.title}</td>
                      <td>{event.description || 'No description available'}</td>
                      <td>{event.sequence_number || 'Unknown'}</td>
                      <td>{(event as any).characters ? (event as any).characters.map((c: any) => c.name).join(', ') : '-'}</td>
                    </tr>
                  ))}
                  {results.events.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No events detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* New tab for scenes */}
          {activeTab === 'scenes' && results.scenes && (
            <div className="scenes-list">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Sequence</th>
                    <th>Content Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {results.scenes.map((scene, index) => (
                    <tr key={scene.id || index}>
                      <td>{scene.title}</td>
                      <td>{scene.type || 'scene'}</td>
                      <td>{scene.sequence_number}</td>
                      <td>{scene.content && scene.content.length > 100 ? scene.content.substring(0, 100) + '...' : scene.content || 'No content'}</td>
                    </tr>
                  ))}
                  {!results.scenes || results.scenes.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No scenes detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* New tab for plotlines */}
          {activeTab === 'plotlines' && results.plotlines && (
            <div className="plotlines-list">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {results.plotlines.map((plotline, index) => (
                    <tr key={plotline.id || index}>
                      <td>{plotline.title}</td>
                      <td>{plotline.description || 'No description available'}</td>
                      <td>{plotline.plotline_type || 'main'}</td>
                    </tr>
                  ))}
                  {!results.plotlines || results.plotlines.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={3}>No plotlines detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* New tab for character relationships */}
          {activeTab === 'relationships' && results.characterRelationships && (
            <div className="relationships-list">
              <table>
                <thead>
                  <tr>
                    <th>Characters</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Intensity</th>
                  </tr>
                </thead>
                <tbody>
                  {results.characterRelationships.map((rel, index) => (
                    <tr key={rel.id || index}>
                      <td>{rel.character1_name} & {rel.character2_name}</td>
                      <td>{rel.relationship_type || 'unspecified'}</td>
                      <td>{rel.description || 'No description available'}</td>
                      <td>{rel.intensity || '-'}/10</td>
                    </tr>
                  ))}
                  {!results.characterRelationships || results.characterRelationships.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No character relationships detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* New tab for event dependencies */}
          {activeTab === 'dependencies' && results.eventDependencies && (
            <div className="dependencies-list">
              <table>
                <thead>
                  <tr>
                    <th>From Event</th>
                    <th>To Event</th>
                    <th>Dependency Type</th>
                    <th>Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {results.eventDependencies.map((dep, index) => (
                    <tr key={dep.id || index}>
                      <td>Event {dep.predecessor_sequence}</td>
                      <td>Event {dep.successor_sequence}</td>
                      <td>{dep.dependency_type || 'chronological'}</td>
                      <td>{dep.strength || '-'}/10</td>
                    </tr>
                  ))}
                  {!results.eventDependencies || results.eventDependencies.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No event dependencies detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* New tab for character arcs */}
          {activeTab === 'arcs' && results.characterArcs && (
            <div className="arcs-list">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Character</th>
                    <th>Description</th>
                    <th>Development</th>
                  </tr>
                </thead>
                <tbody>
                  {results.characterArcs.map((arc, index) => (
                    <tr key={arc.id || index}>
                      <td>{arc.title}</td>
                      <td>{arc.character_name}</td>
                      <td>{arc.description || 'No description available'}</td>
                      <td>{arc.starting_state && arc.ending_state 
                        ? `${arc.starting_state.substring(0, 30)}... → ${arc.ending_state.substring(0, 30)}...` 
                        : 'Not specified'}</td>
                    </tr>
                  ))}
                  {!results.characterArcs || results.characterArcs.length === 0 && (
                    <tr className="empty-state">
                      <td colSpan={4}>No character arcs detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="actions">
        <button className="primary-button" onClick={handleViewStory}>
          View Story Detail
        </button>
        <button className="secondary-button" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default StoryAnalysisResults;