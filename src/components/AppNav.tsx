// src/components/AppNav.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoryWorld, Story, Series } from '../supabase-tables';
import { supabase } from '../supabaseClient';

interface AppNavProps {
  activeStoryWorld: StoryWorld | null;
  activeStory: Story | null;
  activeSeries: Series | null;
  storyWorlds: StoryWorld[];
  setActiveStoryWorld: (storyWorld: StoryWorld | null) => void;
  setActiveStory: (story: Story | null) => void;
  setActiveSeries: (series: Series | null) => void;
  loading: boolean;
}

export const AppNav: React.FC<AppNavProps> = ({
  activeStoryWorld,
  activeStory,
  activeSeries,
  storyWorlds,
  setActiveStoryWorld,
  setActiveStory,
  setActiveSeries,
  loading
}) => {
  const [showStoryWorldDropdown, setShowStoryWorldDropdown] = useState(false);
  const [showStoryDropdown, setShowStoryDropdown] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const navigate = useNavigate();

  const toggleStoryWorldDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowStoryWorldDropdown(!showStoryWorldDropdown);
    setShowStoryDropdown(false);
  };

  const toggleStoryDropdown = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!showStoryDropdown && activeStoryWorld) {
      // Fetch stories for this story world when opening the dropdown
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
      }
    }
    
    setShowStoryDropdown(!showStoryDropdown);
    setShowStoryWorldDropdown(false);
  };

  const handleStoryWorldSelect = async (storyWorld: StoryWorld) => {
    setActiveStoryWorld(storyWorld);
    setShowStoryWorldDropdown(false);
    
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
  };

  const handleStorySelect = (story: Story) => {
    setActiveStory(story);
    setShowStoryDropdown(false);
    navigate(`/stories/${story.id}`);
  };

  const dropdownButtonStyle = {
    backgroundColor: '#2d2e33',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    border: 'none',
    minWidth: '180px'
  };

  const dropdownItemStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer'
  };

  const dropdownContainerStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    width: '100%',
    backgroundColor: '#2d2e33',
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left Side - Navigation Selectors */}
      <div className="flex items-center space-x-4">
        {/* Story World Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={toggleStoryWorldDropdown} 
            style={dropdownButtonStyle}
            disabled={loading}
          >
            <span>{loading ? 'Loading...' : (activeStoryWorld?.name || 'Select a Story World')}</span>
            <span className="ml-2">{showStoryWorldDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showStoryWorldDropdown && (
            <div style={dropdownContainerStyle}>
              {storyWorlds.map(storyWorld => (
                <button
                  key={storyWorld.id}
                  onClick={() => handleStoryWorldSelect(storyWorld)}
                  style={{
                    ...dropdownItemStyle,
                    backgroundColor: activeStoryWorld?.id === storyWorld.id ? '#1f2024' : 'transparent'
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
              <button
                onClick={() => {
                  setActiveStoryWorld(null);
                  setActiveStory(null);
                  setActiveSeries(null);
                  setShowStoryWorldDropdown(false);
                  navigate('/dashboard');
                }}
                style={{
                  ...dropdownItemStyle,
                  borderTop: '1px solid #3a3b41',
                  color: '#e5e5e5'
                }}
              >
                None
              </button>
            </div>
          )}
        </div>

        {/* Story Selector - Only show if we have an active Story World */}
        {activeStoryWorld && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={toggleStoryDropdown} 
              style={dropdownButtonStyle}
              disabled={loading}
            >
              <span>{loading ? 'Loading...' : (activeStory?.title || activeStory?.name || 'Select a Story')}</span>
              <span className="ml-2">{showStoryDropdown ? '▲' : '▼'}</span>
            </button>
            
            {showStoryDropdown && (
              <div style={dropdownContainerStyle}>
                {stories.length > 0 ? (
                  stories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => handleStorySelect(story)}
                      style={{
                        ...dropdownItemStyle,
                        backgroundColor: activeStory?.id === story.id ? '#1f2024' : 'transparent'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2024' }}
                      onMouseOut={(e) => { 
                        if (activeStory?.id !== story.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {story.title || story.name}
                    </button>
                  ))
                ) : (
                  <div style={{ ...dropdownItemStyle, color: '#999' }}>
                    No stories in this Story World
                  </div>
                )}
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
        )}
      </div>
      
      {/* Right Side - User Controls */}
      <div className="flex items-center">
        <button style={{ 
          width: '2rem', 
          height: '2rem', 
          borderRadius: '9999px', 
          backgroundColor: '#2d2e33', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer' 
        }}>
          👤
        </button>
      </div>
    </div>
  );
};