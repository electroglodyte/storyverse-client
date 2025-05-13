import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Series, StoryWorld } from '../supabase-tables';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const SeriesEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storyWorld, setStoryWorld] = useState<StoryWorld | null>(null);
  const [formData, setFormData] = useState<Partial<Series>>({
    name: '',
    description: '',
    sequence_type: 'Chronological',
    storyworld_id: '',
    story_world_id: ''
  });

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
        
        setFormData({
          name: seriesData.name,
          description: seriesData.description,
          sequence_type: seriesData.sequence_type,
          storyworld_id: seriesData.storyworld_id,
          story_world_id: seriesData.story_world_id
        });

        if (seriesData.storyworld_id || seriesData.story_world_id) {
          const storyWorldId = seriesData.storyworld_id || seriesData.story_world_id;
          // Fetch the story world
          const { data: storyWorldData, error: storyWorldError } = await supabase
            .from('story_worlds')
            .select('*')
            .eq('id', storyWorldId)
            .single();

          if (storyWorldError) throw storyWorldError;
          setStoryWorld(storyWorldData);
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Series name is required');
      return;
    }

    try {
      setLoading(true);
      
      // Update the series
      const { error } = await supabase
        .from('series')
        .update({
          name: formData.name,
          description: formData.description,
          sequence_type: formData.sequence_type,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Series updated successfully!');
      navigate(`/series/${id}`);
    } catch (error: any) {
      toast.error(`Error updating series: ${error.message}`);
      console.error('Error updating series:', error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/series/${id}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center mb-6 text-sm">
        <Link 
          to={`/series/${id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <FaArrowLeft className="mr-1" />
          Back to Series
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Edit Series</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Series Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Enter series name"
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
              placeholder="Enter series description"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Story World
            </label>
            <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
              <span className="font-medium">{storyWorld?.name || 'Unknown'}</span>
              <p className="text-sm text-gray-500 mt-1">
                Story World cannot be changed once a series is created.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Sequence Type
            </label>
            <select
              name="sequence_type"
              value={formData.sequence_type || 'Chronological'}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Chronological">Chronological</option>
              <option value="Publication">Publication</option>
              <option value="Narrative">Narrative</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesEditPage;