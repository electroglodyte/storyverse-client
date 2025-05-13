// /src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useSamples } from '../hooks/useSamples';

const HomePage: React.FC = () => {
  const { activeProject, projects, loading: projectsLoading } = useProject();
  const { samples, loading: samplesLoading } = useSamples({ 
    projectId: activeProject?.id,
    // Limit implicitly since we're just displaying the latest ones
  });
  
  const [stats, setStats] = useState({
    totalSamples: 0,
    totalProjects: 0,
    analyzedSamples: 0,
    totalWordCount: 0
  });

  // Get sample stats
  useEffect(() => {
    const calculateStats = async () => {
      try {
        // Count for analyzed samples could come from a hook or context
        setStats({
          totalSamples: samples.length,
          totalProjects: projects.length,
          analyzedSamples: 0, // This would need a separate query
          totalWordCount: samples.reduce((sum, sample) => sum + (sample.word_count || 0), 0)
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };
    
    if (!samplesLoading && !projectsLoading) {
      calculateStats();
    }
  }, [samples, projects, samplesLoading, projectsLoading]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Welcome to StoryVerse</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-900 text-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Projects</h3>
          <p className="text-3xl font-bold">{stats.totalProjects}</p>
        </div>
        <div className="bg-green-900 text-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Writing Samples</h3>
          <p className="text-3xl font-bold">{stats.totalSamples}</p>
        </div>
        <div className="bg-purple-900 text-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Analyzed Samples</h3>
          <p className="text-3xl font-bold">{stats.analyzedSamples}</p>
        </div>
        <div className="bg-yellow-900 text-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Words</h3>
          <p className="text-3xl font-bold">{stats.totalWordCount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Active Project */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white">Active Project</h2>
            </div>
            
            <div className="p-4">
              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activeProject ? (
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{activeProject.name}</h3>
                  {activeProject.description && (
                    <p className="text-gray-300 mb-4">{activeProject.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeProject.genre && activeProject.genre.map((g) => (
                      <span key={g} className="px-2 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                        {g}
                      </span>
                    ))}
                    
                    {activeProject.tags && activeProject.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mb-4">
                    <span className="mr-4">
                      Created: {formatDate(activeProject.created_at)}
                    </span>
                    <span>
                      Updated: {formatDate(activeProject.updated_at)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link 
                      to={`/projects/${activeProject.id}`}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Project
                    </Link>
                    <Link 
                      to="/samples/new"
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Sample
                    </Link>
                  </div>
                </div>
              ) : projects.length > 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4">No active project selected</p>
                  <Link 
                    to="/projects"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select a Project
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4">No projects created yet</p>
                  <Link 
                    to="/projects/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Your First Project
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Samples */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-gray-700 px-4 py-3 border-b border-gray-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Recent Samples</h2>
              <Link 
                to="/samples" 
                className="text-sm text-blue-400 hover:underline"
              >
                View All
              </Link>
            </div>
            
            <div className="divide-y divide-gray-700">
              {samplesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : samples.length > 0 ? (
                samples.slice(0, 5).map((sample) => (
                  <div key={sample.id} className="p-4 hover:bg-gray-700">
                    <Link to={`/samples/${sample.id}`} className="block">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-white">{sample.title}</h3>
                        <span className="text-xs text-gray-400">
                          {formatDate(sample.updated_at)}
                        </span>
                      </div>
                      
                      {sample.author && (
                        <p className="text-sm text-gray-400 mt-1">by {sample.author}</p>
                      )}
                      
                      <p className="text-gray-300 text-sm line-clamp-2 mt-2">
                        {sample.excerpt || sample.content.substring(0, 150) + '...'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {sample.sample_type && (
                            <span className="px-2 py-0.5 bg-blue-900 text-blue-200 rounded-full text-xs">
                              {sample.sample_type}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {sample.word_count} words
                          </span>
                        </div>
                        
                        <div className="flex space-x-1">
                          {sample.tags && sample.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                          {sample.tags && sample.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                              +{sample.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No writing samples yet</p>
                  <Link 
                    to="/samples/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Your First Sample
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/projects" 
          className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow text-center transition-colors"
        >
          <div className="text-3xl mb-2">📁</div>
          <h3 className="text-lg font-semibold text-white">Projects</h3>
          <p className="text-gray-400 text-sm">Manage your writing projects</p>
        </Link>
        
        <Link 
          to="/samples" 
          className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow text-center transition-colors"
        >
          <div className="text-3xl mb-2">📝</div>
          <h3 className="text-lg font-semibold text-white">Writing Samples</h3>
          <p className="text-gray-400 text-sm">Analyze and manage your samples</p>
        </Link>
        
        <Link 
          to="/samples/new" 
          className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow text-center transition-colors"
        >
          <div className="text-3xl mb-2">➕</div>
          <h3 className="text-lg font-semibold text-white">Add Sample</h3>
          <p className="text-gray-400 text-sm">Add a new writing sample</p>
        </Link>
        
        <Link 
          to="/projects/new" 
          className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow text-center transition-colors"
        >
          <div className="text-3xl mb-2">🆕</div>
          <h3 className="text-lg font-semibold text-white">New Project</h3>
          <p className="text-gray-400 text-sm">Create a new writing project</p>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;