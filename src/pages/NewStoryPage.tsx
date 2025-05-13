// /src/pages/NewStoryPage.tsx (renamed from NewProjectPage.tsx)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { StoryWorld, Series } from '../supabase-tables';
import { toast } from 'react-hot-toast';
import { FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

// Define Story form interface
interface StoryForm {
  name: string;
  description?: string;
  genre?: string;
  tags?: string;
  storyWorldId: string | null;
  seriesId: string | null;
}

const NewStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const storyWorldIdFromParams = queryParams.get('storyWorldId');
  const seriesIdFromParams = queryParams.get('seriesId');

  const [formData, setFormData] = useState<StoryForm>({
    name: '',
    description: '',
    genre: '',
    tags: '',
    storyWorldId: storyWorldIdFromParams,
    seriesId: seriesIdFromParams
  });
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch story worlds
        const { data: storyWorldsData, error: storyWorldsError } = await supabase
          .from('storyworlds')
          .select('*')
          .order('name', { ascending: true });

        if (storyWorldsError) throw storyWorldsError;
        setStoryWorlds(storyWorldsData || []);

        // If a storyWorldId is selected (either from params or by default), fetch series for that storyworld
        if (formData.storyWorldId) {
          const { data: seriesData, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('storyworld_id', formData.storyWorldId)
            .order('name', { ascending: true });

          if (seriesError) throw seriesError;
          setSeries(seriesData || []);
        }

        // If no storyWorldId is set from query params but there are story worlds available,
        // set the first one as default
        if (!storyWorldIdFromParams && storyWorldsData && storyWorldsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            storyWorldId: storyWorldsData[0].id
          }));

          // Also fetch series for this default storyworld
          const { data: seriesData, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('storyworld_id', storyWorldsData[0].id)
            .order('name', { ascending: true });

          if (seriesError) throw seriesError;
          setSeries(seriesData || []);
        }
      } catch (error: any) {
        toast.error(`Error loading data: ${error.message}`);
        console.error('Error loading data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [storyWorldIdFromParams, seriesIdFromParams]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for storyWorldId to also update the available series
    if (name === 'storyWorldId') {
      const storyWorldId = value === '' ? null : value;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: storyWorldId,
        // Reset series when changing story world
        seriesId: null
      }));
      
      // Fetch series for the selected story world
      if (storyWorldId) {
        const fetchSeries = async () => {
          try {
            const { data: seriesData, error: seriesError } = await supabase
              .from('series')
              .select('*')
              .eq('storyworld_id', storyWorldId)
              .order('name', { ascending: true });

            if (seriesError) throw seriesError;
            setSeries(seriesData || []);
          } catch (error: any) {
            toast.error(`Error loading series: ${error.message}`);
            console.error('Error loading series:', error);
          }
        };
        
        fetchSeries();
      } else {
        // Clear series if no story world is selected
        setSeries([]);
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === '' && (name === 'seriesId') ? null : value 
      }));
    }
  };

  // Create new story
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Story name is required');
      return;
    }
    
    if (!formData.storyWorldId) {
      toast.error('Please select a Story World');
      return;
    }
    
    setLoading(true);
    
    try {
      // Process tags and genre as arrays if provided
      const tagsArray = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];
        
      const genreArray = formData.genre
        ? formData.genre.split(',').map(genre => genre.trim()).filter(genre => genre !== '')
        : [];
      
      // Create story in Supabase
      const { data, error } = await supabase
        .from('stories')
        .insert([
          {
            name: formData.name,
            description: formData.description || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            genre: genreArray.length > 0 ? genreArray : null,
            storyworld_id: formData.storyWorldId,
            series_id: formData.seriesId
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // If the story is part of a series, add it to the series_stories junction table
      if (formData.seriesId) {
        // Find the highest sequence number in the current series
        const { data: seriesStoriesData, error: seriesStoriesError } = await supabase
          .from('series_stories')
          .select('sequence_number')
          .eq('series_id', formData.seriesId)
          .order('sequence_number', { ascending: false })
          .limit(1);
        
        if (seriesStoriesError) throw seriesStoriesError;
        
        const highestSequence = seriesStoriesData && seriesStoriesData.length > 0
          ? seriesStoriesData[0].sequence_number
          : 0;
        
        // Add the story to the series with the next sequence number
        const { error: junctionError } = await supabase
          .from('series_stories')
          .insert([
            {
              series_id: formData.seriesId,
              story_id: data.id,
              sequence_number: highestSequence + 1
            }
          ]);
        
        if (junctionError) throw junctionError;
      }
      
      toast.success('Story created successfully!');
      
      // Navigate to the new story
      navigate(`/stories/${data.id}`);
      
    } catch (error: any) {
      toast.error(`Error creating story: ${error.message}`);
      console.error('Error creating story:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Create New Story</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="storyWorldId" className="block text-gray-700 font-medium mb-2">
              Story World <span className="text-red-500">*</span>
            </label>
            <select
              id="storyWorldId"
              name="storyWorldId"
              value={formData.storyWorldId || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a Story World</option>
              {storyWorlds.map((storyWorld) => (
                <option key={storyWorld.id} value={storyWorld.id}>
                  {storyWorld.name}
                </option>
              ))}
            </select>
            {storyWorlds.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No story worlds found. Please{' '}
                <Link to="/storyworlds/new" className="text-blue-600 hover:underline">
                  create a story world
                </Link>{' '}
                first.
              </p>
            )}
          </div>

          {formData.storyWorldId && (
            <div className="mb-4">
              <label htmlFor="seriesId" className="block text-gray-700 font-medium mb-2">
                Series (Optional)
              </label>
              <select
                id="seriesId"
                name="seriesId"
                value={formData.seriesId || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Series (Standalone Story)</option>
                {series.map((seriesItem) => (
                  <option key={seriesItem.id} value={seriesItem.id}>
                    {seriesItem.name}
                  </option>
                ))}
              </select>
              {series.length === 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  No series found in this story world. You can{' '}
                  <Link to={`/series/new?storyWorldId=${formData.storyWorldId}`} className="text-blue-600 hover:underline">
                    create a new series
                  </Link>{' '}
                  or keep this as a standalone story.
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Story Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter story name"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Enter story description"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="genre" className="block text-gray-700 font-medium mb-2">
              Genre(s)
            </label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., Fantasy, Sci-Fi, Mystery (comma separated)"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="tags" className="block text-gray-700 font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., novel, draft, in-progress (comma separated)"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(formData.storyWorldId ? `/storyworlds/${formData.storyWorldId}` : '/storyworlds')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewStoryPage;
