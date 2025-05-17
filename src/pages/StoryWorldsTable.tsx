import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DataGrid } from '@/components/DataGrid';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistance } from 'date-fns';
import { GridColDef } from '@mui/x-data-grid';

interface StoryWorld {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  seriesCount?: number;
  storiesCount?: number;
  createdTimeAgo?: string;
}

const StoryWorldsTable = () => {
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
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

    } catch (error: any) {
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

  const handleRowClick = (params: any) => {
    navigate(`/story-worlds/${params.row.id}`);
  };

  const handleCellValueChanged = async (event: any) => {
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
    } catch (error: any) {
      console.error('Error updating story world:', error);
      toast.error(`Failed to update story world: ${error.message || 'Unknown error'}`);
      // Refresh to get the original data
      fetchStoryWorlds();
    }
  };

  const handleDelete = async (id: string) => {
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
      } catch (error: any) {
        console.error('Error deleting story world:', error);
        toast.error(`Failed to delete story world: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 220,
      renderCell: (params) => (
        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
          {params.value}
        </div>
      )
    },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 250 },
    { field: 'createdTimeAgo', headerName: 'Created', width: 140 },
    { field: 'seriesCount', headerName: 'Series', width: 100, type: 'number' },
    { field: 'storiesCount', headerName: 'Stories', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/story-worlds/edit/${params.row.id}`);
            }} 
            className="text-accent hover:text-accent-hover"
            title="Edit Story World"
          >
            <FaEdit size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.row.id);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Story Worlds</h1>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          <FaPlus />
          <span>New Story World</span>
        </button>
      </div>

      <DataGrid<StoryWorld>
        rows={storyWorlds}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default StoryWorldsTable;
