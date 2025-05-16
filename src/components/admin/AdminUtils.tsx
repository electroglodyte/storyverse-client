import React, { useState } from 'react';
import { deleteNoneVerseCharacters } from '../../utils/clearNoneVerseData';

/**
 * A utility component that provides admin functions like clearing data
 */
const AdminUtils: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearCharacters = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await deleteNoneVerseCharacters();
      setResult(response);
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const cancelAction = () => {
    setShowConfirm(false);
  };

  return (
    <div className="admin-utils-container p-4 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Admin Utilities</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">NoneVerse Data Management</h3>
        <p className="text-sm text-gray-600 mb-3">
          Use these tools to clear default data from the NoneVerse storyworld.
        </p>
        
        {showConfirm ? (
          <div className="confirm-dialog bg-yellow-50 p-3 border border-yellow-300 rounded mb-3">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Are you sure you want to delete all characters from NoneVerse? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                onClick={handleClearCharacters}
                disabled={isLoading}
              >
                Yes, Delete All
              </button>
              <button 
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                onClick={cancelAction}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            onClick={handleClearCharacters}
            disabled={isLoading}
          >
            {isLoading ? 'Clearing Characters...' : 'Clear All NoneVerse Characters'}
          </button>
        )}
        
        {result && (
          <div className={`mt-3 p-3 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? (
                <span>✓ {result.message}</span>
              ) : (
                <span>✗ Error: {result.error}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUtils;