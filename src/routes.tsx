import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import StoryWorldsTable from './pages/StoryWorldsTable';
import SeriesTable from './components/series/SeriesTable';
import StoryTable from './components/story/StoryTable';
import StoryWorldDetailPage from './pages/StoryWorldDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import StoryDetailPage from './pages/StoryDetailPage';
import StoryWorldsListPage from './pages/StoryWorldsListPage';
import SetupPage from './pages/SetupPage';
import DirectDatabaseSetupPage from './pages/DirectDatabaseSetupPage';

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
      // Setup routes
      {
        path: 'setup',
        element: <SetupPage />,
      },
      {
        path: 'database-setup',
        element: <DirectDatabaseSetupPage />,
      },
      // Story World routes
      {
        path: 'story-worlds',
        element: <StoryWorldsTable />,
      },
      {
        path: 'story-worlds/list',
        element: <StoryWorldsListPage />,
      },
      {
        path: 'story-worlds/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'story-worlds/edit/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'story-worlds/new',
        element: <StoryWorldDetailPage />,
      },
      // Series routes
      {
        path: 'series',
        element: <SeriesTable />,
      },
      {
        path: 'series/:id',
        element: <SeriesDetailPage />,
      },
      {
        path: 'series/edit/:id',
        element: <SeriesDetailPage />,
      },
      {
        path: 'series/new',
        element: <SeriesDetailPage />,
      },
      // Story routes
      {
        path: 'stories',
        element: <StoryTable />,
      },
      {
        path: 'stories/:id',
        element: <StoryDetailPage />,
      },
      {
        path: 'stories/edit/:id',
        element: <StoryDetailPage />,
      },
      {
        path: 'stories/new',
        element: <StoryDetailPage />,
      },
    ],
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;