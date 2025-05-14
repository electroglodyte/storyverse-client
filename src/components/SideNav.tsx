import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { 
  FaHome, FaBook, FaFileAlt, FaSearch, 
  FaChartBar, FaProjectDiagram, FaBolt, FaRobot, 
  FaCog, FaChevronDown, FaChevronUp, FaTheaterMasks, 
  FaPen, FaHistory, FaComments, FaExchangeAlt, 
  FaFileImport, FaFileExport
} from 'react-icons/fa';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProject();
  const [scenesExpanded, setScenesExpanded] = useState(true);

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
  
  const subItemStyle = {
    ...navItemStyle,
    paddingLeft: '2.5rem',
    fontSize: '0.9rem'
  };
  
  const activeSubItemStyle = {
    ...subItemStyle,
    backgroundColor: '#2d2e33',
    fontWeight: '500'
  };

  return (
    <nav style={{ width: '100%', height: '100%', padding: '1rem 0', overflow: 'auto' }}>
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
              <FaHome style={{ marginRight: '0.5rem' }} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/projects"
              style={isActive('/projects') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/projects')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaBook style={{ marginRight: '0.5rem' }} />
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link
              to="/samples"
              style={isActive('/samples') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/samples')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
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
              <FaSearch style={{ marginRight: '0.5rem' }} />
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Scene Management */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div 
          style={{ 
            padding: '0 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '0.5rem' 
          }}
          onClick={() => setScenesExpanded(!scenesExpanded)}
        >
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500' }}>SCENES</h3>
          {scenesExpanded ? <FaChevronUp size={10} color="rgba(252, 211, 77, 0.7)" /> : <FaChevronDown size={10} color="rgba(252, 211, 77, 0.7)" />}
        </div>
        
        {scenesExpanded && (
          <ul>
            <li>
              <Link
                to="/scenes"
                style={location.pathname === '/scenes' ? activeSubItemStyle : subItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (location.pathname !== '/scenes') e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaTheaterMasks style={{ marginRight: '0.5rem' }} />
                <span>Scene Explorer</span>
              </Link>
            </li>
            <li>
              <Link
                to="/scenes/new"
                style={location.pathname === '/scenes/new' ? activeSubItemStyle : subItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (location.pathname !== '/scenes/new') e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaPen style={{ marginRight: '0.5rem' }} />
                <span>New Scene</span>
              </Link>
            </li>
            <li>
              <Link
                to="/scenes/import"
                style={location.pathname === '/scenes/import' ? activeSubItemStyle : subItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (location.pathname !== '/scenes/import') e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaFileImport style={{ marginRight: '0.5rem' }} />
                <span>Import</span>
              </Link>
            </li>
            <li>
              <Link
                to="/scenes/export"
                style={location.pathname === '/scenes/export' ? activeSubItemStyle : subItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (location.pathname !== '/scenes/export') e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaFileExport style={{ marginRight: '0.5rem' }} />
                <span>Export</span>
              </Link>
            </li>
          </ul>
        )}
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
              <FaChartBar style={{ marginRight: '0.5rem' }} />
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
              <FaProjectDiagram style={{ marginRight: '0.5rem' }} />
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
              <FaBolt style={{ marginRight: '0.5rem' }} />
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
              <FaRobot style={{ marginRight: '0.5rem' }} />
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
          <FaCog style={{ marginRight: '0.5rem' }} />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};