import React from 'react';
import createInitialData from '../utils/createInitialData';

const SetupPage = () => {
  const [result, setResult] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleCreateData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createInitialData();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">StoryVerse Setup</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Initial Data Setup</h2>
        <p className="mb-4">
          This page helps you set up the initial data for StoryVerse. 
          Click the button below to create the "Narnia" story world if it doesn't exist yet.
        </p>
        
        <button
          onClick={handleCreateData}
          disabled={isLoading}
          className="create-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Narnia Story World'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
            <p className="font-semibold">Success!</p>
            <p>Narnia story world has been created or already exists.</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Table Structure Information</h2>
        <p className="mb-4">
          The StoryVerse database has the following main tables:
        </p>
        
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>story_worlds</strong> - High-level containers for related content</li>
          <li><strong>series</strong> - Groups of related stories in a specific sequence</li>
          <li><strong>stories</strong> - Individual creative works</li>
          <li><strong>writing_samples</strong> - Text excerpts that can be analyzed for style</li>
          <li><strong>style_profiles</strong> - Captured writing styles from analyzed samples</li>
        </ul>
      </div>
    </div>
  );
};

export default SetupPage;