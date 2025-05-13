import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import StoryWorldTable from './components/storyworld/StoryWorldTable';
import SeriesTable from './components/series/SeriesTable';
import StoryTable from './components/story/StoryTable';

// Layout component with Navigation and outlet for nested routes
const Layout = () => {
  return <App />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'story-worlds',
        element: <StoryWorldTable />,
      },
      {
        path: 'series',
        element: <SeriesTable />,
      },
      {
        path: 'stories',
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