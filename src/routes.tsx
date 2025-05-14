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

// Characters, Locations, Factions Pages
import CharactersListPage from './pages/CharactersListPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import LocationsListPage from './pages/LocationsListPage';
import LocationDetailPage from './pages/SettingDetailPage';
import FactionsListPage from './pages/FactionsListPage';
import FactionDetailPage from './pages/FactionDetailPage';

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

// Scene Management Pages
import ScenesExplorerPage from './pages/scenes/ScenesExplorerPage';
import SceneEditorPage from './pages/scenes/SceneEditorPage';
import SceneVersionsPage from './pages/scenes/SceneVersionsPage';
import SceneCommentsPage from './pages/scenes/SceneCommentsPage';
import SceneVersionCompare from './pages/scenes/SceneVersionCompare';
import SceneImportPage from './pages/scenes/SceneImportPage';
import SceneExportPage from './pages/scenes/SceneExportPage';

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
      // Location routes (replacing Settings routes)
      {
        path: 'locations',
        element: <LocationsListPage />,
      },
      {
        path: 'locations/:id',
        element: <LocationDetailPage />,
      },
      {
        path: 'locations/edit/:id',
        element: <LocationDetailPage />,
      },
      {
        path: 'locations/new',
        element: <LocationDetailPage />,
      },
      // Maintain backward compatibility with old settings routes
      {
        path: 'settings',
        element: <LocationsListPage />,
      },
      {
        path: 'settings/:id',
        element: <LocationDetailPage />,
      },
      {
        path: 'settings/edit/:id',
        element: <LocationDetailPage />,
      },
      {
        path: 'settings/new',
        element: <LocationDetailPage />,
      },
      // Faction routes
      {
        path: 'factions',
        element: <FactionsListPage />,
      },
      {
        path: 'factions/:id',
        element: <FactionDetailPage />,
      },
      {
        path: 'factions/edit/:id',
        element: <FactionDetailPage />,
      },
      {
        path: 'factions/new',
        element: <FactionDetailPage />,
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
      // Scene Management Routes
      {
        path: 'scenes',
        element: <ScenesExplorerPage />,
      },
      {
        path: 'scenes/new',
        element: <SceneEditorPage />,
      },
      {
        path: 'scenes/:id',
        element: <SceneEditorPage />,
      },
      {
        path: 'scenes/edit/:id',
        element: <SceneEditorPage />,
      },
      {
        path: 'scenes/:id/versions',
        element: <SceneVersionsPage />,
      },
      {
        path: 'scenes/:id/comments',
        element: <SceneCommentsPage />,
      },
      {
        path: 'scenes/:id/compare/:version1Id/:version2Id',
        element: <SceneVersionCompare />,
      },
      {
        path: 'scenes/import',
        element: <SceneImportPage />,
      },
      {
        path: 'scenes/export',
        element: <SceneExportPage />,
      },
    ],
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;