import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DataGrid from '../components/DataGrid';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistance } from 'date-fns';

const StoryWorldsTable = () => {
  const [storyWorlds, setStoryWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStoryWorlds = useCallback(async () => {
    setLoading(true);
    try {
      // Get story worlds with counts of related series and stories
      // First, fetch the story worlds
      const { data: worldsData, error: worldsError } = await supabase
        .from('story_worlds')
        .select('*')
        .order('created_at', { ascending: false });

      if (worldsError) throw worldsError;

      // Fetch the counts separately for each world
      const worldsWithCounts = await Promise.all(
        worldsData.map(async (world) => {
          // Get series count
          const { count: seriesCount, error: seriesError } = await supabase
            .from('series')
            .select('id', { count: 'exact', head: true })
            .eq('storyworld_id', world.id);

          if (seriesError) throw seriesError;

          // Get stories count
          const { count: storiesCount, error: storiesError } = await supabase
            .from('stories')
            .select('id', { count: 'exact', head: true })
            .eq('storyworld_id', world.id);

          if (storiesError) throw storiesError;

          return {
            ...world,
            seriesCount: seriesCount || 0,
            storiesCount: storiesCount || 0,
            createdTimeAgo: world.created_at ? formatDistance(new Date(world.created_at), new Date(), { addSuffix: true }) : '',
          };
        })
      );

      setStoryWorlds(worldsWithCounts);
    } catch (error) {
      console.error('Error fetching story worlds:', error);
      toast.error('Failed to load story worlds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoryWorlds();
  }, [fetchStoryWorlds]);

  const handleCreateNew = () => {
    navigate('/story-worlds/new');
  };

  const handleRowSelected = (storyWorld) => {
    navigate(`/story-worlds/${storyWorld.id}`);
  };

  const handleCellValueChanged = async (event) => {
    try {
      // Only update if the data actually changed
      if (event.oldValue === event.newValue) return;

      const { error } = await supabase
        .from('story_worlds')
        .update({ [event.colDef.field]: event.newValue })
        .eq('id', event.data.id);

      if (error) throw error;
      toast.success('Story world updated');
    } catch (error) {
      console.error('Error updating story world:', error);
      toast.error('Failed to update story world');
      // Refresh to get the original data
      fetchStoryWorlds();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this story world? This will also delete all associated series and stories.')) {
      try {
        const { error } = await supabase
          .from('story_worlds')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        toast.success('Story world deleted');
        fetchStoryWorlds();
      } catch (error) {
        console.error('Error deleting story world:', error);
        toast.error('Failed to delete story world');
      }
    }
  };

  const columnDefs = [
    { 
      headerName: 'Name', 
      field: 'name', 
      cellRenderer: (params) => (
        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
          {params.value}
        </div>
      )
    },
    { headerName: 'Description', field: 'description', flex: 2 },
    { headerName: 'Created', field: 'createdTimeAgo', editable: false },
    { headerName: 'Series', field: 'seriesCount', editable: false, width: 120 },
    { headerName: 'Stories', field: 'storiesCount', editable: false, width: 120 },
    {
      headerName: 'Actions',
      width: 120,
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(`/story-worlds/edit/${params.data.id}`)} 
            className="text-blue-500 hover:text-blue-700"
          >
            <FaEdit />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data.id);
            }} 
            className="text-red-500 hover:text-red-700"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  const actionButtons = (
    <button
      onClick={handleCreateNew}
      className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      <FaPlus />
      <span>New Story World</span>
    </button>
  );

  return (
    <div className="container mx-auto py-8">
      <DataGrid
        title="Story Worlds"
        columnDefs={columnDefs}
        rowData={storyWorlds}
        onRowSelected={handleRowSelected}
        onCellValueChanged={handleCellValueChanged}
        actionButtons={actionButtons}
        isLoading={loading}
      />
    </div>
  );
};

export default StoryWorldsTable;