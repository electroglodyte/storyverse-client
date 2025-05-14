import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { StoryWorld } from '../supabase-tables';
import { Link } from 'react-router-dom';
import { FaPlus, FaBook } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Add image_url property to extend StoryWorld type
interface ExtendedStoryWorld extends StoryWorld {
  image_url?: string;
}

const StoryWorldsListPage: React.FC = () => {
  const [storyWorlds, setStoryWorlds] = useState<ExtendedStoryWorld[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('storyworlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStoryWorlds(data || []);
      } catch (error: any) {
        toast.error(`Error fetching story worlds: ${error.message}`);
        console.error('Error fetching story worlds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryWorlds();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Story Worlds</h1>
        <Link
          to="/storyworlds/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          New Story World
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : storyWorlds.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 text-gray-400">
            <FaBook size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Story Worlds Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first story world to start organizing your stories and series.
          </p>
          <Link
            to="/storyworlds/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Story World
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyWorlds.map((storyWorld) => (
            <Link
              to={`/storyworlds/${storyWorld.id}`}
              key={storyWorld.id}
              className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                {storyWorld.image_url ? (
                  <img
                    src={storyWorld.image_url}
                    alt={storyWorld.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaBook size={48} className="text-gray-400" />
                )}
              </div>
              <div className="p-4 flex-1">
                <h2 className="text-xl font-semibold mb-2">{storyWorld.name}</h2>
                <p className="text-gray-600 line-clamp-3">
                  {storyWorld.description || 'No description provided.'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                  <span>
                    Created: {new Date(storyWorld.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryWorldsListPage;