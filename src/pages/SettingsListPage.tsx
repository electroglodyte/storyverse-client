import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Location, StoryWorld } from '../supabase-tables';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const LocationsListPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [selectedStoryWorld, setSelectedStoryWorld] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch story worlds for the dropdown filter
  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        const { data, error } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStoryWorlds(data || []);
        // If there's at least one story world, select it by default
        if (data && data.length > 0) {
          setSelectedStoryWorld(data[0].id);
        }
      } catch (error: any) {
        toast.error(`Error fetching story worlds: ${error.message}`);
        console.error('Error fetching story worlds:', error);
      }
    };

    fetchStoryWorlds();
  }, []);

  // Fetch locations based on selected story world
  useEffect(() => {
    if (!selectedStoryWorld) return;
    
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('story_world_id', selectedStoryWorld)
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setLocations(data || []);
      } catch (error: any) {
        toast.error(`Error fetching locations: ${error.message}`);
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [selectedStoryWorld]);

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove the deleted location from the state
      setLocations(locations.filter(location => location.id !== id));
      toast.success('Location deleted successfully');
    } catch (error: any) {
      toast.error(`Error deleting location: ${error.message}`);
      console.error('Error deleting location:', error);
    }
  };

  // Group locations by parent for hierarchical display
  const groupedLocations = () => {
    const parentMap = new Map<string | null, Location[]>();
    
    // Initialize with root level (null parent)
    parentMap.set(null, []);
    
    locations.forEach(location => {
      const parentId = location.parent_location_id || null;
      
      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, []);
      }
      
      parentMap.get(parentId)?.push(location);
    });
    
    return parentMap;
  };

  // Recursive function to render locations hierarchy
  const renderLocationRows = (parentId: string | null = null, level: number = 0) => {
    const groupedMap = groupedLocations();
    const locationsForParent = groupedMap.get(parentId) || [];
    
    return locationsForParent.map(location => (
      <React.Fragment key={location.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-gray-500" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {location.name}
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {location.location_type || 'Not specified'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {location.time_period || 'Not specified'}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-900 line-clamp-2">
              {location.description || 'No description provided'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex space-x-2">
              <button 
                onClick={() => navigate(`/locations/${location.id}`)}
                className="text-blue-600 hover:text-blue-900"
              >
                <FaEdit />
              </button>
              <button 
                onClick={() => handleDeleteLocation(location.id)}
                className="text-red-600 hover:text-red-900"
              >
                <FaTrash />
              </button>
            </div>
          </td>
        </tr>
        {renderLocationRows(location.id, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Locations</h1>
        <Link
          to="/locations/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          New Location
        </Link>
      </div>

      {/* Story World Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Story World
        </label>
        <select
          className="w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedStoryWorld}
          onChange={(e) => setSelectedStoryWorld(e.target.value)}
        >
          {storyWorlds.map((world) => (
            <option key={world.id} value={world.id}>
              {world.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : locations.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 text-gray-400">
            <FaMapMarkerAlt size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Locations Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first location to start building your story world's locations.
          </p>
          <Link
            to="/locations/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Location
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Period
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderLocationRows()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LocationsListPage;