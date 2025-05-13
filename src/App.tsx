// src/App.tsx
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
  // Force layout styles directly
  const appStyles = `
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #root {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
  `;
  
  return (
    <ProjectProvider>
      <style dangerouslySetInnerHTML={{ __html: appStyles }} />
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