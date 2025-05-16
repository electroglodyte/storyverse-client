import React, { useState } from 'react';
import { entityImporters } from '../lib/entityImporter';

interface ImportEntityProps {
  entityType?: 'location' | 'faction' | 'object' | 'event' | 'item';
  storyId?: string;
  storyWorldId?: string;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export const ImportEntity: React.FC<ImportEntityProps> = ({
  entityType = 'location',
  storyId,
  storyWorldId,
  onComplete,
  onError
}) => {
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);

      // Parse JSON data
      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (e) {
        throw new Error('Invalid JSON format. Please check your input.');
      }

      // If no story_id is provided in the JSON but one is passed as prop, use that
      if (Array.isArray(data)) {
        data = data.map(item => ({
          ...item,
          story_id: item.story_id || storyId,
          story_world_id: item.story_world_id || storyWorldId
        }));
      } else {
        data = {
          ...data,
          story_id: data.story_id || storyId,
          story_world_id: data.story_world_id || storyWorldId
        };
      }

      // Get the appropriate importer
      const importer = entityImporters[entityType];
      if (!importer) {
        throw new Error(`Importer not found for entity type: ${entityType}`);
      }

      // Import the data
      const result = await importer({
        data,
        story_id: storyId,
        story_world_id: storyWorldId
      });

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      // Call onComplete callback with the imported data
      if (onComplete) {
        onComplete(result.data);
      }

      // Clear the input
      setJsonData('');
      setError(null);

    } catch (err) {
      const errorMessage = err.message || 'Failed to import data';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
      </h3>
      
      <textarea
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        placeholder={`Paste ${entityType} JSON data here...`}
        className="w-full h-48 p-2 border border-gray-300 rounded mb-4 font-mono text-sm"
        disabled={importing}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={importing || !jsonData.trim()}
          className={`px-4 py-2 rounded font-medium ${
            importing || !jsonData.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  );
};

export default ImportEntity;