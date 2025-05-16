import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaBook, FaListUl, FaStream, FaCog } from 'react-icons/fa';
import AdminUtils from './admin/AdminUtils';

const Dashboard = () => {
  const [stats, setStats] = useState({
    storyWorlds: 0,
    series: 0,
    stories: 0,
    recentStories: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch counts
        const [worldsResponse, seriesResponse, storiesResponse, recentResponse] = await Promise.all([
          supabase.from('story_worlds').select('id', { count: 'exact', head: true }),
          supabase.from('series').select('id', { count: 'exact', head: true }),
          supabase.from('stories').select('id', { count: 'exact', head: true }),
          supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        setStats({
          storyWorlds: worldsResponse.count || 0,
          series: seriesResponse.count || 0,
          stories: storiesResponse.count || 0,
          recentStories: recentResponse.data || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="stats-grid">
        <div 
          className="stat-card stat-card-story-worlds"
          onClick={() => navigate('/story-worlds')}
        >
          <div className="stat-info">
            <h3>Story Worlds</h3>
            <p>{loading ? '-' : stats.storyWorlds}</p>
          </div>
          <div className="stat-icon icon-story-worlds">
            <FaBook />
          </div>
        </div>
        
        <div 
          className="stat-card stat-card-series"
          onClick={() => navigate('/series')}
        >
          <div className="stat-info">
            <h3>Series</h3>
            <p>{loading ? '-' : stats.series}</p>
          </div>
          <div className="stat-icon icon-series">
            <FaStream />
          </div>
        </div>
        
        <div 
          className="stat-card stat-card-stories"
          onClick={() => navigate('/stories')}
        >
          <div className="stat-info">
            <h3>Stories</h3>
            <p>{loading ? '-' : stats.stories}</p>
          </div>
          <div className="stat-icon icon-stories">
            <FaListUl />
          </div>
        </div>
      </div>

      {/* Recent Stories */}
      <div className="card mt-8">
        <h2 className="section-title">Recent Stories</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : stats.recentStories.length > 0 ? (
          <div className="recent-list">
            {stats.recentStories.map((story) => (
              <div 
                key={story.id} 
                className="recent-item"
                onClick={() => navigate(`/stories/${story.id}`)}
              >
                <div className="recent-item-title">{story.title}</div>
                <div className="recent-item-meta">
                  {story.status} • {new Date(story.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-4">No stories created yet.</p>
        )}
      </div>

      {/* Admin Panel Toggle Button */}
      <div className="mt-8 flex justify-end">
        <button 
          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          onClick={toggleAdminPanel}
        >
          <FaCog className="text-gray-600" />
          <span>Admin Panel</span>
        </button>
      </div>

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="mt-4">
          <AdminUtils />
        </div>
      )}
    </div>
  );
};

export default Dashboard;