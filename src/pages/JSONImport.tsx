import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './JSONImport.css';

const JSONImport: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Helper function to add a log message
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
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