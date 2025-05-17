import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { importStoryData, detectEntityType } from '../lib/entityImporter';
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
  const navigate = useNavigate();
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
  const [jsonDataType, setJsonDataType] = useState<string>('unknown');

  // Constants for special dropdown options
  const CREATE_NEW_WORLD_ID = "create_new_world";
  const CREATE_NEW_STORY_ID = "create_new_story";

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

  // Try to detect JSON format when input changes
  useEffect(() => {
    if (jsonInput.trim()) {
      try {
        const parsed = JSON.parse(jsonInput);
        const detectedType = detectEntityType(parsed);
        
        if (detectedType !== 'unknown') {
          setJsonDataType(detectedType);
        } else if (Array.isArray(parsed)) {
          setJsonDataType('array');
        } else if (typeof parsed === 'object') {
          // Check if it's a complete story data structure
          if (parsed.characters || parsed.locations || parsed.events) {
            setJsonDataType('story_data');
          } else {
            setJsonDataType('object');
          }
        } else {
          setJsonDataType('unknown');
        }
      } catch (e) {
        setJsonDataType('invalid');
      }
    } else {
      setJsonDataType('unknown');
    }
  }, [jsonInput]);
  
  // Filter stories when story world selection changes
  useEffect(() => {
    if (selectedStoryWorldId && selectedStoryWorldId !== CREATE_NEW_WORLD_ID) {
      const filtered = stories.filter(story => story.story_world_id === selectedStoryWorldId);
      setFilteredStories(filtered);
      
      // Clear story selection if the current selection is not in the filtered list
      if (selectedStoryId && !filtered.some(story => story.id === selectedStoryId) && selectedStoryId !== CREATE_NEW_STORY_ID) {
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
    const value = e.target.value;
    
    if (value === CREATE_NEW_WORLD_ID) {
      // Navigate to story world creation page
      navigate('/story-worlds/new');
      return;
    }
    
    setSelectedStoryWorldId(value);
  };

  // Handle story selection
  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === CREATE_NEW_STORY_ID) {
      // Navigate to story creation page, pass the selected story world ID if available
      const path = selectedStoryWorldId && selectedStoryWorldId !== CREATE_NEW_WORLD_ID
        ? `/stories/new?world=${selectedStoryWorldId}`
        : '/stories/new';
      navigate(path);
      return;
    }
    
    setSelectedStoryId(value);
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
        addLog(`Detected data type: ${jsonDataType}`);
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${(parseError as Error).message}`);
      }

      // If it's a direct characters array, we need to ensure it has a story ID
      if (Array.isArray(parsedData) && jsonDataType === 'character') {
        if (!selectedStoryId) {
          throw new Error('Please select a story to associate these characters with');
        }
        
        addLog(`Adding Story ID ${selectedStoryId} to all characters`);
        parsedData = parsedData.map(item => ({
          ...item,
          story_id: selectedStoryId
        }));
      }

      // For complete story data or other types, add context data
      const dataToSend = Array.isArray(parsedData) ? parsedData : {
        ...parsedData,
        existingStoryWorldId: selectedStoryWorldId && selectedStoryWorldId !== CREATE_NEW_WORLD_ID ? selectedStoryWorldId : undefined,
        existingStoryId: selectedStoryId && selectedStoryId !== CREATE_NEW_STORY_ID ? selectedStoryId : undefined
      };

      // If selected story world or story, log it
      if (selectedStoryWorldId && selectedStoryWorldId !== CREATE_NEW_WORLD_ID) {
        const worldName = storyWorlds.find(w => w.id === selectedStoryWorldId)?.name || 'Unknown';
        addLog(`Using Story World: ${worldName} (ID: ${selectedStoryWorldId})`);
      }

      if (selectedStoryId && selectedStoryId !== CREATE_NEW_STORY_ID) {
        const storyTitle = stories.find(s => s.id === selectedStoryId)?.title || 'Unknown';
        addLog(`Using Story: ${storyTitle} (ID: ${selectedStoryId})`);
      }

      // Process the data using our new importStoryData function
      addLog('Sending data to Edge Function...');
      const result = await importStoryData(dataToSend);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred during import');
      }

      // Log the results
      setSuccess('Story data imported successfully!');
      
      // Log details of what was imported
      if (result.stats) {
        Object.entries(result.stats).forEach(([key, value]) => {
          if (key !== 'story_id' && value > 0) {
            addLog(`Imported ${value} ${key}`);
          }
        });
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine if story selection is required
  const isStoryRequired = jsonDataType === 'character';

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
          <div className="custom-select-wrapper">
            <select
              id="storyWorldSelect"
              value={selectedStoryWorldId}
              onChange={handleStoryWorldChange}
              disabled={isLoading || isProcessing}
              className="custom-select"
            >
              <option value="">-- Select Story World --</option>
              {storyWorlds.map(world => (
                <option key={world.id} value={world.id}>{world.name}</option>
              ))}
              <option value={CREATE_NEW_WORLD_ID} className="create-new-option">+ Create New Story World</option>
            </select>
            <div className="select-arrow"></div>
          </div>
        </div>

        <div className="dropdown-wrapper">
          <label htmlFor="storySelect">
            Story: {isStoryRequired && <span className="required-field">(Required for Characters)</span>}
          </label>
          <div className="custom-select-wrapper">
            <select
              id="storySelect"
              value={selectedStoryId}
              onChange={handleStoryChange}
              disabled={isLoading || isProcessing}
              className={`custom-select ${isStoryRequired ? 'required' : ''}`}
            >
              <option value="">-- Select Story --</option>
              {filteredStories.map(story => (
                <option key={story.id} value={story.id}>{story.title}</option>
              ))}
              <option value={CREATE_NEW_STORY_ID} className="create-new-option">+ Create New Story</option>
            </select>
            <div className="select-arrow"></div>
          </div>
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

      {jsonDataType === 'character' && !selectedStoryId && (
        <div className="warning-message">
          You appear to be importing characters. Please select a story to associate them with.
        </div>
      )}

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={handleProcessJSON}
          disabled={isProcessing || !jsonInput.trim() || (isStoryRequired && !selectedStoryId)}
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