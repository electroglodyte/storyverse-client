import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './JSONImport.css';

// Define interfaces for story worlds and stories
interface StoryWorld {
  id: string;
  name: string;
}

interface Story {
  id: string;
  title: string;
  story_world_id: string | null;
}

const JSONImport: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // States for drop-down menus
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [selectedStoryWorldId, setSelectedStoryWorldId] = useState<string>('');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch story worlds and stories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch story worlds
        const { data: worldsData, error: worldsError } = await supabase
          .from('story_worlds')
          .select('id, name')
          .order('name');
        
        if (worldsError) throw worldsError;
        
        // Fetch stories
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('id, title, story_world_id')
          .order('title');
        
        if (storiesError) throw storiesError;
        
        setStoryWorlds(worldsData || []);
        setStories(storiesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Error loading story worlds and stories: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter stories when story world selection changes
  useEffect(() => {
    if (selectedStoryWorldId) {
      const filtered = stories.filter(story => story.story_world_id === selectedStoryWorldId);
      setFilteredStories(filtered);
      
      // Clear story selection if the current selection is not in the filtered list
      if (selectedStoryId && !filtered.some(story => story.id === selectedStoryId)) {
        setSelectedStoryId('');
      }
    } else {
      // Show all stories if no story world is selected
      setFilteredStories(stories);
    }
  }, [selectedStoryWorldId, stories, selectedStoryId]);

  // Helper function to add a log message
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Handle story world selection
  const handleStoryWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoryWorldId(e.target.value);
  };

  // Handle story selection
  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoryId(e.target.value);
  };

  // Process the JSON input
  const handleProcessJSON = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setLogs([]);

    try {
      // Parse the JSON input
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
        addLog('Successfully parsed JSON input');
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${(parseError as Error).message}`);
      }

      // Add selected story world and story IDs to the data
      if (selectedStoryWorldId) {
        parsedData.storyWorldId = selectedStoryWorldId;
        addLog(`Using Story World ID: ${selectedStoryWorldId}`);
      }

      if (selectedStoryId) {
        parsedData.storyId = selectedStoryId;
        addLog(`Using Story ID: ${selectedStoryId}`);
      }

      // Process the data using import_analyzed_story tool
      addLog('Invoking import_analyzed_story tool...');
      const { data, error: importError } = await supabase.functions.invoke('import-analyzed-story', {
        body: { data: parsedData }
      });

      if (importError) {
        throw new Error(`Error importing data: ${importError.message}`);
      }

      // Log the results
      if (data) {
        if (data.success) {
          setSuccess('Story data imported successfully!');
          addLog(`Successfully imported story: ${data.story?.title || 'Unnamed'}`);
          
          // Log details of what was imported
          if (data.stats) {
            Object.entries(data.stats).forEach(([key, value]) => {
              addLog(`Imported ${value} ${key}`);
            });
          }
        } else {
          throw new Error(data.message || 'Unknown error occurred during import');
        }
      } else {
        throw new Error('No response data received from import function');
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="json-import-container">
      <h1>JSON Import</h1>
      <p className="description">
        Paste JSON data exported from Claude's story analysis to import characters, locations, events, and other story elements directly into the database.
      </p>

      {/* Selection dropdowns for Story World and Story */}
      <div className="dropdowns-container">
        <div className="dropdown-wrapper">
          <label htmlFor="storyWorldSelect">Story World:</label>
          <select
            id="storyWorldSelect"
            value={selectedStoryWorldId}
            onChange={handleStoryWorldChange}
            disabled={isLoading || isProcessing}
            className="dropdown-select"
          >
            <option value="">-- Select Story World (optional) --</option>
            {storyWorlds.map(world => (
              <option key={world.id} value={world.id}>{world.name}</option>
            ))}
          </select>
        </div>

        <div className="dropdown-wrapper">
          <label htmlFor="storySelect">Story:</label>
          <select
            id="storySelect"
            value={selectedStoryId}
            onChange={handleStoryChange}
            disabled={isLoading || isProcessing}
            className="dropdown-select"
          >
            <option value="">-- Select Story (optional) --</option>
            {filteredStories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="json-input-container">
        <textarea
          className="json-input"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON data here..."
          disabled={isProcessing}
        />
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={handleProcessJSON}
          disabled={isProcessing || !jsonInput.trim()}
        >
          {isProcessing ? 'Processing...' : 'Process JSON'}
        </button>
        <button
          className="secondary-button"
          onClick={() => setJsonInput('')}
          disabled={isProcessing || !jsonInput.trim()}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {logs.length > 0 && (
        <div className="logs-container">
          <h3>Import Log</h3>
          <div className="logs">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JSONImport;