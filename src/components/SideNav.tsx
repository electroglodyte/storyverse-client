// src/components/SideNav.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoryWorld, Story, Series } from '../supabase-tables';
import { 
  FaHome, FaBook, FaFileAlt, FaSearch, 
  FaChartBar, FaProjectDiagram, FaBolt, FaRobot, 
  FaCog, FaTheaterMasks, FaPen, FaFileImport, FaFileExport,
  FaHistory, FaComments, FaExchangeAlt, FaEdit, FaMagic,
  FaUser, FaMapMarkerAlt, FaUsers, FaTools, FaCube
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
  const [showStoryWorldDropdown, setShowStoryWorldDropdown] = useState(false);
  const [showStoryDropdown, setShowStoryDropdown] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  // Extract storyWorldId from URL search params if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const storyWorldId = searchParams.get('storyWorldId');
    const storyId = searchParams.get('storyId');
    
    if (storyWorldId && (!activeStoryWorld || activeStoryWorld.id !== storyWorldId)) {
      // Find the story world in the list
      const storyWorld = storyWorlds.find(sw => sw.id === storyWorldId);
      if (storyWorld) {
        setActiveStoryWorld(storyWorld);
      }
    }
    
    if (storyId && (!activeStory || activeStory.id !== storyId)) {
      // Fetch the story by ID
      const fetchStory = async () => {
        try {
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();
          
          if (error) throw error;
          if (data) {
            setActiveStory(data);
            
            // If the story has a story_world_id, set the active story world
            if (data.story_world_id && (!activeStoryWorld || activeStoryWorld.id !== data.story_world_id)) {
              const sw = storyWorlds.find(sw => sw.id === data.story_world_id);
              if (sw) {
                setActiveStoryWorld(sw);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching story:', error);
        }
      };
      
      fetchStory();
    }
  }, [location.search, storyWorlds, activeStoryWorld, activeStory, setActiveStoryWorld, setActiveStory]);

  // Fetch stories for the current story world
  useEffect(() => {
    const fetchStories = async () => {
      if (!activeStoryWorld) {
        setStories([]);
        return;
      }
      
      setLoadingStories(true);
      try {
        // Try with story_world_id first
        let { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('story_world_id', activeStoryWorld.id)
          .order('title', { ascending: true });

        // If no results, try with storyworld_id 
        if ((!data || data.length === 0) && error) {
          const result = await supabase
            .from('stories')
            .select('*')
            .eq('storyworld_id', activeStoryWorld.id)
            .order('title', { ascending: true });
            
          data = result.data;
          error = result.error;
        }

        if (error) throw error;
        
        setStories(data || []);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setStories([]);
      } finally {
        setLoadingStories(false);
      }
    };

    fetchStories();
  }, [activeStoryWorld]);

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

  // Styling for disabled menu items
  const disabledStyle = {
    ...navItemStyle,
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed'
  };

  const toggleStoryWorldDropdown = () => {
    setShowStoryWorldDropdown(!showStoryWorldDropdown);
  };

  const toggleStoryDropdown = () => {
    setShowStoryDropdown(!showStoryDropdown);
  };

  const handleStoryWorldSelect = async (storyWorld: StoryWorld | null) => {
    setActiveStoryWorld(storyWorld);
    setShowStoryWorldDropdown(false);
    
    if (storyWorld) {
      // Navigate to story world without automatically selecting a story
      navigate(`/story-worlds/${storyWorld.id}`);
      
      // Reset active story
      setActiveStory(null);
      setActiveSeries(null);
    } else {
      setActiveStory(null);
      setActiveSeries(null);
      navigate('/dashboard');
    }
  };

  const handleStorySelect = async (story: Story | null) => {
    setActiveStory(story);
    setShowStoryDropdown(false);
    
    if (story) {
      navigate(`/stories/${story.id}`);
    }
  };

  // Story World selector dropdown
  const renderStoryWorldSelector = () => (
    <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
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
          onClick={toggleStoryWorldDropdown}
          disabled={loading}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading...' : (activeStoryWorld?.name || 'Select a Story World')}
          </span>
          <span>{showStoryWorldDropdown ? '▲' : '▼'}</span>
        </button>
        
        {showStoryWorldDropdown && (
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
              onClick={() => setShowStoryWorldDropdown(false)}
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
  );

  // Story selector dropdown (only shown if multiple stories)
  const renderStorySelector = () => {
    if (!activeStoryWorld || stories.length <= 1) {
      return null;
    }

    return (
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
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
              cursor: loadingStories ? 'wait' : 'pointer'
            }}
            onClick={toggleStoryDropdown}
            disabled={loadingStories}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loadingStories ? 'Loading...' : (activeStory?.title || 'Select a Story')}
            </span>
            <span>{showStoryDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showStoryDropdown && (
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
              {stories.map(story => (
                <button
                  key={story.id}
                  onClick={() => handleStorySelect(story)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: activeStory?.id === story.id ? '#1f2024' : 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2024' }}
                  onMouseOut={(e) => { 
                    if (activeStory?.id !== story.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {story.title}
                </button>
              ))}
              <Link
                to={`/stories/new?storyWorldId=${activeStoryWorld.id}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderTop: '1px solid #3a3b41',
                  color: '#fcd34d',
                  textDecoration: 'none'
                }}
                onClick={() => setShowStoryDropdown(false)}
              >
                + Create New Story
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render entity-related links (Characters, Locations, etc.)
  const renderEntityLinks = () => {
    if (!activeStoryWorld) return null;

    // Use the story ID if available, otherwise use the story world ID
    const storyId = activeStory?.id;
    const storyWorldId = activeStoryWorld.id;
    
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <ul>
          <li>
            {/* Pass the selected story world ID to pre-filter the list */}
            <Link
              to={`/characters?storyWorldId=${storyWorldId}`}
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
              to={`/locations?storyWorldId=${storyWorldId}`}
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
              to={`/factions?storyWorldId=${storyWorldId}`}
              style={isActive('/factions') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/factions')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaUsers style={{ marginRight: '0.5rem' }} />
              <span>Factions</span>
            </Link>
          </li>
          <li>
            <div style={disabledStyle}>
              <FaCube style={{ marginRight: '0.5rem' }} />
              <span>Objects</span>
            </div>
          </li>
          <li>
            <Link
              to={`/importer?storyWorldId=${storyWorldId}${storyId ? `&storyId=${storyId}` : ''}`}
              style={isActive('/importer') ? activeStyle : navItemStyle}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
              onMouseOut={(e) => {if (!isActive('/importer')) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <FaFileImport style={{ marginRight: '0.5rem' }} />
              <span>Importer</span>
            </Link>
          </li>
        </ul>
      </div>
    );
  };

  // Render project-specific functions (Consistency Check, Plot Mapping)
  const renderProjectFunctions = () => {
    if (!activeStoryWorld) return null;
    
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>PROJECT FUNCTIONS</h3>
        <ul>
          {/* Temporarily disabled for now since they lead to Page Not Found */}
          <li>
            <div style={disabledStyle}>
              <FaBolt style={{ marginRight: '0.5rem' }} />
              <span>Consistency Check</span>
            </div>
          </li>
          <li>
            <div style={disabledStyle}>
              <FaProjectDiagram style={{ marginRight: '0.5rem' }} />
              <span>Plot Mapping</span>
            </div>
          </li>
          <li>
            <div style={disabledStyle}>
              <FaHistory style={{ marginRight: '0.5rem' }} />
              <span>Timeline</span>
            </div>
          </li>
          {activeStory && (
            <li>
              <div style={disabledStyle}>
                <FaTheaterMasks style={{ marginRight: '0.5rem' }} />
                <span>Scenes</span>
              </div>
            </li>
          )}
        </ul>
      </div>
    );
  };

  // Render general navigation
  const renderGeneralNavigation = () => (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ padding: '0 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(252, 211, 77, 0.7)', fontWeight: '500', marginBottom: '0.5rem' }}>GENERAL</h3>
      <ul>
        <li>
          <div style={disabledStyle}>
            <FaHome style={{ marginRight: '0.5rem' }} />
            <span>Dashboard</span>
          </div>
        </li>
        <li>
          <Link
            to="/importer"
            style={isActive('/importer') && !location.pathname.includes('?storyId=') && !location.pathname.includes('?storyWorldId=') ? activeStyle : navItemStyle}
            onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
            onMouseOut={(e) => {if (!isActive('/importer') || location.pathname.includes('?storyId=') || location.pathname.includes('?storyWorldId=')) e.currentTarget.style.backgroundColor = 'transparent'}}
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
          <div style={disabledStyle}>
            <FaSearch style={{ marginRight: '0.5rem' }} />
            <span>Search</span>
          </div>
        </li>
        <li>
          <Link
            to="/settings"
            style={isActive('/settings') ? activeStyle : navItemStyle}
            onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#2d2e33'}}
            onMouseOut={(e) => {if (!isActive('/settings')) e.currentTarget.style.backgroundColor = 'transparent'}}
          >
            <FaCog style={{ marginRight: '0.5rem' }} />
            <span>App Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );

  return (
    <nav style={{ width: '100%', height: '100%', padding: '1rem 0', overflow: 'auto' }}>
      {/* Logo and Subtitle */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fef3c7' }}>StoryVerse</h1>
        <p style={{ fontSize: '0.875rem', color: 'rgba(253, 230, 138, 0.8)' }}>World Builder</p>
      </div>
      
      {/* Story World Selector */}
      {renderStoryWorldSelector()}
      
      {/* Story Selector (only if multiple stories) */}
      {renderStorySelector()}
      
      {/* Entity Links - No header as requested */}
      {renderEntityLinks()}
      
      {/* Project Functions */}
      {renderProjectFunctions()}
      
      {/* General Navigation */}
      {renderGeneralNavigation()}
    </nav>
  );
};
