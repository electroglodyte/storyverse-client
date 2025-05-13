import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { StoryWorld } from '../supabase-tables';
import DataGrid from '../components/DataGrid';
import LoadingSpinner from '../components/LoadingSpinner';

const StoryWorldsTable: React.FC = () => {
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [storyCountMap, setStoryCountMap] = useState<Record<string, number>>({});
  const [seriesCountMap, setSeriesCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        setLoading(true);
        
        // Fetch all story worlds
        const { data: storyWorldsData, error: storyWorldsError } = await supabase
          .from('storyworlds')
          .select('*')
          .order('name');

        if (storyWorldsError) throw storyWorldsError;
        
        // Fetch story counts for each story world
        const { data: storyCounts, error: storyCountsError } = await supabase
          .from('stories')
          .select('storyworld_id, count(*)')
          .group('storyworld_id');
          
        if (storyCountsError) throw storyCountsError;
        
        // Fetch series counts for each story world
        const { data: seriesCounts, error: seriesCountsError } = await supabase
          .from('series')
          .select('storyworld_id, count(*)')
          .group('storyworld_id');
          
        if (seriesCountsError) throw seriesCountsError;
        
        // Transform the counts into a map
        const storyCountsByWorldId = storyCounts?.reduce((acc, item) => {
          acc[item.storyworld_id] = item.count;
          return acc;
        }, {} as Record<string, number>) || {};
        
        const seriesCountsByWorldId = seriesCounts?.reduce((acc, item) => {
          acc[item.storyworld_id] = item.count;
          return acc;
        }, {} as Record<string, number>) || {};
        
        setStoryWorlds(storyWorldsData || []);
        setStoryCountMap(storyCountsByWorldId);
        setSeriesCountMap(seriesCountsByWorldId);
      } catch (error: any) {
        toast.error(`Error loading story worlds: ${error.message}`);
        console.error('Error loading story worlds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryWorlds();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this story world? This will also delete all associated series and stories.');
    
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('storyworlds')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setStoryWorlds(storyWorlds.filter(world => world.id !== id));
        toast.success('Story world deleted successfully');
      } catch (error: any) {
        toast.error(`Error deleting story world: ${error.message}`);
        console.error('Error deleting story world:', error);
      }
    }
  };

  const handleCellValueChanged = async (event: any) => {
    if (!event.data || !event.data.id) return;
    
    try {
      const { error } = await supabase
        .from('storyworlds')
        .update({ [event.column.colId]: event.newValue })
        .eq('id', event.data.id);
        
      if (error) throw error;
      
      toast.success('Story world updated successfully');
    } catch (error: any) {
      toast.error(`Error updating story world: ${error.message}`);
      console.error('Error updating story world:', error);
      
      // Revert the change in the grid
      event.node.setDataValue(event.column.colId, event.oldValue);
    }
  };

  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      field: 'name',
    },
    { 
      headerName: 'Description', 
      field: 'description',
      flex: 2,
    },
    { 
      headerName: 'Created', 
      field: 'created_at',
      editable: false,
      valueFormatter: (params: any) => {
        return params.value ? format(new Date(params.value), 'PPP') : '';
      },
    },
    { 
      headerName: 'Series', 
      field: 'id',
      editable: false,
      valueGetter: (params: any) => {
        return seriesCountMap[params.data.id] || 0;
      },
    },
    { 
      headerName: 'Stories', 
      field: 'id',
      editable: false,
      valueGetter: (params: any) => {
        return storyCountMap[params.data.id] || 0;
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        return (
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate(`/storyworlds/${params.value}`)}
              className="text-blue-600 hover:text-blue-800"
              title="View"
            >
              <FaEye />
            </button>
            <button 
              onClick={() => navigate(`/storyworlds/${params.value}/edit`)}
              className="text-green-600 hover:text-green-800"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button 
              onClick={() => handleDelete(params.value)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <FaTrashAlt />
            </button>
          </div>
        );
      }
    }
  ], [navigate, storyCountMap, seriesCountMap]);

  const actionButtons = (
    <button
      onClick={() => navigate('/storyworlds/new')}
      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
    >
      <FaPlus className="mr-2" /> New Story World
    </button>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Story Worlds</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/storyworlds')}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            Card View
          </button>
          <span className="text-gray-400">|</span>
          <button 
            className="flex items-center text-blue-600 font-semibold"
          >
            Table View
          </button>
        </div>
      </div>

      <DataGrid
        columnDefs={columnDefs}
        rowData={storyWorlds}
        onCellValueChanged={handleCellValueChanged}
        actionButtons={actionButtons}
      />
    </div>
  );
};

export default StoryWorldsTable;