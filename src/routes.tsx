import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import StoryWorldTable from './components/storyworld/StoryWorldTable';
import SeriesTable from './components/series/SeriesTable';
import StoryTable from './components/story/StoryTable';
// Import other components as needed

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/story-worlds',
        element: <StoryWorldTable />,
      },
      {
        path: '/series',
        element: <SeriesTable />,
      },
      {
        path: '/stories',
        element: <StoryTable />,
      },
      // Add other routes as needed
    ],
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;