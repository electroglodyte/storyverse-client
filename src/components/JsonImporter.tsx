import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

interface JsonImporterProps {
  // Optional props can be added here if needed
}

// Safe helper for accessing Supabase query results
async function safeSupabaseQuery<T = any>(
  query: any // Accept any thenable object (like Supabase query builders)
): Promise<{ data: T[]; error: string | null }> {
  try {
    // Await the query to get the result
    const response = await query;
    
    // Handle error case
    if (response.error) {
      return {
        data: [],
        error: getErrorMessage(response.error)
      };
    }
    
    // Safely handle data and add type assertion for TypeScript
    const safeData = Array.isArray(response.data) ? response.data as T[] : [];
    return {
      data: safeData,
      error: null
    };
  } catch (err) {
    return {
      data: [],
      error: getErrorMessage(err)
    };
  }
}

// Helper to safely handle any type of error object
function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (typeof error.message === 'string') return error.message;
  
  return 'An error occurred';
}

/**
 * Helper function to safely get an ID from any object or generate a new one
 * This avoids TypeScript errors when trying to access potentially missing 'id' property
 */
function getSafeId(obj: any): string {
  // If object is null/undefined, return a new UUID
  if (!obj) return uuidv4();
  
  // If id exists and is a string, return it
  if (typeof obj.id === 'string' && obj.id.length > 0) {
    return obj.id;
  }
  
  // Otherwise generate a new UUID
  return uuidv4();
}

const JsonImporter: React.FC<JsonImporterProps> = () => {
  const [storyWorlds, setStoryWorlds] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryWorldId, setSelectedStoryWorldId] = useState<string>('');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);

  // Load story worlds and stories on component mount
  useEffect(() => {
    const loadStoryWorldsAndStories = async () => {
      try {
        const worldsResult = await safeSupabaseQuery(
          supabase.from('story_worlds').select('*').order('name', { ascending: true })
        );

        if (worldsResult.error) {
          throw new Error(`Failed to load story worlds: ${worldsResult.error}`);
        }

        setStoryWorlds(worldsResult.data);

        // If there are story worlds, select the first one by default
        if (worldsResult.data.length > 0) {
          setSelectedStoryWorldId(worldsResult.data[0].id);
        }

        const storiesResult = await safeSupabaseQuery(
          supabase.from('stories').select('*').order('title', { ascending: true })
        );

        if (storiesResult.error) {
          throw new Error(`Failed to load stories: ${storiesResult.error}`);
        }

        setStories(storiesResult.data);

      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    loadStoryWorldsAndStories();
  }, []);

  // Load stories when story world selection changes
  useEffect(() => {
    if (selectedStoryWorldId) {
      const loadStories = async () => {
        try {
          const result = await safeSupabaseQuery(
            supabase
              .from('stories')
              .select('*')
              .eq('story_world_id', selectedStoryWorldId)
              .order('title', { ascending: true })
          );

          if (result.error) {
            throw new Error(`Failed to load stories: ${result.error}`);
          }

          setStories(result.data);

          // If there are stories for this world, select the first one by default
          if (result.data.length > 0) {
            setSelectedStoryId(result.data[0].id);
          } else {
            setSelectedStoryId('');
          }
        } catch (err) {
          setError(getErrorMessage(err));
        }
      };

      loadStories();
    }
  }, [selectedStoryWorldId]);

  const handleStoryWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoryWorldId(e.target.value);
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoryId(e.target.value);
  };

  const addLogEntry = (entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries(prev => [...prev, `${timestamp} - ${entry}`]);
  };

  const clearLog = () => {
    setLogEntries([]);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const processJson = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    clearLog();

    try {
      // Initial validation
      if (!selectedStoryWorldId) {
        throw new Error('Please select a story world');
      }

      if (!selectedStoryId) {
        throw new Error('Please select a story');
      }

      if (!jsonInput.trim()) {
        throw new Error('Please enter JSON data to import');
      }

      // Parse the JSON input
      let jsonData;
      try {
        jsonData = JSON.parse(jsonInput);
        addLogEntry('Successfully parsed JSON input');
      } catch (parseError) {
        throw new Error(`JSON parse error: ${getErrorMessage(parseError)}`);
      }

      // Check if data is an array
      if (Array.isArray(jsonData)) {
        addLogEntry(`Detected data type: array with ${jsonData.length} items`);
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        // Handle single object case by wrapping it in an array
        addLogEntry('Detected data type: single object, converting to array');
        jsonData = [jsonData];
      } else {
        throw new Error('JSON data must be an object or array of objects');
      }

      // Detect the data type based on properties
      const dataType = detectDataType(jsonData);
      addLogEntry(`Detected entity type: ${dataType}`);

      // Make sure we have valid data
      if (!dataType) {
        throw new Error('Could not determine data type. Please check your JSON structure.');
      }

      // Process the data based on its type
      switch (dataType) {
        case 'characters':
          await processCharacters(jsonData);
          break;
        case 'locations':
          await processLocations(jsonData);
          break;
        case 'factions':
          await processFactions(jsonData);
          break;
        case 'items':
          await processItems(jsonData);
          break;
        case 'events':
          await processEvents(jsonData);
          break;
        case 'scenes':
          await processScenes(jsonData);
          break;
        case 'story_questions':
          await processStoryQuestions(jsonData);
          break;
        case 'character_relationships':
          await processCharacterRelationships(jsonData);
          break;
        default:
          throw new Error(`Import for data type "${dataType}" is not implemented yet`);
      }

      setSuccess(`Successfully imported ${dataType}!`);
    } catch (err) {
      setError(getErrorMessage(err));
      addLogEntry(`Error: ${getErrorMessage(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Detect the data type based on the properties of the first object in the array
  const detectDataType = (data: any[]): string | null => {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const firstItem = data[0];

    // Check for specific properties to determine the data type
    if (firstItem.name && (
        firstItem.role || 
        firstItem.personality || 
        firstItem.background || 
        firstItem.motivation)
    ) {
      return 'characters';
    }

    if (firstItem.name && firstItem.faction_type) {
      return 'factions';
    }

    if (firstItem.name && firstItem.location_type) {
      return 'locations';
    }

    if (firstItem.name && (
        firstItem.item_type || 
        firstItem.significance || 
        firstItem.properties)
    ) {
      return 'items';
    }

    if (firstItem.title && firstItem.sequence_number) {
      return 'events';
    }

    if (firstItem.title && (
        firstItem.content || 
        firstItem.description || 
        firstItem.essence || 
        firstItem.interest_factor)
    ) {
      return 'scenes';
    }

    if (firstItem.question && firstItem.status) {
      return 'story_questions';
    }

    if (firstItem.character1_id && firstItem.character2_id && firstItem.relationship_type) {
      return 'character_relationships';
    }

    // Default fallback
    return null;
  };

  // Process character data
  const processCharacters = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} characters for story: ${selectedStoryId}`);

    // Make sure all characters have the required story and story world IDs
    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId,
      story_world_id: selectedStoryWorldId
    }));

    addLogEntry(`Adding characters to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('characters').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert characters: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new characters`);
  };

  // Process location data
  const processLocations = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} locations for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId,
      story_world_id: selectedStoryWorldId
    }));

    addLogEntry(`Adding locations to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('locations').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert locations: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new locations`);
  };

  // Process faction data
  const processFactions = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} factions for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId,
      story_world_id: selectedStoryWorldId
    }));

    addLogEntry(`Adding factions to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('factions').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert factions: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new factions`);
  };

  // Process item data
  const processItems = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} items for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId,
      story_world_id: selectedStoryWorldId
    }));

    addLogEntry(`Adding items to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('items').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert items: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new items`);
  };

  // Process event data
  const processEvents = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} events for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId
    }));

    addLogEntry(`Adding events to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('events').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert events: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new events`);
  };

  // Process scene data
  const processScenes = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} scenes for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId
    }));

    addLogEntry(`Adding scenes to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('scenes').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert scenes: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new scenes`);
  };

  // Process story questions
  const processStoryQuestions = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} story questions for story: ${selectedStoryId}`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId
    }));

    addLogEntry(`Adding story questions to story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('story_questions').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert story questions: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new story questions`);
  };

  // Process character relationships
  const processCharacterRelationships = async (data: any[]) => {
    addLogEntry(`Processing ${data.length} character relationships`);

    const processedData = data.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      story_id: selectedStoryId
    }));

    addLogEntry(`Adding character relationships for story: ${selectedStoryId}`);
    const result = await safeSupabaseQuery(
      supabase.from('character_relationships').insert(processedData).select()
    );

    if (result.error) {
      throw new Error(`Failed to insert character relationships: ${result.error}`);
    }

    addLogEntry(`Successfully created ${result.data.length} new character relationships`);
  };

  const clearForm = () => {
    setJsonInput('');
    setError(null);
    setSuccess(null);
    clearLog();
  };

  return (
    <div className="json-importer">
      <h1>JSON Import</h1>
      <p>Paste JSON data exported from Claude's story analysis to import characters, locations, events, and other story elements directly into the database.</p>

      <div className="form-group">
        <label htmlFor="storyWorldSelect">Story World:</label>
        <select 
          id="storyWorldSelect" 
          value={selectedStoryWorldId} 
          onChange={handleStoryWorldChange}
          disabled={processing}
        >
          {storyWorlds.map(world => (
            <option key={world.id} value={world.id}>{world.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="storySelect">Story: <span className="required-indicator">(Required for Characters)</span></label>
        <select 
          id="storySelect" 
          value={selectedStoryId} 
          onChange={handleStoryChange}
          disabled={processing}
        >
          {stories.map(story => (
            <option key={story.id} value={story.id}>{story.title}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="jsonTextarea">JSON Data:</label>
        <textarea 
          id="jsonTextarea"
          value={jsonInput}
          onChange={handleJsonChange}
          disabled={processing}
          placeholder={`[
  {
    "name": "Character Name",
    "description": "Character description",
    "role": "protagonist",
    "story_id": "Vampire Wedding Crashers"
  },
  {
    "name": "Another Character",
    "description": "Another description",
    "role": "antagonist"
  }
]`}
          rows={12}
        />
      </div>

      <div className="action-buttons">
        <button 
          className="primary-button" 
          onClick={processJson} 
          disabled={processing || !jsonInput.trim() || !selectedStoryId}
        >
          {processing ? "Processing..." : "Process JSON"}
        </button>
        <button 
          className="secondary-button" 
          onClick={clearForm} 
          disabled={processing}
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

      <div className="import-log">
        <h3>Import Log</h3>
        <div className="log-entries">
          {logEntries.length === 0 ? (
            <p className="empty-log">No import activity yet</p>
          ) : (
            <ul>
              {logEntries.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonImporter;