// /src/pages/StoryDetailPage.tsx (renamed from ProjectDetailPage.tsx)
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaBook } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Story, StoryWorld, Series, WritingSample } from '../supabase-tables';

interface ExtendedStory extends Story {
  storyworld?: StoryWorld;
  series?: Series;
}

const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<ExtendedStory | null>(null);
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Story>>({});

  // Fetch story details and associated samples
  useEffect(() => {
    const fetchStoryDetails = async () => {
      if (!id) {
        toast.error('Missing story ID');
        setLoading(false);
        return;
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
        
        // Get the StoryWorld information if available
        if (story.storyworld_id) {
          const { data: storyWorldData } = await supabase
            .from('storyworlds')
            .select('*')
            .eq('id', story.storyworld_id)
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

  // Save story changes
  const handleSaveStory = async () => {
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
      if (story.storyworld_id) {
        navigate(`/storyworlds/${story.storyworld_id}`);
      } else {
        navigate('/storyworlds');
      }
    } catch (err: any) {
      console.error('Error deleting story:', err);
      toast.error('Failed to delete story');
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData(story || {});
    setIsEditing(false);
  };

  // Show loading state on initial load
  if (loading && !story) {
    return <LoadingSpinner />;
  }

  // Show 'not found' state
  if (!story) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h3 className="text-xl font-medium mb-4 text-gray-800">
          Story not found
        </h3>
        <p className="text-gray-600 mb-6">
          The story you're looking for does not exist or you may not have permission to view it.
        </p>
        <Link 
          to="/storyworlds"
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
          to="/storyworlds"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <FaArrowLeft className="mr-1" />
          Story Worlds
        </Link>
        
        {story.storyworld && (
          <>
            <span className="mx-2 text-gray-500">/</span>
            <Link 
              to={`/storyworlds/${story.storyworld_id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {story.storyworld.name}
            </Link>
          </>
        )}
        
        {story.series && (
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
        <span className="text-gray-700 font-medium">{story.name}</span>
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
              <h1 className="text-2xl font-bold mb-2">{story.name}</h1>
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
                {story.description || 'No description'}
              </p>
            )}
            
            <div className="text-sm text-gray-500">
              Created: {new Date(story.created_at || '').toLocaleDateString()}
              {story.created_at !== story.updated_at && (
                <span> • Updated: {new Date(story.updated_at || '').toLocaleDateString()}</span>
              )}
            </div>
            
            {/* Tags and Genre */}
            <div className="mt-3 flex flex-wrap gap-2">
              {story.tags && story.tags.length > 0 && story.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
              
              {story.genre && story.genre.length > 0 && story.genre.map((genre, index) => (
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
