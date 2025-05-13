import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProject();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Direct styling for menu items
  const navItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1.5rem',
    color: 'white',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  };
  
  const activeStyle = {
    ...navItemStyle,
    backgroundColor: '#2d2e33',
    fontWeight: '500'
  };

  return (
    <nav style={{ width: '100%', height: '100%', padding: '1rem 0' }}>
      {/* Logo and Subtitle */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fef3c7' }}>StoryVerse</h1>
        <p style={{ fontSize: '0.875rem', color: 'rgba(253, 230, 138, 0.8)' }}>World Builder</p>
      </div>
      
      {/* Active Project */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>ACTIVE PROJECT</h3>
        <div>
          <button 
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              backgroundColor: '#2d2e33', 
              borderRadius: '0.375rem', 
              color: 'white', 
              fontWeight: '500', 
              textAlign: 'left', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject?.name || 'The Irish Mystery'}
            </span>
            <span>▼</span>
          </button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>MAIN</h3>
        <ul>
          <li>
            <Link
              to="/"
              style={isActive('/') && !isActive('/projects') && !isActive('/samples') && !isActive('/search') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/') || isActive('/projects') || isActive('/samples') || isActive('/search')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>🏠</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/samples"
              style={isActive('/samples') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/samples')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>📝</span>
              <span>Writing Samples</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              style={isActive('/search') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/search')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>🔍</span>
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Tools */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>TOOLS</h3>
        <ul>
          <li>
            <Link
              to="/style-analysis"
              style={isActive('/style-analysis') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/style-analysis')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>📊</span>
              <span>Style Analysis</span>
            </Link>
          </li>
          <li>
            <Link
              to="/plot-mapping"
              style={isActive('/plot-mapping') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/plot-mapping')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>📈</span>
              <span>Plot Mapping</span>
            </Link>
          </li>
          <li>
            <Link
              to="/consistency-check"
              style={isActive('/consistency-check') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/consistency-check')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>⚡</span>
              <span>Consistency Check</span>
            </Link>
          </li>
          <li>
            <Link
              to="/claude-assistant"
              style={isActive('/claude-assistant') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/claude-assistant')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <span style={{ marginRight: '0.5rem' }}>💬</span>
              <span>Claude Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Settings */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <Link
          to="/settings"
          style={isActive('/settings') ? activeStyle : navItemStyle}
          onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
          onMouseOut={(e) => {if (!isActive('/settings')) e.currentTarget.style.backgroundColor = 'transparent'}}
        >
          <span style={{ marginRight: '0.5rem' }}>⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};