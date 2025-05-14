import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  FaHome, 
  FaBook, 
  FaStream, 
  FaListUl, 
  FaEdit, 
  FaSearch,
  FaMagic,
  FaProjectDiagram,
  FaBalanceScale,
  FaCommentDots,
  FaCog,
  FaCalendarAlt,
  FaUser,
  FaMapMarkerAlt,
  FaUserFriends
} from 'react-icons/fa';

function App() {
  const location = useLocation();
  const [activeProject, setActiveProject] = useState('One Silly Story');
  
  // Helper function to determine if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get current page title
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.startsWith('/story-worlds')) return 'Story Worlds';
    if (location.pathname.startsWith('/series')) return 'Series';
    if (location.pathname.startsWith('/stories')) return 'Stories';
    if (location.pathname.startsWith('/characters')) return 'Characters';
    if (location.pathname.startsWith('/settings')) return 'Settings';
    if (location.pathname.startsWith('/factions')) return 'Factions';
    if (location.pathname.startsWith('/timeline')) return 'Timeline';
    return 'StoryVerse';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div>ACTIVE PROJECT</div>
          <div className="flex items-center justify-between">
            <span>{activeProject}</span>
            <span>▼</span>
          </div>
        </div>
        
        <div className="sidebar-section">
          <div className="sidebar-section-title">MAIN</div>
          <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaHome /></span>
            Dashboard
          </Link>
          <Link to="/story-worlds" className={`sidebar-link ${isActive('/story-worlds') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaBook /></span>
            Story Worlds
          </Link>
          <Link to="/series" className={`sidebar-link ${isActive('/series') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaStream /></span>
            Series
          </Link>
          <Link to="/stories" className={`sidebar-link ${isActive('/stories') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaListUl /></span>
            Stories
          </Link>
          <Link to="/characters" className={`sidebar-link ${isActive('/characters') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaUser /></span>
            Characters
          </Link>
          <Link to="/settings" className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaMapMarkerAlt /></span>
            Settings
          </Link>
          <Link to="/factions" className={`sidebar-link ${isActive('/factions') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaUserFriends /></span>
            Factions
          </Link>
          <Link to="/writing-samples" className={`sidebar-link ${isActive('/writing-samples') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaEdit /></span>
            Writing Samples
          </Link>
          <Link to="/timeline" className={`sidebar-link ${isActive('/timeline') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaCalendarAlt /></span>
            Timeline
          </Link>
          <Link to="/search" className={`sidebar-link ${isActive('/search') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaSearch /></span>
            Search
          </Link>
        </div>
        
        <div className="sidebar-section">
          <div className="sidebar-section-title">TOOLS</div>
          <Link to="/style-analysis" className={`sidebar-link ${isActive('/style-analysis') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaMagic /></span>
            Style Analysis
          </Link>
          <Link to="/plot-mapping" className={`sidebar-link ${isActive('/plot-mapping') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaProjectDiagram /></span>
            Plot Mapping
          </Link>
          <Link to="/consistency-check" className={`sidebar-link ${isActive('/consistency-check') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaBalanceScale /></span>
            Consistency Check
          </Link>
          <Link to="/claude-assistant" className={`sidebar-link ${isActive('/claude-assistant') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaCommentDots /></span>
            Claude Assistant
          </Link>
        </div>
        
        <div className="mt-auto">
          <Link to="/app-settings" className={`sidebar-link ${isActive('/app-settings') ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><FaCog /></span>
            Settings
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="main-header">
          <h1 className="main-title">{getPageTitle()}</h1>
        </div>
        
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#166534',
            },
          },
          error: {
            style: {
              background: '#991b1b',
            },
          },
        }}
      />
    </div>
  );
}

export default App;