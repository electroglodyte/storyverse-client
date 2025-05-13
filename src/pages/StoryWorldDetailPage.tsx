import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { StoryWorld, Story, Series } from '../supabase-tables';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaBook, FaFilm } from 'react-icons/fa';
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

  useEffect(() => {
    const fetchStoryWorld = async () => {
      if (!id) return;

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

        // Fetch the stories in this storyworld
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('*')
          .eq('storyworld_id', id)
          .order('name', { ascending: true });

        if (storiesError) throw storiesError;
        setStories(storiesData || []);

        // Fetch the series in this storyworld
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('*')
          .eq('storyworld_id', id)
          .order('name', { ascending: true });

        if (seriesError) throw seriesError;
        setSeries(seriesData || []);

      } catch (error: any) {
        toast.error(`Error loading story world: ${error.message}`);
        console.error('Error loading story world:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryWorld();
  }, [id]);

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
        navigate('/storyworlds');
      } catch (error: any) {
        toast.error(`Error deleting story world: ${error.message}`);
        console.error('Error deleting story world:', error);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!storyWorld) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Story World Not Found</h2>
          <p className="text-gray-600 mb-4">
            The story world you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            to="/storyworlds"
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
        to="/storyworlds"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Story Worlds
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-4">{storyWorld.name}</h1>
            {storyWorld.description && (
              <p className="text-gray-700 mb-4">{storyWorld.description}</p>
            )}
            {storyWorld.tags && storyWorld.tags.length > 0 && (
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
              Created: {new Date(storyWorld.created_at || '').toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/storyworlds/${storyWorld.id}/edit`}
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
              to={`/stories/new?storyWorldId=${storyWorld.id}`}
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
                to={`/stories/new?storyWorldId=${storyWorld.id}`}
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
              to={`/series/new?storyWorldId=${storyWorld.id}`}
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
                to={`/series/new?storyWorldId=${storyWorld.id}`}
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
