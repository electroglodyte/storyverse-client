import { createBrowserRouter } from 'react-router-dom'
import { Dashboard } from '@/components/Dashboard'
import Layout from '@/components/Layout'
import { StoryTable } from '@/components/story/StoryTable'
import CharacterDetailPage from '@/pages/CharacterDetailPage'
import CharactersListPage from '@/pages/CharactersListPage'
import WritingSamplesPage from '@/pages/writing/WritingSamplesPage'
import StyleProfilesPage from '@/pages/style/StyleProfilesPage'
import CreateSamplePage from '@/pages/writing/CreateSamplePage'
import SampleDetailPage from '@/pages/writing/SampleDetailPage'
import FactionDetailPage from '@/pages/FactionDetailPage'
import LocationDetailPage from '@/pages/LocationDetailPage'
import SeriesDetailPage from '@/pages/SeriesDetailPage'
import StoryDetailPage from '@/pages/StoryDetailPage'
import TimelinePage from '@/pages/timeline/TimelinePage'
import SceneImportPage from '@/pages/scenes/SceneImportPage'
import ScenesExplorerPage from '@/pages/scenes/ScenesExplorerPage'
import SceneEditorPage from '@/pages/scenes/SceneEditorPage'
import SceneVersionsPage from '@/pages/scenes/SceneVersionsPage'
import SceneVersionCompare from '@/pages/scenes/SceneVersionCompare'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/stories',
        element: <StoryTable />,
      },
      {
        path: '/stories/:id',
        element: <StoryDetailPage />,
      },
      {
        path: '/characters',
        element: <CharactersListPage />,
      },
      {
        path: '/characters/:id',
        element: <CharacterDetailPage />,
      },
      {
        path: '/factions/:id',
        element: <FactionDetailPage />,
      },
      {
        path: '/locations/:id',
        element: <LocationDetailPage />,
      },
      {
        path: '/series/:id',
        element: <SeriesDetailPage />,
      },
      {
        path: '/timeline',
        element: <TimelinePage />,
      },
      {
        path: '/scenes',
        element: <ScenesExplorerPage />,
      },
      {
        path: '/scenes/import',
        element: <SceneImportPage />,
      },
      {
        path: '/scenes/:id',
        element: <SceneEditorPage />,
      },
      {
        path: '/scenes/:id/versions',
        element: <SceneVersionsPage />,
      },
      {
        path: '/scenes/:id/versions/compare',
        element: <SceneVersionCompare />,
      },
      {
        path: '/writing',
        element: <WritingSamplesPage />,
      },
      {
        path: '/writing/create',
        element: <CreateSamplePage />,
      },
      {
        path: '/writing/:id',
        element: <SampleDetailPage />,
      },
      {
        path: '/style',
        element: <StyleProfilesPage />,
      },
    ],
  },
])