import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaDatabase, FaCode, FaExclamationTriangle } from 'react-icons/fa';

const DirectDatabaseSetupPage = () => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // SQL to create the database setup function
  const createDbSetupFunctionSQL = `
  -- Create a function to execute arbitrary SQL (admin use only)
  CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS text AS $$
  BEGIN
    EXECUTE sql;
    RETURN 'SQL executed successfully';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Create a function to enable the UUID extension
  CREATE OR REPLACE FUNCTION create_uuid_extension() RETURNS text AS $$
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RETURN 'UUID extension enabled successfully';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Create a function to execute a single SQL statement
  CREATE OR REPLACE FUNCTION execute_sql(sql_statement text) RETURNS text AS $$
  BEGIN
    EXECUTE sql_statement;
    RETURN 'SQL statement executed successfully';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // Function to create the setup functions in Supabase
  const createSetupFunctions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to create the setup functions using a direct SQL query
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: createDbSetupFunctionSQL 
      });
      
      if (error) {
        // The function doesn't exist yet, so we need to create it via the SQL editor
        console.error('Error creating setup functions:', error);
        setError(`Could not create the setup functions automatically. You need to create them manually in the Supabase SQL editor.

The error was: ${error.message}

Please copy the SQL below and execute it in the Supabase SQL editor:`);
        setResult({
          success: false,
          sqlToExecute: createDbSetupFunctionSQL
        });
      } else {
        setResult({
          success: true,
          message: 'Setup functions created successfully!'
        });
      }
    } catch (err) {
      console.error('Error in createSetupFunctions:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">StoryVerse Direct Database Setup</h1>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-amber-700">
        <div className="flex items-start">
          <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
          <div>
            <p className="font-bold">Admin Access Required</p>
            <p>This page is for database administrators only. You need full access to your Supabase project to run these operations.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaDatabase className="mr-2" />
          Create Database Setup Functions
        </h2>
        
        <p className="mb-4">
          This will create special SQL functions in your Supabase project that will allow the application to set up tables
          and initialize data. 
        </p>
        
        <button
          onClick={createSetupFunctions}
          disabled={isLoading}
          className="create-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Functions...' : 'Create Setup Functions'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{error}</p>
            
            {result && !result.success && (
              <div className="mt-4">
                <p className="font-semibold mb-2 flex items-center">
                  <FaCode className="mr-1" /> SQL to Execute Manually:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-80 whitespace-pre-wrap">
                  {result.sqlToExecute}
                </pre>
                <p className="mt-2 text-sm">
                  Copy this SQL and execute it in the Supabase SQL Editor. Then come back and try the setup process again.
                </p>
              </div>
            )}
          </div>
        )}
        
        {result && result.success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
            <p className="font-semibold">Success!</p>
            <p>{result.message}</p>
            <p className="mt-2">
              You can now proceed to the <a href="/setup" className="text-blue-600 hover:underline">Setup Page</a> to initialize your database.
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Setup Instructions</h2>
        <p className="mb-4">
          If the automatic setup fails, follow these steps:
        </p>
        
        <ol className="list-decimal pl-6 space-y-2">
          <li>Log in to your Supabase project</li>
          <li>Go to the SQL Editor</li>
          <li>Create a new query</li>
          <li>Copy and paste the SQL code shown in the error message above</li>
          <li>Execute the query</li>
          <li>Return to this page and try the setup process again</li>
        </ol>
      </div>
    </div>
  );
};

export default DirectDatabaseSetupPage;