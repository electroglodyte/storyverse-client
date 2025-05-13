import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NewProjectPage from './pages/NewProjectPage';
import { SamplesPage } from './pages/SamplesPage';
import { SampleDetailPage } from './pages/SampleDetailPage';
import { NewSamplePage } from './pages/NewSamplePage';
import { EditSamplePage } from './pages/EditSamplePage';

// Import CSS files
import './App.css';
import './index.css';

function App() {
  // Add a class to the body to ensure Tailwind is working
  document.body.classList.add('bg-primary-50', 'text-primary-700', 'fallback-bg-light', 'fallback-text-dark');
  
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/new" element={<NewProjectPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="samples" element={<SamplesPage />} />
            <Route path="samples/new" element={<NewSamplePage />} />
            <Route path="samples/:id" element={<SampleDetailPage />} />
            <Route path="samples/:id/edit" element={<EditSamplePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;