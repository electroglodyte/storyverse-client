// src/components/SideNav.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoryWorld, Story, Series } from '../supabase-tables';
import { 
  FaHome, FaBook, FaFileAlt, FaSearch, 
  FaChartBar, FaProjectDiagram, FaBolt, FaRobot, 
  FaCog, FaTheaterMasks, FaPen, FaFileImport, FaFileExport,
  FaHistory, FaComments, FaExchangeAlt, FaEdit, FaMagic,
  FaUser, FaMapMarkerAlt, FaUsers, FaTools
} from 'react-icons/fa';
import { supabase } from '../supabaseClient';

interface SideNavProps {
  activeStoryWorld: StoryWorld | null;
  activeStory: Story | null;
  activeSeries: Series | null;
  storyWorlds: StoryWorld[];
  setActiveStoryWorld: (storyWorld: StoryWorld | null) => void;
  setActiveStory: (story: Story | null) => void;
  setActiveSeries: (series: Series | null) => void;
  loading: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({
  activeStoryWorld,
  activeStory,
  activeSeries,
  storyWorlds,
  setActiveStoryWorld,
  setActiveStory,
  setActiveSeries,
  loading
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleStoryWorldSelect = async (storyWorld: StoryWorld | null) => {
    setActiveStoryWorld(storyWorld);
    setShowDropdown(false);
    
    if (storyWorld) {
      // Fetch a story from this story world
      try {
        // Try with story_world_id first
        let { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('story_world_id', storyWorld.id)
          .order('title', { ascending: true })
          .limit(1);

        // If no results, try with storyworld_id 
        if ((!data || data.length === 0) && error) {
          const result = await supabase
            .from('stories')
            .select('*')
            .eq('storyworld_id', storyWorld.id)
            .order('title', { ascending: true })
            .limit(1);
            
          data = result.data;
          error = result.error;
        }

        if (error) throw error;
        
        if (data && data.length > 0) {
          setActiveStory(data[0]);
        } else {
          setActiveStory(null);
        }
        
        setActiveSeries(null);
        navigate(`/story-worlds/${storyWorld.id}`);
      } catch (error) {
        console.error('Error fetching stories:', error);
      }
    } else {
      setActiveStory(null);
      setActiveSeries(null);
      navigate('/dashboard');
    }
  };

  // Render different navigation based on context
  const renderNavigationItems = () => {
    if (!activeStoryWorld) {
      // Global navigation when no story world is selected
      return (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>NAVIGATION</h3>
            <ul>
              <li>
                <Link
                  to="/dashboard"
                  style={isActive('/dashboard') || location.pathname === '/' ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!isActive('/dashboard') && location.pathname !== '/') e.currentTarget.style.backgroundColor = 'transparent'}}
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
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>TOOLS</h3>
            <ul>
              <li>
                <Link
                  to="/importer"
                  style={isActive('/importer') ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!isActive('/importer')) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaMagic style={{ marginRight: '0.5rem' }} />
                  <span>Importer</span>
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
        </>
      );
    }
    
    // Story world specific navigation
    return (
      <>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>STORY WORLD</h3>
          <ul>
            <li>
              <Link
                to={`/story-worlds/${activeStoryWorld.id}`}
                style={location.pathname === `/story-worlds/${activeStoryWorld.id}` ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (location.pathname !== `/story-worlds/${activeStoryWorld.id}`) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaBook style={{ marginRight: '0.5rem' }} />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                to={`/series?storyWorldId=${activeStoryWorld.id}`}
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
                to={`/stories?storyWorldId=${activeStoryWorld.id}`}
                style={isActive('/stories') && !location.pathname.includes('/characters') && !location.pathname.includes('/locations') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/stories') || location.pathname.includes('/characters') || location.pathname.includes('/locations')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaFileAlt style={{ marginRight: '0.5rem' }} />
                <span>Stories</span>
              </Link>
            </li>
            <li>
              <Link
                to={`/characters?storyWorldId=${activeStoryWorld.id}`}
                style={isActive('/characters') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/characters')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaUser style={{ marginRight: '0.5rem' }} />
                <span>Characters</span>
              </Link>
            </li>
            <li>
              <Link
                to={`/locations?storyWorldId=${activeStoryWorld.id}`}
                style={isActive('/locations') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/locations')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                <span>Locations</span>
              </Link>
            </li>
            <li>
              <Link
                to={`/factions?storyWorldId=${activeStoryWorld.id}`}
                style={isActive('/factions') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/factions')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaUsers style={{ marginRight: '0.5rem' }} />
                <span>Factions</span>
              </Link>
            </li>
            <li>
              <Link
                to={`/timeline?storyWorldId=${activeStoryWorld.id}`}
                style={isActive('/timeline') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/timeline')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaProjectDiagram style={{ marginRight: '0.5rem' }} />
                <span>Timeline</span>
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Story specific section - only show if we have an active story */}
        {activeStory && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>ACTIVE STORY</h3>
            <ul>
              <li>
                <Link
                  to={`/stories/${activeStory.id}`}
                  style={location.pathname === `/stories/${activeStory.id}` ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (location.pathname !== `/stories/${activeStory.id}`) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaFileAlt style={{ marginRight: '0.5rem' }} />
                  <span>Story Details</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/stories/${activeStory.id}/characters`}
                  style={location.pathname.includes(`/stories/${activeStory.id}/characters`) ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!location.pathname.includes(`/stories/${activeStory.id}/characters`)) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaUser style={{ marginRight: '0.5rem' }} />
                  <span>Characters</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/stories/${activeStory.id}/locations`}
                  style={location.pathname.includes(`/stories/${activeStory.id}/locations`) ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!location.pathname.includes(`/stories/${activeStory.id}/locations`)) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                  <span>Locations</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/scenes?storyId=${activeStory.id}`}
                  style={isActive('/scenes') ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!isActive('/scenes')) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaTheaterMasks style={{ marginRight: '0.5rem' }} />
                  <span>Scenes</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/plot-mapping?storyId=${activeStory.id}`}
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
                  to={`/consistency-check?storyId=${activeStory.id}`}
                  style={isActive('/consistency-check') ? activeStyle : navItemStyle}
                  onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                  onMouseOut={(e) => {if (!isActive('/consistency-check')) e.currentTarget.style.backgroundColor = 'transparent'}}
                >
                  <FaBolt style={{ marginRight: '0.5rem' }} />
                  <span>Consistency Check</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
        
        {/* Tools section */}
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
                to="/claude-assistant"
                style={isActive('/claude-assistant') ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/claude-assistant')) e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaRobot style={{ marginRight: '0.5rem' }} />
                <span>Claude Assistant</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard"
                style={isActive('/dashboard') || location.pathname === '/' ? activeStyle : navItemStyle}
                onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
                onMouseOut={(e) => {if (!isActive('/dashboard') && location.pathname !== '/') e.currentTarget.style.backgroundColor = 'transparent'}}
              >
                <FaHome style={{ marginRight: '0.5rem' }} />
                <span>Dashboard</span>
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
      </>
    );
  };

  return (
    <nav style={{ width: '100%', height: '100%', padding: '1rem 0', overflow: 'auto' }}>
      {/* Logo and Subtitle */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fef3c7' }}>StoryVerse</h1>
        <p style={{ fontSize: '0.875rem', color: 'rgba(253, 230, 138, 0.8)' }}>World Builder</p>
      </div>
      
      {/* Active Story World */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>ACTIVE STORY WORLD</h3>
        <div style={{ position: 'relative' }}>
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
              alignItems: 'center',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer'
            }}
            onClick={toggleDropdown}
            disabled={loading}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loading ? 'Loading...' : (activeStoryWorld?.name || 'Select a Story World')}
            </span>
            <span>{showDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showDropdown && (
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
              {storyWorlds.map(storyWorld => (
                <button
                  key={storyWorld.id}
                  onClick={() => handleStoryWorldSelect(storyWorld)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: activeStoryWorld?.id === storyWorld.id ? '#1f2024' : 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2024' }}
                  onMouseOut={(e) => { 
                    if (activeStoryWorld?.id !== storyWorld.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {storyWorld.name}
                </button>
              ))}
              <Link
                to="/story-worlds/new"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderTop: '1px solid #3a3b41',
                  color: '#fcd34d',
                  textDecoration: 'none'
                }}
                onClick={() => setShowDropdown(false)}
              >
                + Create New Story World
              </Link>
              {activeStoryWorld && (
                <button
                  onClick={() => handleStoryWorldSelect(null)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderTop: '1px solid #3a3b41',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#e5e5e5',
                    cursor: 'pointer'
                  }}
                >
                  None
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Context-specific Navigation */}
      {renderNavigationItems()}
      
      {/* Settings - Always at bottom */}
      <div style={{ marginTop: 'auto', padding: '1rem 0' }}>
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