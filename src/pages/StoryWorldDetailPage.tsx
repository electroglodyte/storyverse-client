import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { StoryWorld, Story, Series } from '../supabase-tables';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaBook, FaFilm, FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const StoryWorldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [storyWorld, setStoryWorld] = useState<StoryWorld | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'series'>('stories');
  const [isNewStoryWorld, setIsNewStoryWorld] = useState(!id);
  const [formData, setFormData] = useState<Partial<StoryWorld>>({
    name: '',
    description: '',
    tags: []
  });

  // For new story world creation
  useEffect(() => {
    if (!id) {
      setIsNewStoryWorld(true);
      setLoading(false);
    }
  }, [id]);

  // For existing story world
  useEffect(() => {
    const fetchStoryWorld = async () => {
      if (!id || isNewStoryWorld) return;

      try {
        setLoading(true);
        
        // Fetch the story world
        const { data: storyWorldData, error: storyWorldError } = await supabase
          .from('storyworlds')
          .select('*')
          .eq('id', id)
          .single();

        if (storyWorldError) throw storyWorldError;
        setStoryWorld(storyWorldData);

        // Try to fetch stories with both storyworld_id and story_world_id fields
        // This handles the case where the database might be using either field
        const storiesPromises = [
          // First try with storyworld_id
          supabase
            .from('stories')
            .select('*')
            .eq('storyworld_id', id)
            .order('name', { ascending: true }),
          
          // Also try with story_world_id
          supabase
            .from('stories')
            .select('*')
            .eq('story_world_id', id)
            .order('name', { ascending: true })
        ];
        
        const storiesResults = await Promise.all(storiesPromises);
        
        // Combine unique results from both queries
        const storiesData1 = storiesResults[0].data || [];
        const storiesData2 = storiesResults[1].data || [];
        
        // Combine and deduplicate stories (in case both queries return the same stories)
        const allStoriesData = [...storiesData1];
        
        // Add stories from second query that aren't already included
        for (const story of storiesData2) {
          if (!allStoriesData.some(s => s.id === story.id)) {
            allStoriesData.push(story);
          }
        }
        
        setStories(allStoriesData);

        // Try to fetch series with both storyworld_id and story_world_id fields
        // This handles the case where the database might be using either field
        const seriesPromises = [
          // First try with storyworld_id
          supabase
            .from('series')
            .select('*')
            .eq('storyworld_id', id)
            .order('name', { ascending: true }),
          
          // Also try with story_world_id
          supabase
            .from('series')
            .select('*')
            .eq('story_world_id', id)
            .order('name', { ascending: true })
        ];
        
        const seriesResults = await Promise.all(seriesPromises);
        
        // Combine unique results from both queries
        const seriesData1 = seriesResults[0].data || [];
        const seriesData2 = seriesResults[1].data || [];
        
        // Combine and deduplicate series (in case both queries return the same series)
        const allSeriesData = [...seriesData1];
        
        // Add series from second query that aren't already included
        for (const series of seriesData2) {
          if (!allSeriesData.some(s => s.id === series.id)) {
            allSeriesData.push(series);
          }
        }
        
        setSeries(allSeriesData);

      } catch (error: any) {
        toast.error(`Error loading story world: ${error.message}`);
        console.error('Error loading story world:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryWorld();
  }, [id, isNewStoryWorld]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create new story world
  const handleCreateStoryWorld = async () => {
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Story world name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the new story world
      const { data, error } = await supabase
        .from('story_worlds')
        .insert([
          {
            name: formData.name,
            description: formData.description || '',
            tags: formData.tags || []
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating story world:', error);
        toast.error('Failed to create story world');
        setLoading(false);
        return;
      }
      
      toast.success('Story world created successfully!');
      
      // Navigate to the new story world detail page
      navigate(`/story-worlds/${data.id}`);
    } catch (err: any) {
      console.error('Error creating story world:', err);
      toast.error('Failed to create story world');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!storyWorld) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${storyWorld.name}"? This will also delete all stories and series associated with this story world. This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const { error } = await supabase
          .from('storyworlds')
          .delete()
          .eq('id', storyWorld.id);

        if (error) throw error;

        toast.success('Story world deleted successfully');
        navigate('/story-worlds');
      } catch (error: any) {
        toast.error(`Error deleting story world: ${error.message}`);
        console.error('Error deleting story world:', error);
      }
    }
  };

  const handleCancelCreate = () => {
    // Go back to story worlds list
    navigate('/story-worlds');
  };

  if (loading && !isNewStoryWorld) {
    return <LoadingSpinner />;
  }

  // Form for creating a new story world
  if (isNewStoryWorld) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center mb-6 text-sm">
          <Link 
            to="/story-worlds"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <FaArrowLeft className="mr-1" />
            Back to Story Worlds
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Create New Story World</h1>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Story World Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Enter story world name"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter story world description"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancelCreate}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            
            <button
              onClick={handleCreateStoryWorld}
              disabled={loading || !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {loading ? 'Creating...' : 'Create Story World'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!storyWorld && !isNewStoryWorld) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Story World Not Found</h2>
          <p className="text-gray-600 mb-4">
            The story world you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            to="/story-worlds"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" /> Back to Story Worlds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/story-worlds"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Story Worlds
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-4">{storyWorld?.name}</h1>
            {storyWorld?.description && (
              <p className="text-gray-700 mb-4">{storyWorld.description}</p>
            )}
            {storyWorld?.tags && storyWorld.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {storyWorld.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">
              Created: {storyWorld && new Date(storyWorld.created_at || '').toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/story-worlds/${storyWorld?.id}/edit`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <FaEdit className="mr-1" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center text-red-600 hover:text-red-800"
            >
              <FaTrashAlt className="mr-1" /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium flex items-center ${
              activeTab === 'stories'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('stories')}
          >
            <FaBook className="mr-2" /> Stories ({stories.length})
          </button>
          <button
            className={`py-2 px-4 font-medium flex items-center ${
              activeTab === 'series'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('series')}
          >
            <FaFilm className="mr-2" /> Series ({series.length})
          </button>
        </div>
      </div>

      {activeTab === 'stories' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stories</h2>
            <Link
              to={`/stories/new?storyWorldId=${storyWorld?.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
            >
              <FaPlus className="mr-1" />
              New Story
            </Link>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FaBook size={32} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No Stories Yet</h3>
              <p className="text-gray-600 mb-4">Create your first story in this story world.</p>
              <Link
                to={`/stories/new?storyWorldId=${storyWorld?.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md inline-flex items-center text-sm"
              >
                <FaPlus className="mr-1" />
                Create Story
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  to={`/stories/${story.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <h3 className="font-medium text-lg mb-2">{story.name}</h3>
                  {story.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{story.description}</p>
                  )}
                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {story.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {story.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">+{story.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'series' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Series</h2>
            <Link
              to={`/series/new?storyWorldId=${storyWorld?.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
            >
              <FaPlus className="mr-1" />
              New Series
            </Link>
          </div>

          {series.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FaFilm size={32} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No Series Yet</h3>
              <p className="text-gray-600 mb-4">Create your first series in this story world.</p>
              <Link
                to={`/series/new?storyWorldId=${storyWorld?.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md inline-flex items-center text-sm"
              >
                <FaPlus className="mr-1" />
                Create Series
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {series.map((seriesItem) => (
                <Link
                  key={seriesItem.id}
                  to={`/series/${seriesItem.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <h3 className="font-medium text-lg mb-2">{seriesItem.name}</h3>
                  {seriesItem.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {seriesItem.description}
                    </p>
                  )}
                  {seriesItem.sequence_type && (
                    <div className="text-sm text-gray-500 mt-2">
                      Order: {seriesItem.sequence_type}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StoryWorldDetailPage;