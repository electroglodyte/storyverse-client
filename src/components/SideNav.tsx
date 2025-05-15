import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { 
  FaHome, FaBook, FaFileAlt, FaSearch, 
  FaChartBar, FaProjectDiagram, FaBolt, FaRobot, 
  FaCog, FaTheaterMasks, FaPen, FaFileImport, FaFileExport,
  FaHistory, FaComments, FaExchangeAlt, FaEdit, FaAnalytics
} from 'react-icons/fa';

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

  // Styling for submenu items (indented)
  const submenuStyle = {
    ...navItemStyle,
    paddingLeft: '2.5rem'
  };
  
  const submenuActiveStyle = {
    ...activeStyle,
    paddingLeft: '2.5rem'
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
              {activeProject?.name || 'One Silly Story'}
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
              style={location.pathname === '/' ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (location.pathname !== '/') e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaHome style={{ marginRight: '0.5rem' }} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/story-worlds"
              style={isActive('/story-worlds') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/story-worlds')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaBook style={{ marginRight: '0.5rem' }} />
              <span>Story Worlds</span>
            </Link>
          </li>
          <li>
            <Link
              to="/series"
              style={isActive('/series') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/series')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Series</span>
            </Link>
          </li>
          <li>
            <Link
              to="/stories"
              style={isActive('/stories') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/stories')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Stories</span>
            </Link>
          </li>
          <li>
            <Link
              to="/characters"
              style={isActive('/characters') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/characters')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Characters</span>
            </Link>
          </li>
          <li>
            <Link
              to="/locations"
              style={isActive('/locations') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/locations')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Locations</span>
            </Link>
          </li>
          <li>
            <Link
              to="/factions"
              style={isActive('/factions') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/factions')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Factions</span>
            </Link>
          </li>
          
          {/* Main Scenes Link */}
          <li>
            <Link
              to="/scenes"
              style={isActive('/scenes') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/scenes')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaTheaterMasks style={{ marginRight: '0.5rem' }} />
              <span>Scenes</span>
            </Link>
          </li>
          
          {/* Scene subpages - these are visible even if they don't work perfectly yet */}
          <li>
            <Link
              to="/scenes/new"
              style={location.pathname === '/scenes/new' ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (location.pathname !== '/scenes/new') e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaPen style={{ marginRight: '0.5rem' }} />
              <span>New Scene</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scenes/edit"
              style={location.pathname.includes('/scenes/edit') ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!location.pathname.includes('/scenes/edit')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaEdit style={{ marginRight: '0.5rem' }} />
              <span>Scene Editor</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scenes/versions"
              style={location.pathname.includes('/versions') ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!location.pathname.includes('/versions')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaHistory style={{ marginRight: '0.5rem' }} />
              <span>Version History</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scenes/compare"
              style={location.pathname.includes('/compare') ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!location.pathname.includes('/compare')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaExchangeAlt style={{ marginRight: '0.5rem' }} />
              <span>Compare Versions</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scenes/comments"
              style={location.pathname.includes('/comments') ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!location.pathname.includes('/comments')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaComments style={{ marginRight: '0.5rem' }} />
              <span>Comments</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scenes/import"
              style={location.pathname === '/scenes/import' ? submenuActiveStyle : submenuStyle}
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
              style={location.pathname === '/scenes/export' ? submenuActiveStyle : submenuStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (location.pathname !== '/scenes/export') e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileExport style={{ marginRight: '0.5rem' }} />
              <span>Export</span>
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
              to="/timeline"
              style={isActive('/timeline') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/timeline')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileAlt style={{ marginRight: '0.5rem' }} />
              <span>Timeline</span>
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
      
      {/* Tools */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>TOOLS</h3>
        <ul>
          {/* Add Import & Analyze link */}
          <li>
            <Link
              to="/import"
              style={isActive('/import') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/import')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileImport style={{ marginRight: '0.5rem' }} />
              <span>Import & Analyze</span>
            </Link>
          </li>
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
          <span>App Settings</span>
        </Link>
      </div>
    </nav>
  );
};