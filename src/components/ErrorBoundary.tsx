import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Custom error component
const ErrorBoundary = ({ error }: { error: Error }) => {
  return (
    <div className="error-container p-4 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
      <p className="mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go back to homepage
      </button>
    </div>
  );
};

// Create a separate component that renders when a route doesn't match any defined route
const NotFound = () => {
  return (
    <div className="not-found-container p-4 text-center">
      <h2 className="text-xl font-bold text-amber-600 mb-2">Page Not Found</h2>
      <p className="mb-4">Sorry, we couldn't find the page you're looking for.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go back to homepage
      </button>
    </div>
  );
};

export { ErrorBoundary, NotFound };
