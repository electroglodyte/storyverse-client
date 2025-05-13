// src/components/BasicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

// This is a simplified layout component using basic HTML and directly applied styles
const BasicLayout: React.FC = () => {
  const { activeProject } = useProject();
  const projectName = activeProject?.name || 'The Irish Mystery';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row', // Keep the main layout as a row for sidebar + content
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#f8f5f0' // Beige background
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        height: '100vh',
        backgroundColor: '#1f2024',
        color: 'white',
        overflow: 'auto',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 10
      }}>
        <div style={{ padding: '20px' }}>
          <h1 style={{ color: '#fef3c7', marginBottom: '5px' }}>StoryVerse</h1>
          <p style={{ color: '#fde68a', marginBottom: '20px', fontSize: '14px' }}>World Builder</p>
        </div>

        <div style={{ marginBottom: '20px', padding: '0 20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            ACTIVE PROJECT
          </h3>
          <div style={{
            backgroundColor: '#2d2e33',
            padding: '8px 12px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>{projectName}</span>
            <span>▼</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px',
            fontWeight: 'bold',
            padding: '0 20px'
          }}>
            MAIN
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="/" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>🏠</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="/samples" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>📝</span>
                <span>Writing Samples</span>
              </a>
            </li>
            <li>
              <a href="/search" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>🔍</span>
                <span>Search</span>
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px',
            fontWeight: 'bold',
            padding: '0 20px'
          }}>
            TOOLS
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <a href="/style-analysis" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>📊</span>
                <span>Style Analysis</span>
              </a>
            </li>
            <li>
              <a href="/plot-mapping" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>📈</span>
                <span>Plot Mapping</span>
              </a>
            </li>
            <li>
              <a href="/consistency-check" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>⚡</span>
                <span>Consistency Check</span>
              </a>
            </li>
            <li>
              <a href="/claude-assistant" style={{ 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <span style={{ marginRight: '8px' }}>💬</span>
                <span>Claude Assistant</span>
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <a href="/settings" style={{ 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center',
            padding: '8px 0',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s'
          }}>
            <span style={{ marginRight: '8px' }}>⚙️</span>
            <span>Settings</span>
          </a>
        </div>
      </div>

      {/* Main Content Area with padding for sidebar */}
      <div style={{
        marginLeft: '260px', // Match sidebar width
        flex: 1,
        display: 'flex',
        flexDirection: 'column', // Stack content vertically
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Project Header */}
        <div style={{
          backgroundColor: '#181818',
          color: 'white',
          padding: '15px 24px',
          borderBottom: '1px solid #3a3b41'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold' 
          }}>
            {projectName}
          </h2>
          
          <div style={{
            marginTop: '8px',
            display: 'flex',
            gap: '8px'
          }}>
            <button style={{
              backgroundColor: '#2d2e33',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {projectName} ▼
            </button>
            <button style={{
              backgroundColor: '#2d2e33',
              color: 'white',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              🔄
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <div style={{
          backgroundColor: '#392f2d', 
          color: '#f0e6d2',
          padding: '16px 24px',
          borderBottom: '1px solid #4c4032'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h1>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicLayout;