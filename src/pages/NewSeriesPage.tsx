import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { StoryWorld } from '../supabase-tables';
import { toast } from 'react-hot-toast';
import { FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

const NewSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const storyWorldIdFromParams = queryParams.get('storyWorldId');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [storyWorldId, setStoryWorldId] = useState<string | null>(storyWorldIdFromParams);
  const [sequenceType, setSequenceType] = useState('chronological');
  const [coverImage, setCoverImage] = useState('');
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        const { data, error } = await supabase
          .from('storyworlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStoryWorlds(data || []);

        // If storyWorldId is not set from query params but there are story worlds available,
        // set the first one as default
        if (!storyWorldIdFromParams && data && data.length > 0) {
          setStoryWorldId(data[0].id);
        }
      } catch (error: any) {
        toast.error(`Error loading story worlds: ${error.message}`);
        console.error('Error loading story worlds:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStoryWorlds();
  }, [storyWorldIdFromParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please provide a name for your series');
      return;
    }

    if (!storyWorldId) {
      toast.error('Please select a story world for your series');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('series')
        .insert([
          {
            name,
            description: description || null,
            storyworld_id: storyWorldId,
            sequence_type: sequenceType,
            cover_image: coverImage || null
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Series created successfully!');
      navigate(`/series/${data.id}`);
    } catch (error: any) {
      toast.error(`Error creating series: ${error.message}`);
      console.error('Error creating series:', error);
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
          <h1 className="text-3xl font-bold">Create New Series</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="storyWorld" className="block text-gray-700 font-medium mb-2">
              Story World <span className="text-red-500">*</span>
            </label>
            <select
              id="storyWorld"
              value={storyWorldId || ''}
              onChange={(e) => setStoryWorldId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select a Story World
              </option>
              {storyWorlds.map((sw) => (
                <option key={sw.id} value={sw.id}>
                  {sw.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Series Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a name for your series"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Describe your series"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="sequenceType" className="block text-gray-700 font-medium mb-2">
              Sequence Type
            </label>
            <select
              id="sequenceType"
              value={sequenceType}
              onChange={(e) => setSequenceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="chronological">Chronological (in-world timeline)</option>
              <option value="publication">Publication Order</option>
              <option value="recommended">Recommended Reading Order</option>
              <option value="custom">Custom Order</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="coverImage" className="block text-gray-700 font-medium mb-2">
              Cover Image URL
            </label>
            <input
              type="text"
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter URL for cover image"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(storyWorldId ? `/storyworlds/${storyWorldId}` : '/storyworlds')}
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
              {loading ? 'Creating...' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSeriesPage;
