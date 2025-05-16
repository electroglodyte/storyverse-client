// src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import { AppNav } from './AppNav';
import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/services/supabase';
import type { StoryWorld, Story, Series } from '@/types/database';

export default function Layout() {
  const [activeStoryWorld, setActiveStoryWorld] = useState<StoryWorld | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch the storyWorlds on component mount
  useEffect(() => {
    const fetchStoryWorlds = async () => {
      setLoading(true);
      try {
        // Get story worlds
        const { data, error } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching story worlds:', error);
          // Set some sample data for testing the UI
          const sampleData: StoryWorld[] = [
            { 
              id: '1', 
              name: 'The Irish Mystery', 
              description: 'A mystery set in Ireland',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            { 
              id: '2', 
              name: 'Space Adventure', 
              description: 'A sci-fi adventure in space',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            { 
              id: '3', 
              name: 'Wild West Tales', 
              description: 'Stories from the wild west',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setStoryWorlds(sampleData);
          setActiveStoryWorld(sampleData[0]);
        } else {
          console.log('Successfully fetched story worlds:', data);
          setStoryWorlds(data || []);

          // Set the first storyWorld as active if none is selected
          if (data && data.length > 0 && !activeStoryWorld) {
            setActiveStoryWorld(data[0]);

            // Fetch stories from this storyworld
            try {
              const storyWorldId = data[0].id;
              const { data: storiesData } = await supabase
                .from('stories')
                .select('*')
                .eq('story_world_id', storyWorldId)
                .order('title', { ascending: true });

              if (storiesData && storiesData.length > 0) {
                setActiveStory(storiesData[0]);
              }
            } catch (storiesError) {
              console.error('Error fetching stories:', storiesError);
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching story worlds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryWorlds();
  }, []);
  
  // Direct styling with !important to override any conflicts
  const layoutStyles = `
    .layout-container {
      display: flex !important;
      flex-direction: row !important;
      height: 100vh !important;
      width: 100% !important;
      overflow: hidden !important;
    }
    
    .sidebar {
      width: 260px !important;
      min-width: 260px !important;
      height: 100vh !important;
      background-color: #1f2024 !important;
      color: white !important;
      overflow-y: auto !important;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
      z-index: 10 !important;
    }
    
    .main-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      min-width: 0 !important;
      height: 100vh !important;
      overflow: hidden !important;
    }
    
    .header {
      background-color: #1f2024 !important;
      color: white !important;
      padding: 1rem !important;
      border-bottom: 1px solid #3a3b41 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    
    .content-area {
      flex: 1 !important;
      background-color: #f8f5f0 !important;
      overflow-y: auto !important;
      padding: 1.5rem !important;
    }
    
    @media (max-width: 768px) {
      .layout-container {
        flex-direction: column !important;
      }
      
      .sidebar {
        width: 100% !important;
        height: auto !important;
      }
    }
  `;
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: layoutStyles }} />
      <div className="layout-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <SideNav 
            activeStoryWorld={activeStoryWorld} 
            activeStory={activeStory} 
            activeSeries={activeSeries}
            storyWorlds={storyWorlds}
            setActiveStoryWorld={setActiveStoryWorld}
            setActiveStory={setActiveStory}
            setActiveSeries={setActiveSeries}
            loading={loading}
          />
        </aside>
        
        {/* Main Content Area */}
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <AppNav 
              activeStoryWorld={activeStoryWorld} 
              activeStory={activeStory} 
              activeSeries={activeSeries}
              storyWorlds={storyWorlds}
              setActiveStoryWorld={setActiveStoryWorld}
              setActiveStory={setActiveStory}
              setActiveSeries={setActiveSeries}
              loading={loading}
            />
          </header>
          
          {/* Content Area */}
          <main className="content-area">
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}