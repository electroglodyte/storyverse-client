import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ImportAndAnalyzeStory from './pages/ImportAndAnalyzeStory';
import StoryAnalysisProgress from './pages/StoryAnalysisProgress';
import StoryAnalysisResults from './pages/StoryAnalysisResults';

// Import any other necessary components/pages

const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Home Page</div>, // Replace with your actual home page component
  },
  {
    path: '/import',
    element: <ImportAndAnalyzeStory />,
  },
  {
    path: '/analyze-progress',
    element: <StoryAnalysisProgress />,
  },
  {
    path: '/analysis-results',
    element: <StoryAnalysisResults />,
  },
  // Add other routes as needed
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
