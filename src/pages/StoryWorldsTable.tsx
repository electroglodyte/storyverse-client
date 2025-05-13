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
      // Add more detailed logging
      console.log('Fetching story worlds...');
      
      // First, just try to fetch the story worlds without any joins or counts
      const { data: worldsData, error: worldsError } = await supabase
        .from('story_worlds')
        .select('*');

      console.log('Story worlds query result:', { worldsData, worldsError });

      if (worldsError) {
        console.error('Error fetching story worlds:', worldsError);
        throw worldsError;
      }

      if (!worldsData || worldsData.length === 0) {
        console.log('No story worlds found. Redirecting to setup page...');
        toast.error('No story worlds found. Please run the setup process.');
        setTimeout(() => {
          navigate('/setup');
        }, 2000);
        setStoryWorlds([]);
        setLoading(false);
        return;
      }

      // Simple processing - skip the counts for now to reduce complexity
      const processedWorlds = worldsData.map(world => ({
        ...world,
        seriesCount: 0, // We'll update this later
        storiesCount: 0, // We'll update this later
        createdTimeAgo: world.created_at ? formatDistance(new Date(world.created_at), new Date(), { addSuffix: true }) : '',
      }));

      console.log('Processed worlds:', processedWorlds);
      setStoryWorlds(processedWorlds);

      // Now fetch counts separately (but don't block the initial display)
      Promise.all(
        worldsData.map(async (world) => {
          try {
            // Get series count
            const { count: seriesCount, error: seriesError } = await supabase
              .from('series')
              .select('id', { count: 'exact', head: true })
              .eq('storyworld_id', world.id);

            if (seriesError) {
              console.error(`Error fetching series count for world ${world.id}:`, seriesError);
            }

            // Get stories count
            const { count: storiesCount, error: storiesError } = await supabase
              .from('stories')
              .select('id', { count: 'exact', head: true })
              .eq('storyworld_id', world.id);

            if (storiesError) {
              console.error(`Error fetching stories count for world ${world.id}:`, storiesError);
            }

            return {
              ...world,
              seriesCount: seriesCount || 0,
              storiesCount: storiesCount || 0,
              createdTimeAgo: world.created_at ? formatDistance(new Date(world.created_at), new Date(), { addSuffix: true }) : '',
            };
          } catch (error) {
            console.error(`Error processing counts for world ${world.id}:`, error);
            return {
              ...world,
              seriesCount: 0,
              storiesCount: 0,
              createdTimeAgo: world.created_at ? formatDistance(new Date(world.created_at), new Date(), { addSuffix: true }) : '',
            };
          }
        })
      )
        .then(worldsWithCounts => {
          console.log('Worlds with counts:', worldsWithCounts);
          setStoryWorlds(worldsWithCounts);
        })
        .catch(error => {
          console.error('Error fetching counts:', error);
          // Keep the worlds without counts displayed
        });

    } catch (error) {
      console.error('Error in fetchStoryWorlds:', error);
      toast.error(`Failed to load story worlds: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

      console.log('Updating story world:', event.data.id, event.colDef.field, event.newValue);

      const { data, error } = await supabase
        .from('story_worlds')
        .update({ [event.colDef.field]: event.newValue })
        .eq('id', event.data.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) throw error;
      toast.success('Story world updated');
    } catch (error) {
      console.error('Error updating story world:', error);
      toast.error(`Failed to update story world: ${error.message || 'Unknown error'}`);
      // Refresh to get the original data
      fetchStoryWorlds();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this story world? This will also delete all associated series and stories.')) {
      try {
        console.log('Deleting story world:', id);

        const { data, error } = await supabase
          .from('story_worlds')
          .delete()
          .eq('id', id)
          .select();

        console.log('Delete result:', { data, error });

        if (error) throw error;
        
        toast.success('Story world deleted');
        fetchStoryWorlds();
      } catch (error) {
        console.error('Error deleting story world:', error);
        toast.error(`Failed to delete story world: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const columnDefs = [
    { 
      headerName: 'Name', 
      field: 'name', 
      width: 220,
      cellRenderer: (params) => (
        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
          {params.value}
        </div>
      )
    },
    { headerName: 'Description', field: 'description', flex: 2, minWidth: 250 },
    { headerName: 'Created', field: 'createdTimeAgo', editable: false, width: 140 },
    { headerName: 'Series', field: 'seriesCount', editable: false, width: 100, type: 'numericColumn' },
    { headerName: 'Stories', field: 'storiesCount', editable: false, width: 100, type: 'numericColumn' },
    {
      headerName: 'Actions',
      width: 120,
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/story-worlds/edit/${params.data.id}`);
            }} 
            className="text-accent hover:text-accent-hover"
            title="Edit Story World"
          >
            <FaEdit size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data.id);
            }} 
            className="text-red-500 hover:text-red-700"
            title="Delete Story World"
          >
            <FaTrash size={16} />
          </button>
        </div>
      )
    }
  ];

  const actionButtons = (
    <button
      onClick={handleCreateNew}
      className="create-button"
    >
      <FaPlus />
      <span>New Story World</span>
    </button>
  );

  return (
    <DataGrid
      title="Story Worlds"
      columnDefs={columnDefs}
      rowData={storyWorlds}
      onRowSelected={handleRowSelected}
      onCellValueChanged={handleCellValueChanged}
      actionButtons={actionButtons}
      isLoading={loading}
    />
  );
};

export default StoryWorldsTable;