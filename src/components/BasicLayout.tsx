// src/components/BasicLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

// This is a simplified layout component using CSS classes from App.css
const BasicLayout: React.FC = () => {
  const { activeProject, projects, changeProject } = useProject();
  const projectName = activeProject?.name || 'The Irish Mystery';
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const location = useLocation();

  // Get the current page name from the location path
  const getPageName = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects') && path !== '/projects') return 'Project Details';
    if (path === '/projects') return 'Projects';
    if (path.startsWith('/samples')) return 'Writing Samples';
    if (path === '/search') return 'Search';
    if (path === '/style-analysis') return 'Style Analysis';
    if (path === '/plot-mapping') return 'Plot Mapping';
    if (path === '/consistency-check') return 'Consistency Check';
    if (path === '/claude-assistant') return 'Claude Assistant';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
  };

  const toggleProjectDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProjectDropdown(!showProjectDropdown);
  };

  const handleProjectSelect = (projectId: string) => {
    changeProject(projectId);
    setShowProjectDropdown(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '20px' }}>
          <h1 className="sidebar-brand">StoryVerse</h1>
          <p className="sidebar-subtitle">World Builder</p>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">ACTIVE PROJECT</h3>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={toggleProjectDropdown}
              className="sidebar-project-selector"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit', 
                width: '100%', 
                textAlign: 'left',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '8px 12px'
              }}
            >
              <span>{projectName}</span>
              <span>{showProjectDropdown ? '▲' : '▼'}</span>
            </button>
            
            {showProjectDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: '#2d2e33',
                borderRadius: '0 0 4px 4px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }}>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      backgroundColor: activeProject?.id === project.id ? '#1f2024' : 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2024' }}
                    onMouseOut={(e) => { 
                      if (activeProject?.id !== project.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {project.name}
                  </button>
                ))}
                <Link
                  to="/projects/new"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderTop: '1px solid #3a3b41',
                    color: '#fcd34d',
                    textDecoration: 'none'
                  }}
                  onClick={() => setShowProjectDropdown(false)}
                >
                  + Create New Project
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>MAIN</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/" className="sidebar-item">
                <span className="sidebar-item-icon">🏠</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/projects" className="sidebar-item">
                <span className="sidebar-item-icon">📚</span>
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link to="/samples" className="sidebar-item">
                <span className="sidebar-item-icon">📝</span>
                <span>Writing Samples</span>
              </Link>
            </li>
            <li>
              <Link to="/search" className="sidebar-item">
                <span className="sidebar-item-icon">🔍</span>
                <span>Search</span>
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>TOOLS</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/style-analysis" className="sidebar-item">
                <span className="sidebar-item-icon">📊</span>
                <span>Style Analysis</span>
              </Link>
            </li>
            <li>
              <Link to="/plot-mapping" className="sidebar-item">
                <span className="sidebar-item-icon">📈</span>
                <span>Plot Mapping</span>
              </Link>
            </li>
            <li>
              <Link to="/consistency-check" className="sidebar-item">
                <span className="sidebar-item-icon">⚡</span>
                <span>Consistency Check</span>
              </Link>
            </li>
            <li>
              <Link to="/claude-assistant" className="sidebar-item">
                <span className="sidebar-item-icon">💬</span>
                <span>Claude Assistant</span>
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <Link to="/settings" className="sidebar-item" style={{ padding: '8px 0' }}>
            <span className="sidebar-item-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Project Header */}
        <div className="project-header">
          <h2 className="project-title">{projectName}</h2>
          
          <div className="project-controls">
            <div style={{ position: 'relative' }}>
              <button 
                onClick={toggleProjectDropdown}
                className="project-selector" 
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '4px 10px'
                }}
              >
                {projectName} {showProjectDropdown ? '▲' : '▼'}
              </button>
              
              {showProjectDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '200px',
                  backgroundColor: '#2d2e33',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10
                }}>
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        backgroundColor: activeProject?.id === project.id ? '#1f2024' : 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2024' }}
                      onMouseOut={(e) => { 
                        if (activeProject?.id !== project.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {project.name}
                    </button>
                  ))}
                  <Link
                    to="/projects/new"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderTop: '1px solid #3a3b41',
                      color: '#fcd34d',
                      textDecoration: 'none'
                    }}
                    onClick={() => setShowProjectDropdown(false)}
                  >
                    + Create New Project
                  </Link>
                </div>
              )}
            </div>
            <Link 
              to={activeProject ? `/projects/${activeProject.id}` : "/projects"} 
              className="control-button" 
              title="View Project Details"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              🔄
            </Link>
          </div>
        </div>

        {/* Section Header */}
        <div className="section-header">
          <h1 className="section-title">{getPageName()}</h1>
        </div>

        {/* Content Area */}
        <div className="content-area">
          <div className="content-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicLayout;