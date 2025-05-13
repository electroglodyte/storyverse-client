import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import createInitialData from '../utils/createInitialData';
import { supabase } from '../supabaseClient';
import { FaDatabase, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const SetupPage = () => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    tablesExist: false,
    storyWorldsExist: false,
    storiesExist: false,
    checking: true
  });

  // Check database status on page load
  useEffect(() => {
    const checkDatabase = async () => {
      const status = {
        connected: false,
        tablesExist: false,
        storyWorldsExist: false, 
        storiesExist: false,
        checking: true
      };

      try {
        // Check if we can connect to Supabase
        const { data: healthData, error: healthError } = await supabase.rpc('ping');
        status.connected = !healthError && healthData;

        // Check if story_worlds table exists by trying to get any rows
        const { data: worldsData, error: worldsError } = await supabase
          .from('story_worlds')
          .select('id')
          .limit(1);
        
        status.tablesExist = !worldsError;
        status.storyWorldsExist = !worldsError && worldsData && worldsData.length > 0;

        // Check if stories table exists
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('id')
          .limit(1);
        
        status.storiesExist = !storiesError && storiesData && storiesData.length > 0;
      } catch (error) {
        console.error('Error checking database status:', error);
      }

      status.checking = false;
      setDbStatus(status);
    };

    checkDatabase();
  }, [result]); // Re-run if result changes (database updated)

  const handleCreateData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createInitialData();
      console.log('Create initial data result:', data);
      setResult(data);
    } catch (err) {
      console.error('Error in handleCreateData:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusItem = (title, isOk, message) => (
    <div className="flex items-center space-x-2 mb-2">
      {isOk ? (
        <FaCheck className="text-green-500" />
      ) : (
        <FaExclamationTriangle className="text-amber-500" />
      )}
      <span className="font-medium">{title}:</span>
      <span>{message}</span>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">StoryVerse Setup</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaDatabase className="mr-2" />
          Database Status
        </h2>

        {dbStatus.checking ? (
          <div className="flex items-center space-x-3 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent"></div>
            <span>Checking database status...</span>
          </div>
        ) : (
          <div className="mb-6">
            {renderStatusItem('Connection to Supabase', dbStatus.connected, 
              dbStatus.connected ? 'Connected' : 'Failed to connect')}
            
            {renderStatusItem('Tables Exist', dbStatus.tablesExist, 
              dbStatus.tablesExist ? 'Tables found' : 'Missing required tables')}
            
            {renderStatusItem('Story Worlds', dbStatus.storyWorldsExist, 
              dbStatus.storyWorldsExist ? 'Found' : 'No story worlds found')}
            
            {renderStatusItem('Stories', dbStatus.storiesExist, 
              dbStatus.storiesExist ? 'Found' : 'No stories found')}
          </div>
        )}
        
        <div className="mb-6">
          <p className="mb-4">
            This page helps you set up the initial data for StoryVerse. 
            Click the button below to create the "Narnia" story world and a sample story.
          </p>
          
          <button
            onClick={handleCreateData}
            disabled={isLoading || (dbStatus.storyWorldsExist && dbStatus.storiesExist)}
            className="create-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting Up Database...' : 'Create Initial Sample Data'}
          </button>
          
          {(dbStatus.storyWorldsExist && dbStatus.storiesExist) && (
            <p className="mt-2 text-green-600">
              Data already exists! You can browse the app using the navigation.
            </p>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(result?.error || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {result && result.success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
            <p className="font-semibold">Success!</p>
            <p>{result.message}</p>
            <div className="mt-2 text-gray-600">
              <p>You can now:</p>
              <ul className="list-disc pl-6 mt-1">
                <li><Link to="/story-worlds" className="text-blue-600 hover:underline">View Story Worlds</Link></li>
                <li><Link to="/stories" className="text-blue-600 hover:underline">Browse Stories</Link></li>
                <li><Link to="/" className="text-blue-600 hover:underline">Go to Dashboard</Link></li>
              </ul>
            </div>
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