import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Series, Story, StoryWorld } from '../supabase-tables';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaArrowUp, FaArrowDown, FaBook } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface SeriesStoryWithDetails {
  id: string;
  series_id: string;
  story_id: string;
  sequence_number: number;
  story: Story;
}

const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [storyWorld, setStoryWorld] = useState<StoryWorld | null>(null);
  const [seriesStories, setSeriesStories] = useState<SeriesStoryWithDetails[]>([]);
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeriesData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Fetch the series
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('*')
          .eq('id', id)
          .single();

        if (seriesError) throw seriesError;
        setSeries(seriesData);

        if (seriesData.storyworld_id) {
          // Fetch the story world
          const { data: storyWorldData, error: storyWorldError } = await supabase
            .from('storyworlds')
            .select('*')
            .eq('id', seriesData.storyworld_id)
            .single();

          if (storyWorldError) throw storyWorldError;
          setStoryWorld(storyWorldData);

          // Fetch stories in this series
          const { data: seriesStoriesData, error: seriesStoriesError } = await supabase
            .from('series_stories')
            .select(`
              id,
              series_id,
              story_id,
              sequence_number,
              story:stories(*) 
            `)
            .eq('series_id', id)
            .order('sequence_number', { ascending: true });

          if (seriesStoriesError) throw seriesStoriesError;
          
          // Type assertion to tell TypeScript this is indeed the right format
          const seriesStoriesWithDetails = (seriesStoriesData || []) as unknown as SeriesStoryWithDetails[];
          setSeriesStories(seriesStoriesWithDetails);

          // Fetch available stories in the same story world that are not already in this series
          const { data: allStoriesData, error: allStoriesError } = await supabase
            .from('stories')
            .select('*')
            .eq('storyworld_id', seriesData.storyworld_id);

          if (allStoriesError) throw allStoriesError;
          
          // Filter out stories that are already in the series
          const storyIdsInSeries = seriesStoriesData?.map(item => item.story_id) || [];
          const storiesNotInSeries = allStoriesData?.filter(
            story => !storyIdsInSeries.includes(story.id)
          ) || [];
          
          setAvailableStories(storiesNotInSeries);
        }

      } catch (error: any) {
        toast.error(`Error loading series: ${error.message}`);
        console.error('Error loading series:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [id]);

  const handleDelete = async () => {
    if (!series) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${series.name}"? This will not delete the stories in the series, only the series itself. This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const { error } = await supabase
          .from('series')
          .delete()
          .eq('id', series.id);

        if (error) throw error;

        toast.success('Series deleted successfully');
        navigate(series.storyworld_id ? `/storyworlds/${series.storyworld_id}` : '/storyworlds');
      } catch (error: any) {
        toast.error(`Error deleting series: ${error.message}`);
        console.error('Error deleting series:', error);
      }
    }
  };

  const handleAddStoryToSeries = async (storyId: string) => {
    if (!series) return;
    
    try {
      // Find the highest sequence number in the current series
      const highestSequence = seriesStories.length > 0
        ? Math.max(...seriesStories.map(item => item.sequence_number))
        : 0;
      
      // Insert the story into the series with the next sequence number
      const { data, error } = await supabase
        .from('series_stories')
        .insert([
          {
            series_id: series.id,
            story_id: storyId,
            sequence_number: highestSequence + 1
          }
        ])
        .select(`
          id,
          series_id,
          story_id,
          sequence_number,
          story:stories(*) 
        `)
        .single();

      if (error) throw error;

      // Type assertion to tell TypeScript this is indeed the right format
      const newSeriesStory = data as unknown as SeriesStoryWithDetails;
      
      // Update the UI to show the newly added story
      setSeriesStories([...seriesStories, newSeriesStory]);
      
      // Remove the story from the available stories list
      setAvailableStories(availableStories.filter(story => story.id !== storyId));
      
      toast.success('Story added to series');
    } catch (error: any) {
      toast.error(`Error adding story to series: ${error.message}`);
      console.error('Error adding story to series:', error);
    }
  };

  const handleRemoveStoryFromSeries = async (seriesStoryId: string) => {
    if (!series) return;
    
    try {
      // Find the series story item to get the story information before deletion
      const seriesStoryToRemove = seriesStories.find(item => item.id === seriesStoryId);
      if (!seriesStoryToRemove) return;

      // Delete the series story relationship
      const { error } = await supabase
        .from('series_stories')
        .delete()
        .eq('id', seriesStoryId);

      if (error) throw error;

      // Update the UI to remove the story from the series
      setSeriesStories(seriesStories.filter(item => item.id !== seriesStoryId));
      
      // Add the story back to the available stories list
      setAvailableStories([...availableStories, seriesStoryToRemove.story]);
      
      toast.success('Story removed from series');
    } catch (error: any) {
      toast.error(`Error removing story from series: ${error.message}`);
      console.error('Error removing story from series:', error);
    }
  };

  const handleMoveStory = async (seriesStoryId: string, direction: 'up' | 'down') => {
    if (!series) return;
    
    try {
      // Find the current index of the story in the series
      const currentIndex = seriesStories.findIndex(item => item.id === seriesStoryId);
      if (currentIndex === -1) return;
      
      const currentStory = seriesStories[currentIndex];
      
      // Determine the index to swap with
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Check if the swap index is valid
      if (swapIndex < 0 || swapIndex >= seriesStories.length) return;
      
      const swapStory = seriesStories[swapIndex];
      
      // Update the sequence numbers in the database
      const updates = [
        {
          id: currentStory.id,
          sequence_number: swapStory.sequence_number
        },
        {
          id: swapStory.id,
          sequence_number: currentStory.sequence_number
        }
      ];
      
      // Update the sequence numbers
      for (const update of updates) {
        const { error } = await supabase
          .from('series_stories')
          .update({ sequence_number: update.sequence_number })
          .eq('id', update.id);
          
        if (error) throw error;
      }
      
      // Update the UI
      const updatedSeriesStories = [...seriesStories];
      updatedSeriesStories[currentIndex] = {
        ...currentStory,
        sequence_number: swapStory.sequence_number
      };
      updatedSeriesStories[swapIndex] = {
        ...swapStory,
        sequence_number: currentStory.sequence_number
      };
      
      // Sort by sequence number
      updatedSeriesStories.sort((a, b) => a.sequence_number - b.sequence_number);
      
      setSeriesStories(updatedSeriesStories);
      
      toast.success(`Story moved ${direction}`);
    } catch (error: any) {
      toast.error(`Error moving story: ${error.message}`);
      console.error('Error moving story:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Series Not Found</h2>
          <p className="text-gray-600 mb-4">
            The series you're looking for doesn't exist or has been deleted.
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
        to={series.storyworld_id ? `/storyworlds/${series.storyworld_id}` : '/storyworlds'}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="mr-2" /> 
        Back to {storyWorld ? storyWorld.name : 'Story Worlds'}
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-4">{series.name}</h1>
            {series.description && (
              <p className="text-gray-700 mb-4">{series.description}</p>
            )}
            <p className="text-sm text-gray-500 mb-2">
              Order: {series.sequence_type || 'Chronological'}
            </p>
            <p className="text-sm text-gray-500">
              Created: {new Date(series.created_at || '').toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/series/${series.id}/edit`}
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stories in the series */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Stories in this Series</h2>
            
            {seriesStories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <FaBook size={32} className="mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium mb-1">No Stories in this Series</h3>
                <p className="text-gray-600 mb-4">Add stories from the panel on the right.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {seriesStories.map((seriesStory, index) => (
                  <li key={seriesStory.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-gray-500 font-medium mr-3">{index + 1}</span>
                        <div>
                          <Link
                            to={`/stories/${seriesStory.story_id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800"
                          >
                            {seriesStory.story.name}
                          </Link>
                          {seriesStory.story.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {seriesStory.story.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMoveStory(seriesStory.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded-full ${
                            index === 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Move up"
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          onClick={() => handleMoveStory(seriesStory.id, 'down')}
                          disabled={index === seriesStories.length - 1}
                          className={`p-1 rounded-full ${
                            index === seriesStories.length - 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Move down"
                        >
                          <FaArrowDown />
                        </button>
                        <button
                          onClick={() => handleRemoveStoryFromSeries(seriesStory.id)}
                          className="p-1 rounded-full text-red-600 hover:bg-red-50"
                          title="Remove from series"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Available stories to add */}
        <div className="md:col-span-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Stories</h2>
            
            {availableStories.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  All stories from this story world are already in the series.
                </p>
                <div className="mt-4">
                  <Link
                    to={`/stories/new?storyWorldId=${series.storyworld_id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FaPlus className="mr-1" /> Create New Story
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {availableStories.map((story) => (
                  <li key={story.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{story.name}</span>
                      </div>
                      <button
                        onClick={() => handleAddStoryToSeries(story.id)}
                        className="p-1 rounded-full text-green-600 hover:bg-green-50"
                        title="Add to series"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6">
              <Link
                to={`/stories/new?storyWorldId=${series.storyworld_id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <FaPlus className="inline mr-2" />
                Create New Story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailPage;