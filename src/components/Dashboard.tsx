import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaBook, FaListUl, FaStream, FaCog, FaChartLine, FaPencilAlt } from 'react-icons/fa';
import AdminUtils from './admin/AdminUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import WritingDashboard from './dashboard/WritingDashboard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    storyWorlds: 0,
    series: 0,
    stories: 0,
    recentStories: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FaChartLine className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="writing" className="flex items-center gap-2">
              <FaPencilAlt className="h-4 w-4" />
              <span>Writing Progress</span>
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'overview' && (
            <button 
              className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              onClick={toggleAdminPanel}
            >
              <FaCog className="text-gray-600" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
        
        <TabsContent value="overview">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/story-worlds')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Story Worlds</h3>
                  <p className="text-3xl font-bold mt-2">{loading ? '-' : stats.storyWorlds}</p>
                </div>
                <div className="text-3xl text-blue-500">
                  <FaBook />
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/series')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Series</h3>
                  <p className="text-3xl font-bold mt-2">{loading ? '-' : stats.series}</p>
                </div>
                <div className="text-3xl text-green-500">
                  <FaStream />
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/stories')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Stories</h3>
                  <p className="text-3xl font-bold mt-2">{loading ? '-' : stats.stories}</p>
                </div>
                <div className="text-3xl text-purple-500">
                  <FaListUl />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Stories */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
            
            {loading ? (
              <div className="space-y-3 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : stats.recentStories.length > 0 ? (
              <div className="space-y-2">
                {stats.recentStories.map((story) => (
                  <div 
                    key={story.id} 
                    className="p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/stories/${story.id}`)}
                  >
                    <div className="font-medium">{story.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {story.status} • {new Date(story.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-4">No stories created yet.</p>
            )}
          </div>

          {/* Admin Panel */}
          {showAdminPanel && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Administration</h2>
              <AdminUtils />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="writing">
          <WritingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;