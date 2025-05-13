import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaBook, FaListUl, FaStream } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    storyWorlds: 0,
    series: 0,
    stories: 0,
    recentStories: [],
  });
  const [loading, setLoading] = useState(true);
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

  const StatCard = ({ title, count, icon, color, onClick }) => (
    <div 
      className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color} cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className="text-3xl font-bold mt-2">{loading ? '-' : count}</p>
        </div>
        <div className={`text-3xl ${color.replace('border', 'text')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">StoryVerse Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Story Worlds" 
          count={stats.storyWorlds} 
          icon={<FaBook />} 
          color="border-blue-500" 
          onClick={() => navigate('/story-worlds')}
        />
        <StatCard 
          title="Series" 
          count={stats.series} 
          icon={<FaStream />} 
          color="border-green-500" 
          onClick={() => navigate('/series')}
        />
        <StatCard 
          title="Stories" 
          count={stats.stories} 
          icon={<FaListUl />} 
          color="border-purple-500" 
          onClick={() => navigate('/stories')}
        />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : stats.recentStories.length > 0 ? (
          <div className="divide-y">
            {stats.recentStories.map((story) => (
              <div 
                key={story.id} 
                className="py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/stories/${story.id}`)}
              >
                <div className="font-medium">{story.title}</div>
                <div className="text-sm text-gray-500">
                  {story.status} • {new Date(story.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No stories created yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;