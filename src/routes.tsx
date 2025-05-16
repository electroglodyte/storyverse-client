import { createBrowserRouter } from 'react-router-dom'
import { Dashboard } from '@/components/Dashboard'
import { Layout } from '@/components/Layout'
import { StoryTable } from '@/components/story/StoryTable'
import { CharacterDetailPage } from '@/pages/CharacterDetailPage'
import { CharactersListPage } from '@/pages/CharactersListPage'
// Import other pages...

const router = createBrowserRouter([
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
        path: '/characters',
        element: <CharactersListPage />,
      },
      {
        path: '/characters/:id',
        element: <CharacterDetailPage />,
      },
      // Add other routes...
    ],
  },
])

export default router