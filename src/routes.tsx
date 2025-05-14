import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import StoryWorldsTable from './pages/StoryWorldsTable';
import SeriesTable from './components/series/SeriesTable';
import StoryTable from './components/story/StoryTable';
import StoryWorldDetailPage from './pages/StoryWorldDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import SeriesEditPage from './pages/SeriesEditPage';
import StoryDetailPage from './pages/StoryDetailPage';
import StoryWorldsListPage from './pages/StoryWorldsListPage';
import SetupPage from './pages/SetupPage';
import DirectDatabaseSetupPage from './pages/DirectDatabaseSetupPage';

// Characters, Settings, Factions Pages
import CharactersListPage from './pages/CharactersListPage';
import CharacterDetailPage from './pages/CharacterDetailPage';

// Writing Samples & Style Profiles Pages
import WritingSamplesPage from './pages/writing/WritingSamplesPage';
import SampleDetailPage from './pages/writing/SampleDetailPage';
import CreateSamplePage from './pages/writing/CreateSamplePage';
import StyleProfilesPage from './pages/style/StyleProfilesPage';
import ProfileDetailPage from './pages/style/ProfileDetailPage';
import CreateProfilePage from './pages/style/CreateProfilePage';
import StyleWritingToolPage from './pages/writing/StyleWritingToolPage';

// Timeline Page
import TimelinePage from './pages/timeline/TimelinePage';

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
      // Story World routes - handle both 'storyworlds' and 'story-worlds' for backwards compatibility
      {
        path: 'story-worlds',
        element: <StoryWorldsTable />,
      },
      {
        path: 'storyworlds',
        element: <StoryWorldsTable />,
      },
      {
        path: 'story-worlds/list',
        element: <StoryWorldsListPage />,
      },
      {
        path: 'storyworlds/list',
        element: <StoryWorldsListPage />,
      },
      {
        path: 'story-worlds/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'storyworlds/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'story-worlds/edit/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'storyworlds/edit/:id',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'story-worlds/new',
        element: <StoryWorldDetailPage />,
      },
      {
        path: 'storyworlds/new',
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
        element: <SeriesEditPage />,
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
      // Character routes
      {
        path: 'characters',
        element: <CharactersListPage />,
      },
      {
        path: 'characters/:id',
        element: <CharacterDetailPage />,
      },
      {
        path: 'characters/edit/:id',
        element: <CharacterDetailPage />,
      },
      {
        path: 'characters/new',
        element: <CharacterDetailPage />,
      },
      // Writing Samples routes
      {
        path: 'samples',
        element: <WritingSamplesPage />,
      },
      {
        path: 'samples/:id',
        element: <SampleDetailPage />,
      },
      {
        path: 'samples/new',
        element: <CreateSamplePage />,
      },
      {
        path: 'samples/edit/:id',
        element: <CreateSamplePage />,
      },
      // Style Profiles routes
      {
        path: 'profiles',
        element: <StyleProfilesPage />,
      },
      {
        path: 'profiles/:id',
        element: <ProfileDetailPage />,
      },
      {
        path: 'profiles/new',
        element: <CreateProfilePage />,
      },
      {
        path: 'profiles/edit/:id',
        element: <CreateProfilePage />,
      },
      // Writing Tool
      {
        path: 'writing-tool',
        element: <StyleWritingToolPage />,
      },
      {
        path: 'writing-tool/:profileId',
        element: <StyleWritingToolPage />,
      },
      // Timeline routes
      {
        path: 'timeline',
        element: <TimelinePage />,
      },
      {
        path: 'timeline/:storyId',
        element: <TimelinePage />,
      },
    ],
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
