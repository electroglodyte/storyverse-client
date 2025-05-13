// src/components/BasicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

// This is a simplified layout component using basic HTML and directly applied styles
const BasicLayout: React.FC = () => {
  const { activeProject } = useProject();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        height: '100vh',
        backgroundColor: '#1f2024',
        color: 'white',
        overflow: 'auto'
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
            <span>{activeProject?.name || 'The Irish Mystery'}</span>
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

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#1f2024',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #3a3b41'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>📚</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '500' }}>{activeProject?.name || 'The Irish Mystery'}</h2>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <button style={{
              backgroundColor: '#2d2e33',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: '150px'
            }}>
              <span>{activeProject?.name || 'The Irish Mystery'}</span>
              <span style={{ marginLeft: '8px' }}>▼</span>
            </button>
            <button style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#2d2e33',
              color: 'white',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              👤
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8f5f0',
          color: '#654321',
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