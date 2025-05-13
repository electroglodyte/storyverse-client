// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import BasicLayout from './components/BasicLayout';
import Dashboard from './pages/Dashboard';

// Original Project pages (now renamed to Story)
import ProjectsPage from './pages/ProjectsPage';
import StoryDetailPage from './pages/StoryDetailPage'; // Updated import

// New StoryWorld and Series pages
import StoryWorldsListPage from './pages/StoryWorldsListPage';
import NewStoryWorldPage from './pages/NewStoryWorldPage';
import StoryWorldDetailPage from './pages/StoryWorldDetailPage';
import NewSeriesPage from './pages/NewSeriesPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import NewStoryPage from './pages/NewStoryPage';

// Sample pages
import { SamplesPage } from './pages/SamplesPage';
import { SampleDetailPage } from './pages/SampleDetailPage';
import { NewSamplePage } from './pages/NewSamplePage';
import { EditSamplePage } from './pages/EditSamplePage';

// Import CSS files
import './App.css';
import './index.css';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<BasicLayout />}>
            <Route index element={<Navigate to="/storyworlds" replace />} />
            
            {/* StoryWorld Routes */}
            <Route path="storyworlds" element={<StoryWorldsListPage />} />
            <Route path="storyworlds/new" element={<NewStoryWorldPage />} />
            <Route path="storyworlds/:id" element={<StoryWorldDetailPage />} />
            
            {/* Series Routes */}
            <Route path="series/new" element={<NewSeriesPage />} />
            <Route path="series/:id" element={<SeriesDetailPage />} />
            
            {/* Story Routes (formerly Project) */}
            <Route path="projects" element={<Navigate to="/storyworlds" replace />} /> {/* Redirect for backward compatibility */}
            <Route path="projects/new" element={<Navigate to="/stories/new" replace />} /> {/* Redirect for backward compatibility */}
            <Route path="projects/:id" element={<Navigate to={`/stories/${id}`} replace />} /> {/* Fixed redirect */}
            
            <Route path="stories/new" element={<NewStoryPage />} />
            <Route path="stories/:id" element={<StoryDetailPage />} /> {/* Now using the new StoryDetailPage */}
            
            {/* Sample Routes */}
            <Route path="samples" element={<SamplesPage />} />
            <Route path="samples/new" element={<NewSamplePage />} />
            <Route path="samples/:id" element={<SampleDetailPage />} />
            <Route path="samples/:id/edit" element={<EditSamplePage />} />
            
            <Route path="*" element={<Navigate to="/storyworlds" replace />} />
          </Route>
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;