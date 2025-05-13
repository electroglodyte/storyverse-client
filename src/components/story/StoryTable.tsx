import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import DataGrid from '../DataGrid';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { format, formatDistance } from 'date-fns';

const StoryTable = () => {
  const [stories, setStories] = useState([]);
  const [storyWorlds, setStoryWorlds] = useState({});
  const [seriesList, setSeriesList] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRelatedData = useCallback(async () => {
    try {
      // Fetch story worlds
      const { data: worldsData, error: worldsError } = await supabase
        .from('story_worlds')
        .select('id, name');
      
      if (worldsError) throw worldsError;
      
      const worldsMap = {};
      worldsData.forEach(world => {
        worldsMap[world.id] = world.name;
      });
      setStoryWorlds(worldsMap);

      // Fetch series
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id, name');
      
      if (seriesError) throw seriesError;
      
      const seriesMap = {};
      seriesData.forEach(series => {
        seriesMap[series.id] = series.name;
      });
      setSeriesList(seriesMap);
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to load related data');
    }
  }, []);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data 
      const processedData = data.map(story => ({
        ...story,
        createdTimeAgo: story.created_at ? formatDistance(new Date(story.created_at), new Date(), { addSuffix: true }) : '',
        targetDateFormatted: story.target_date ? format(new Date(story.target_date), 'MMM d, yyyy') : '',
        statusClass: getStatusClass(story.status)
      }));

      setStories(processedData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatedData();
    fetchStories();
  }, [fetchRelatedData, fetchStories]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Editing': return 'bg-purple-100 text-purple-800';
      case 'Complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100';
    }
  };

  const handleCreateNew = () => {
    navigate('/stories/new');
  };

  const handleRowSelected = (story) => {
    navigate(`/stories/${story.id}`);
  };

  const handleCellValueChanged = async (event) => {
    try {
      // Only update if the data actually changed
      if (event.oldValue === event.newValue) return;

      const { error } = await supabase
        .from('stories')
        .update({ [event.colDef.field]: event.newValue })
        .eq('id', event.data.id);

      if (error) throw error;
      toast.success('Story updated');
      
      // If we updated the status, we need to update the statusClass
      if (event.colDef.field === 'status') {
        fetchStories();
      }
    } catch (error) {
      console.error('Error updating story:', error);
      toast.error('Failed to update story');
      // Refresh to get the original data
      fetchStories();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        toast.success('Story deleted');
        fetchStories();
      } catch (error) {
        console.error('Error deleting story:', error);
        toast.error('Failed to delete story');
      }
    }
  };

  const statusOptions = ['Draft', 'In Progress', 'Editing', 'Complete'];

  const columnDefs = [
    { 
      headerName: 'Title', 
      field: 'title', 
      cellRenderer: (params) => (
        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
          {params.value}
        </div>
      )
    },
    { 
      headerName: 'Story World', 
      field: 'story_world_id',
      cellRenderer: (params) => storyWorlds[params.value] || 'Unknown',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.keys(storyWorlds),
        cellRenderer: (params) => storyWorlds[params.value] || 'Unknown'
      },
      filterParams: {
        valueFormatter: (params) => storyWorlds[params.value] || 'Unknown'
      }
    },
    { 
      headerName: 'Series', 
      field: 'series_id',
      cellRenderer: (params) => seriesList[params.value] || 'None',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [...Object.keys(seriesList), null],
        cellRenderer: (params) => seriesList[params.value] || 'None'
      },
      filterParams: {
        valueFormatter: (params) => seriesList[params.value] || 'None'
      }
    },
    { 
      headerName: 'Status', 
      field: 'status',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: statusOptions
      },
      cellRenderer: (params) => (
        <div className={`text-center px-2 py-1 rounded-full ${params.data.statusClass}`}>
          {params.value || 'Draft'}
        </div>
      )
    },
    { headerName: 'Target Date', field: 'targetDateFormatted', editable: false },
    { headerName: 'Word Count', field: 'word_count', editable: true, width: 120 },
    { headerName: 'Created', field: 'createdTimeAgo', editable: false },
    {
      headerName: 'Actions',
      width: 120,
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(`/stories/edit/${params.data.id}`)} 
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
      <span>New Story</span>
    </button>
  );

  return (
    <div className="container mx-auto py-8">
      <DataGrid
        title="Stories"
        columnDefs={columnDefs}
        rowData={stories}
        onRowSelected={handleRowSelected}
        onCellValueChanged={handleCellValueChanged}
        actionButtons={actionButtons}
        isLoading={loading}
      />
    </div>
  );
};

export default StoryTable;