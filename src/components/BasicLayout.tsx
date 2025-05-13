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
        padding: '20px',
        overflow: 'auto'
      }}>
        <h1 style={{ color: '#fef3c7', marginBottom: '5px' }}>StoryVerse</h1>
        <p style={{ color: '#fde68a', marginBottom: '20px', fontSize: '14px' }}>World Builder</p>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px' 
          }}>
            ACTIVE PROJECT
          </h3>
          <div style={{
            backgroundColor: '#2d2e33',
            padding: '8px 12px',
            borderRadius: '4px'
          }}>
            {activeProject?.name || 'The Irish Mystery'} ▼
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px' 
          }}>
            MAIN
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <a href="/" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                🏠 Dashboard
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/samples" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                📝 Writing Samples
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/search" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                🔍 Search
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            color: '#fcd34d', 
            marginBottom: '8px' 
          }}>
            TOOLS
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <a href="/style-analysis" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                📊 Style Analysis
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/plot-mapping" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                📈 Plot Mapping
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/consistency-check" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                ⚡ Consistency Check
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/claude-assistant" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
                💬 Claude Assistant
              </a>
            </li>
          </ul>
        </div>

        <div>
          <a href="/settings" style={{ color: 'white', display: 'block', padding: '8px 0' }}>
            ⚙️ Settings
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
          <div>
            <h2>{activeProject?.name || 'The Irish Mystery'}</h2>
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
              marginRight: '10px'
            }}>
              {activeProject?.name || 'The Irish Mystery'} ▼
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
          padding: '20px',
          overflow: 'auto'
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BasicLayout;