// src/components/BasicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

// This is a simplified layout component using CSS classes from App.css
const BasicLayout: React.FC = () => {
  const { activeProject } = useProject();
  const projectName = activeProject?.name || 'The Irish Mystery';

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
          <div className="sidebar-project-selector">
            <span>{projectName}</span>
            <span>▼</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>MAIN</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="/" className="sidebar-item">
                <span className="sidebar-item-icon">🏠</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="/samples" className="sidebar-item">
                <span className="sidebar-item-icon">📝</span>
                <span>Writing Samples</span>
              </a>
            </li>
            <li>
              <a href="/search" className="sidebar-item">
                <span className="sidebar-item-icon">🔍</span>
                <span>Search</span>
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>TOOLS</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="/style-analysis" className="sidebar-item">
                <span className="sidebar-item-icon">📊</span>
                <span>Style Analysis</span>
              </a>
            </li>
            <li>
              <a href="/plot-mapping" className="sidebar-item">
                <span className="sidebar-item-icon">📈</span>
                <span>Plot Mapping</span>
              </a>
            </li>
            <li>
              <a href="/consistency-check" className="sidebar-item">
                <span className="sidebar-item-icon">⚡</span>
                <span>Consistency Check</span>
              </a>
            </li>
            <li>
              <a href="/claude-assistant" className="sidebar-item">
                <span className="sidebar-item-icon">💬</span>
                <span>Claude Assistant</span>
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <a href="/settings" className="sidebar-item" style={{ padding: '8px 0' }}>
            <span className="sidebar-item-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Project Header */}
        <div className="project-header">
          <h2 className="project-title">{projectName}</h2>
          
          <div className="project-controls">
            <button className="project-selector">
              {projectName} ▼
            </button>
            <button className="control-button">
              🔄
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="section-header">
          <h1 className="section-title">Dashboard</h1>
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