import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Faction, StoryWorld, Character } from '../supabase-tables';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaUsers, FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const FactionsListPage: React.FC = () => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [selectedStoryWorld, setSelectedStoryWorld] = useState<string>('');
  const [factionCharacterCounts, setFactionCharacterCounts] = useState<Record<string, number>>({});
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

  // Fetch factions based on selected story world
  useEffect(() => {
    if (!selectedStoryWorld) return;
    
    const fetchFactions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('factions')
          .select('*')
          .eq('story_world_id', selectedStoryWorld)
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setFactions(data || []);
        
        // Fetch character counts for each faction
        if (data && data.length > 0) {
          await fetchCharacterCounts(data.map(faction => faction.id));
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        toast.error(`Error fetching factions: ${error.message}`);
        console.error('Error fetching factions:', error);
        setLoading(false);
      }
    };

    fetchFactions();
  }, [selectedStoryWorld]);

  // Fetch character counts for each faction
  const fetchCharacterCounts = async (factionIds: string[]) => {
    if (factionIds.length === 0) return;
    
    try {
      // Create a new object to store the counts
      const countMap: Record<string, number> = {};
      
      // Initialize counts to 0
      factionIds.forEach(id => {
        countMap[id] = 0;
      });
      
      // Fetch counts one by one to avoid SQL errors
      for (const factionId of factionIds) {
        const { data, count, error } = await supabase
          .from('faction_characters')
          .select('*', { count: 'exact' })
          .eq('faction_id', factionId);
          
        if (error) {
          console.error(`Error fetching count for faction ${factionId}:`, error);
          continue;
        }
        
        if (count !== null) {
          countMap[factionId] = count;
        }
      }
      
      setFactionCharacterCounts(countMap);
    } catch (error: any) {
      console.error('Error fetching character counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this faction?')) {
      return;
    }

    try {
      // First delete all faction_characters entries for this faction
      const { error: characterRelationError } = await supabase
        .from('faction_characters')
        .delete()
        .eq('faction_id', id);

      if (characterRelationError) {
        throw characterRelationError;
      }

      // Then delete the faction itself
      const { error } = await supabase
        .from('factions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove the deleted faction from the state
      setFactions(factions.filter(faction => faction.id !== id));
      toast.success('Faction deleted successfully');
    } catch (error: any) {
      toast.error(`Error deleting faction: ${error.message}`);
      console.error('Error deleting faction:', error);
    }
  };

  const getFactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'political': 'Political',
      'social': 'Social',
      'familial': 'Family',
      'criminal': 'Criminal',
      'military': 'Military',
      'religious': 'Religious',
      'corporate': 'Corporate',
      'educational': 'Educational',
      'other': 'Other'
    };
    
    return typeMap[type] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Factions</h1>
        <Link
          to="/factions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          New Faction
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
      ) : factions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 text-gray-400">
            <FaUsers size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Factions Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first faction to start organizing the groups and allegiances in your story world.
          </p>
          <Link
            to="/factions/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Faction
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
                  Members
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
              {factions.map((faction) => (
                <tr key={faction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUsers className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {faction.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getFactionTypeLabel(faction.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {factionCharacterCounts[faction.id] || 0} character{(factionCharacterCounts[faction.id] !== 1) ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {faction.description || 'No description provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/factions/${faction.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteFaction(faction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FactionsListPage;