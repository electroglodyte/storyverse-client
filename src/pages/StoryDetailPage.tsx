// /src/pages/StoryDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaBook, FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Story, StoryWorld, Series, WritingSample } from '../supabase-tables';

interface ExtendedStory extends Story {
  storyworld?: StoryWorld;
  series?: Series;
}

interface SeriesOption {
  id: string;
  name: string;
}

const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<ExtendedStory | null>(null);
  const [samples, setSamples] = useState<WritingSample[]>([])
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(id ? false : true); // Automatically start in edit mode for new stories
  const [isEditingSeries, setIsEditingSeries] = useState(false);
  const [formData, setFormData] = useState<Partial<Story>>({
    name: '',
    description: '',
    status: 'active',
    tags: [],
    genre: []
  });
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isNewStory, setIsNewStory] = useState(!id);

  // Get query parameters (for new story creation)
  useEffect(() => {
    if (!id) {
      setIsNewStory(true);
      
      // Check for storyWorldId in query params
      const queryParams = new URLSearchParams(window.location.search);
      const storyWorldId = queryParams.get('storyWorldId');
      
      if (storyWorldId) {
        setFormData(prev => ({ ...prev, story_world_id: storyWorldId }));
        
        // Fetch the story world details
        const fetchStoryWorld = async () => {
          try {
            const { data, error } = await supabase
              .from('story_worlds')
              .select('*')
              .eq('id', storyWorldId)
              .single();
              
            if (error) throw error;
            
            if (data) {
              // Set the form data with story world info
              setFormData(prev => ({ 
                ...prev, 
                story_world_id: storyWorldId,
              }));
            }
            
            // Fetch available series options for this story world
            const { data: seriesData, error: seriesError } = await supabase
              .from('series')
              .select('id, name')
              .eq('storyworld_id', storyWorldId)
              .order('name', { ascending: true });
              
            if (seriesError) throw seriesError;
            
            setSeriesOptions(seriesData || []);
          } catch (err) {
            console.error('Error fetching story world:', err);
          }
        };
        
        fetchStoryWorld();
      }
      
      setLoading(false);
    }
  }, [id]);

  // Fetch story details and associated samples
  useEffect(() => {
    const fetchStoryDetails = async () => {
      if (!id) {
        return; // New story creation is handled by the previous useEffect
      }
      
      try {
        setLoading(true);
        
        // First check if story exists
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();
        
        if (storyError) {
          console.error('Error fetching story:', storyError);
          
          if (storyError.code === 'PGRST116') {
            toast.error('Database error: The "stories" table might not exist yet');
          } else if (storyError.code === '22P02') {
            toast.error('Invalid story ID format');
          } else if (storyError.code === 'PGRST104') {
            toast.error('Story not found');
          } else {
            toast.error(`Failed to load story details: ${storyError.message || 'Unknown error'}`);
          }
          
          setLoading(false);
          return;
        }
        
        if (!storyData) {
          toast.error('Story not found');
          setLoading(false);
          return;
        }
        
        const story: ExtendedStory = storyData;
        setSelectedSeriesId(story.series_id);
        
        // Get the StoryWorld information if available
        if (story.story_world_id) {
          const { data: storyWorldData } = await supabase
            .from('story_worlds')
            .select('*')
            .eq('id', story.story_world_id)
            .single();
            
          if (storyWorldData) {
            story.storyworld = storyWorldData;
          }
        }
        
        // Get the Series information if available
        if (story.series_id) {
          const { data: seriesData } = await supabase
            .from('series')
            .select('*')
            .eq('id', story.series_id)
            .single();
            
          if (seriesData) {
            story.series = seriesData;
          }
        }
        
        // Fetch available series options for this story's storyworld
        if (story.story_world_id) {
          const { data: availableSeriesData } = await supabase
            .from('series')
            .select('id, name')
            .eq('storyworld_id', story.story_world_id)
            .order('name', { ascending: true });
            
          if (availableSeriesData) {
            setSeriesOptions(availableSeriesData);
          }
        }
        
        setStory(story);
        setFormData(story);
        
        // Fetch associated samples
        try {
          const { data: samplesData, error: samplesError } = await supabase
            .from('writing_samples')
            .select('*')
            .eq('story_id', id)
            .order('updated_at', { ascending: false });
          
          if (samplesError) {
            console.error('Error fetching samples:', samplesError);
            // If samples table doesn't exist, just show empty list but don't break the page
            if (samplesError.code === 'PGRST116') {
              console.log('Samples table not found, showing empty list');
              setSamples([]);
            } else {
              throw samplesError;
            }
          } else {
            setSamples(samplesData || []);
          }
        } catch (sampleErr: any) {
          // Handle sample loading error specifically, but don't break story loading
          console.error('Error loading samples:', sampleErr);
          setSamples([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching story details:', err);
        toast.error('Failed to load story details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoryDetails();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle series select change
  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSeriesId(value === "" ? null : value);
  };

  // Save new story
  const handleCreateStory = async () => {
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Story title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the new story
      const { data, error } = await supabase
        .from('stories')
        .insert([
          {
            name: formData.name,
            description: formData.description || '',
            status: 'active',
            story_world_id: formData.story_world_id || null,
            series_id: selectedSeriesId,
            tags: formData.tags || [],
            genre: formData.genre || []
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating story:', error);
        toast.error('Failed to create story');
        setLoading(false);
        return;
      }
      
      toast.success('Story created successfully!');
      
      // Navigate to the new story detail page
      navigate(`/stories/${data.id}`);
    } catch (err: any) {
      console.error('Error creating story:', err);
      toast.error('Failed to create story');
      setLoading(false);
    }
  };

  // Save story changes
  const handleSaveStory = async () => {
    if (isNewStory) {
      handleCreateStory();
      return;
    }
    
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stories')
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating story:', error);
        toast.error('Failed to update story');
        setLoading(false);
        return;
      }
      
      setStory(prevStory => ({
        ...data,
        storyworld: prevStory?.storyworld,
        series: prevStory?.series
      }));
      setIsEditing(false);
      toast.success('Story updated successfully');
    } catch (err: any) {
      console.error('Error updating story:', err);
      toast.error('Failed to update story');
    } finally {
      setLoading(false);
    }
  };

  // Save series assignment
  const handleSaveSeries = async () => {
    if (!id || !story) return;
    
    try {
      setLoading(true);
      
      // First, check if we're changing the series
      if (selectedSeriesId !== story.series_id) {
        // If the story was previously in a series, remove it from the series_stories table
        if (story.series_id) {
          const { error: removeError } = await supabase
            .from('series_stories')
            .delete()
            .eq('story_id', id);
            
          if (removeError) {
            console.warn('Warning: Could not remove story from previous series:', removeError);
          }
        }
        
        // If we're adding the story to a new series, add an entry to the series_stories table
        if (selectedSeriesId) {
          // Find the highest sequence number in the target series
          const { data: seriesStoriesData } = await supabase
            .from('series_stories')
            .select('sequence_number')
            .eq('series_id', selectedSeriesId)
            .order('sequence_number', { ascending: false })
            .limit(1);
            
          const highestSequence = seriesStoriesData && seriesStoriesData.length > 0
            ? seriesStoriesData[0].sequence_number
            : 0;
            
          // Add the story to the series with the next sequence number
          const { error: addError } = await supabase
            .from('series_stories')
            .insert([
              {
                series_id: selectedSeriesId,
                story_id: id,
                sequence_number: highestSequence + 1
              }
            ]);
            
          if (addError) {
            console.error('Error adding story to series:', addError);
            toast.error('Failed to add story to series');
            setLoading(false);
            return;
          }
        }
        
        // Update the story's series_id in the stories table
        const { data, error } = await supabase
          .from('stories')
          .update({
            series_id: selectedSeriesId,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating story series:', error);
          toast.error('Failed to update story series');
          setLoading(false);
          return;
        }
        
        // If the update was successful, fetch the new series data if applicable
        let updatedSeries = null;
        if (selectedSeriesId) {
          const { data: seriesData } = await supabase
            .from('series')
            .select('*')
            .eq('id', selectedSeriesId)
            .single();
            
          if (seriesData) {
            updatedSeries = seriesData;
          }
        }
        
        // Update the story state with the new data
        setStory(prevStory => ({
          ...data,
          storyworld: prevStory?.storyworld,
          series: updatedSeries
        }));
        
        setIsEditingSeries(false);
        toast.success('Story series updated successfully');
      } else {
        // No change in series, just close the editing interface
        setIsEditingSeries(false);
      }
    } catch (err: any) {
      console.error('Error updating story series:', err);
      toast.error('Failed to update story series');
    } finally {
      setLoading(false);
    }
  };

  // Delete story (with confirmation)
  const handleDeleteStory = async () => {
    if (!id || !story) return;
    
    if (!window.confirm(`Are you sure you want to delete "${story.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete associated samples first
      try {
        const { error: samplesError } = await supabase
          .from('writing_samples')
          .delete()
          .eq('story_id', id);
        
        if (samplesError) {
          console.warn('Warning: Could not delete samples:', samplesError);
          // Continue with story deletion even if samples deletion fails
        }
      } catch (sampleErr) {
        console.warn('Warning: Error during samples deletion:', sampleErr);
        // Continue anyway
      }
      
      // Also delete any series_stories associations
      try {
        const { error: seriesStoriesError } = await supabase
          .from('series_stories')
          .delete()
          .eq('story_id', id);
          
        if (seriesStoriesError) {
          console.warn('Warning: Could not delete series associations:', seriesStoriesError);
          // Continue with story deletion
        }
      } catch (seriesStoryErr) {
        console.warn('Warning: Error during series association deletion:', seriesStoryErr);
        // Continue anyway
      }
      
      // Then delete the story
      const { error: storyError } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);
      
      if (storyError) {
        console.error('Error deleting story:', storyError);
        toast.error('Failed to delete story');
        setLoading(false);
        return;
      }
      
      toast.success('Story deleted successfully');
      
      // Navigate back to storyworld or stories list
      if (story.story_world_id) {
        navigate(`/story-worlds/${story.story_world_id}`);
      } else {
        navigate('/story-worlds');
      }
    } catch (err: any) {
      console.error('Error deleting story:', err);
      toast.error('Failed to delete story');
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (isNewStory) {
      // If canceling a new story creation, go back to story list
      navigate('/stories');
      return;
    }
    
    setFormData(story || {});
    setIsEditing(false);
  };

  // Cancel series editing
  const handleCancelSeriesEdit = () => {
    setSelectedSeriesId(story?.series_id || null);
    setIsEditingSeries(false);
  };

  // Show loading state on initial load
  if (loading && !isNewStory && !story) {
    return <LoadingSpinner />;
  }

  // Show creation form for new stories
  if (isNewStory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center mb-6 text-sm">
          <Link 
            to="/stories"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <FaArrowLeft className="mr-1" />
            Back to Stories
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Create New Story</h1>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Story Title
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Enter story title"
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
              placeholder="Enter story description"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {formData.story_world_id && seriesOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Series (optional)
              </label>
              <select
                value={selectedSeriesId || ""}
                onChange={handleSeriesChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Standalone Story (No Series) --</option>
                {seriesOptions.map(series => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            
            <button
              onClick={handleCreateStory}
              disabled={loading || !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show 'not found' state
  if (!story && !isNewStory) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h3 className="text-xl font-medium mb-4 text-gray-800">
          Story not found
        </h3>
        <p className="text-gray-600 mb-6">
          The story you're looking for does not exist or you may not have permission to view it.
        </p>
        <Link 
          to="/story-worlds"
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Story Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center mb-6 text-sm">
        <Link 
          to="/story-worlds"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <FaArrowLeft className="mr-1" />
          Story Worlds
        </Link>
        
        {story?.storyworld && (
          <>
            <span className="mx-2 text-gray-500">/</span>
            <Link 
              to={`/story-worlds/${story.story_world_id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {story.storyworld.name}
            </Link>
          </>
        )}
        
        {story?.series && (
          <>
            <span className="mx-2 text-gray-500">/</span>
            <Link 
              to={`/series/${story.series_id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {story.series.name}
            </Link>
          </>
        )}
        
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700 font-medium">{story?.name}</span>
      </div>

      {/* Story Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full text-2xl font-bold mb-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-2">{story?.name}</h1>
            )}
            
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Add a story description..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
            ) : (
              <p className="text-gray-600 mb-2">
                {story?.description || 'No description'}
              </p>
            )}
            
            <div className="text-sm text-gray-500">
              Created: {story && new Date(story.created_at || '').toLocaleDateString()}
              {story && story.created_at !== story.updated_at && (
                <span> • Updated: {new Date(story.updated_at || '').toLocaleDateString()}</span>
              )}
            </div>
            
            {/* Tags and Genre */}
            <div className="mt-3 flex flex-wrap gap-2">
              {story?.tags && story.tags.length > 0 && story.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
              
              {story?.genre && story.genre.length > 0 && story.genre.map((genre, index) => (
                <span 
                  key={index}
                  className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-md"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
                
                <button
                  onClick={handleSaveStory}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FaSave className="mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit
                </button>
                
                <button
                  onClick={handleDeleteStory}
                  className="px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded-md hover:bg-red-200 flex items-center"
                >
                  <FaTrashAlt className="mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Series Assignment Section */}
      {story && story.story_world_id && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Series Assignment</h2>
            
            {!isEditingSeries && (
              <button 
                onClick={() => setIsEditingSeries(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FaEdit className="mr-1" />
                Change
              </button>
            )}
          </div>
          
          {isEditingSeries ? (
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <select
                  value={selectedSeriesId || ""}
                  onChange={handleSeriesChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Standalone Story (No Series) --</option>
                  {seriesOptions.map(series => (
                    <option key={series.id} value={series.id}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCancelSeriesEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
                
                <button
                  onClick={handleSaveSeries}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FaSave className="mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {story.series ? (
                <div className="flex items-center">
                  <span>Part of series: </span>
                  <Link
                    to={`/series/${story.series_id}`}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {story.series.name}
                  </Link>
                </div>
              ) : (
                <div className="text-gray-600">
                  This is a standalone story (not part of any series)
                </div>
              )}
              
              {seriesOptions.length === 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  No series available in this story world. 
                  <Link
                    to={`/series/new?storyWorldId=${story.story_world_id}`}
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    Create a new series
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Samples Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Writing Samples</h2>
          
          <Link
            to={`/samples/new?storyId=${id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
          >
            <FaPlus className="mr-1" />
            Add Sample
          </Link>
        </div>
        
        {samples.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-4 text-gray-400">
              <FaBook size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Writing Samples Yet</h3>
            <p className="text-gray-600 mb-6">
              Start adding writing samples to this story for analysis and style creation.
            </p>
            <Link
              to={`/samples/new?storyId=${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
            >
              <FaPlus className="mr-2" />
              Add First Sample
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {samples.map((sample) => (
                <li key={sample.id}>
                  <Link 
                    to={`/samples/${sample.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">{sample.title}</h3>
                        {sample.author && (
                          <p className="text-sm text-gray-600 mb-1">
                            by {sample.author}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                          {sample.excerpt || sample.content.substring(0, 150) + '...'}
                        </p>
                        <div className="text-xs text-gray-500">
                          {sample.word_count || 0} words • {new Date(sample.updated_at || '').toLocaleDateString()}
                        </div>
                      </div>
                      
                      {sample.sample_type && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                          {sample.sample_type}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Style Profiles Section (placeholder for future implementation) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Style Profiles</h2>
          
          <Link
            to="/style-analysis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
          >
            <FaPlus className="mr-1" />
            Create Profile
          </Link>
        </div>
        
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-6">No style profiles in this story yet.</p>
          <Link
            to="/style-analysis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;