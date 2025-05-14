// src/components/BasicLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { supabase } from '../supabaseClient';
import { StoryWorld, Story } from '../supabase-tables';

// This is an updated layout component for the new StoryWorlds structure
const BasicLayout: React.FC = () => {
  const { activeProject, projects, changeProject } = useProject();
  const [activeStoryWorld, setActiveStoryWorld] = useState<StoryWorld | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [showStoryWorldDropdown, setShowStoryWorldDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch the storyWorlds on component mount
  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        const { data, error } = await supabase
          .from('storyworlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setStoryWorlds(data || []);

        // Set the first storyWorld as active if none is selected
        if (data && data.length > 0 && !activeStoryWorld) {
          setActiveStoryWorld(data[0]);

          // Fetch a story from this storyWorld to set as active
          const { data: storiesData, error: storiesError } = await supabase
            .from('stories')
            .select('*')
            .eq('storyworld_id', data[0].id)
            .order('name', { ascending: true })
            .limit(1);

          if (storiesError) throw storiesError;
          if (storiesData && storiesData.length > 0) {
            setActiveStory(storiesData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching story worlds:', error);
      }
    };

    fetchStoryWorlds();
  }, []);

  // Get the current page name from the location path
  const getPageName = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/storyworlds') && path !== '/storyworlds') return 'Story World Details';
    if (path === '/storyworlds') return 'Story Worlds';
    if (path.startsWith('/series')) return 'Series';
    if (path.startsWith('/stories')) return 'Story Details';
    if (path.startsWith('/samples')) return 'Writing Samples';
    if (path === '/search') return 'Search';
    if (path === '/style-analysis') return 'Style Analysis';
    if (path === '/plot-mapping') return 'Plot Mapping';
    if (path === '/consistency-check') return 'Consistency Check';
    if (path === '/claude-assistant') return 'Claude Assistant';
    if (path === '/locations') return 'Locations';
    if (path.startsWith('/locations/')) return 'Location Details';
    if (path === '/settings') return 'Locations';
    if (path.startsWith('/settings/')) return 'Location Details';
    return 'Dashboard';
  };

  const toggleStoryWorldDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowStoryWorldDropdown(!showStoryWorldDropdown);
  };

  const handleStoryWorldSelect = (storyWorld: StoryWorld) => {
    setActiveStoryWorld(storyWorld);
    setShowStoryWorldDropdown(false);
    navigate(`/storyworlds/${storyWorld.id}`);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '20px' }}>
          <h1 className="sidebar-brand">StoryVerse</h1>
          <p className="sidebar-subtitle">World Builder</p>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">ACTIVE STORYWORLD</h3>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={toggleStoryWorldDropdown}
              className="sidebar-project-selector"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit', 
                width: '100%', 
                textAlign: 'left',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '8px 12px'
              }}
            >
              <span>{activeStoryWorld?.name || 'Select a Story World'}</span>
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
                      padding: '8px 12px',
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
                  to="/storyworlds/new"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderTop: '1px solid #3a3b41',
                    color: '#fcd34d',
                    textDecoration: 'none'
                  }}
                  onClick={() => setShowStoryWorldDropdown(false)}
                >
                  + Create New Story World
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>MAIN</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/storyworlds" className="sidebar-item">
                <span className="sidebar-item-icon">🌍</span>
                <span>Story Worlds</span>
              </Link>
            </li>
            <li>
              <Link to={activeStory ? `/stories/${activeStory.id}` : '/storyworlds'} className="sidebar-item">
                <span className="sidebar-item-icon">📚</span>
                <span>Active Story</span>
              </Link>
            </li>
            <li>
              <Link to="/samples" className="sidebar-item">
                <span className="sidebar-item-icon">📝</span>
                <span>Writing Samples</span>
              </Link>
            </li>
            <li>
              <Link to="/search" className="sidebar-item">
                <span className="sidebar-item-icon">🔍</span>
                <span>Search</span>
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 className="sidebar-section-title" style={{ padding: '0 20px' }}>TOOLS</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/style-analysis" className="sidebar-item">
                <span className="sidebar-item-icon">📊</span>
                <span>Style Analysis</span>
              </Link>
            </li>
            <li>
              <Link to="/plot-mapping" className="sidebar-item">
                <span className="sidebar-item-icon">📈</span>
                <span>Plot Mapping</span>
              </Link>
            </li>
            <li>
              <Link to="/consistency-check" className="sidebar-item">
                <span className="sidebar-item-icon">⚡</span>
                <span>Consistency Check</span>
              </Link>
            </li>
            <li>
              <Link to="/claude-assistant" className="sidebar-item">
                <span className="sidebar-item-icon">💬</span>
                <span>Claude Assistant</span>
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <Link to="/locations" className="sidebar-item" style={{ padding: '8px 0' }}>
            <span className="sidebar-item-icon">⚙️</span>
            <span>Locations</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* StoryWorld Header */}
        <div className="project-header">
          <h2 className="project-title">{activeStoryWorld?.name || 'Select a Story World'}</h2>
          
          <div className="project-controls">
            <div style={{ position: 'relative' }}>
              <button 
                onClick={toggleStoryWorldDropdown}
                className="project-selector" 
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '4px 10px'
                }}
              >
                {activeStoryWorld?.name || 'Select a Story World'} {showStoryWorldDropdown ? '▲' : '▼'}
              </button>
              
              {showStoryWorldDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '200px',
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
                        padding: '8px 12px',
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
                    to="/storyworlds/new"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderTop: '1px solid #3a3b41',
                      color: '#fcd34d',
                      textDecoration: 'none'
                    }}
                    onClick={() => setShowStoryWorldDropdown(false)}
                  >
                    + Create New Story World
                  </Link>
                </div>
              )}
            </div>
            {activeStoryWorld && (
              <Link 
                to={`/storyworlds/${activeStoryWorld.id}`} 
                className="control-button" 
                title="View Story World Details"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                🔄
              </Link>
            )}
          </div>
        </div>

        {/* Section Header */}
        <div className="section-header">
          <h1 className="section-title">{getPageName()}</h1>
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