import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import DataGrid from '../DataGrid';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistance } from 'date-fns';

const SeriesTable = () => {
  const [series, setSeries] = useState([]);
  const [storyWorlds, setStoryWorlds] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStoryWorlds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('story_worlds')
        .select('id, name');
      
      if (error) throw error;
      
      const worldsMap = {};
      data.forEach(world => {
        worldsMap[world.id] = world.name;
      });
      
      setStoryWorlds(worldsMap);
    } catch (error) {
      console.error('Error fetching story worlds:', error);
      toast.error('Failed to load story worlds');
    }
  }, []);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('series')
        .select(`
          *,
          stories:stories(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to get the counts
      const processedData = data.map(series => ({
        ...series,
        storiesCount: series.stories?.[0]?.count || 0,
        createdTimeAgo: series.created_at ? formatDistance(new Date(series.created_at), new Date(), { addSuffix: true }) : '',
      }));

      setSeries(processedData);
    } catch (error) {
      console.error('Error fetching series:', error);
      toast.error('Failed to load series');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoryWorlds();
    fetchSeries();
  }, [fetchStoryWorlds, fetchSeries]);

  const handleCreateNew = () => {
    navigate('/series/new');
  };

  const handleRowSelected = (series) => {
    navigate(`/series/${series.id}`);
  };

  const handleCellValueChanged = async (event) => {
    try {
      // Only update if the data actually changed
      if (event.oldValue === event.newValue) return;

      const { error } = await supabase
        .from('series')
        .update({ [event.colDef.field]: event.newValue })
        .eq('id', event.data.id);

      if (error) throw error;
      toast.success('Series updated');
    } catch (error) {
      console.error('Error updating series:', error);
      toast.error('Failed to update series');
      // Refresh to get the original data
      fetchSeries();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this series? This will also delete all associated stories.')) {
      try {
        const { error } = await supabase
          .from('series')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        toast.success('Series deleted');
        fetchSeries();
      } catch (error) {
        console.error('Error deleting series:', error);
        toast.error('Failed to delete series');
      }
    }
  };

  const sequenceTypeOptions = ['Chronological', 'Publication', 'Narrative', 'Other'];

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
    { 
      headerName: 'Story World', 
      field: 'storyworld_id',
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
      headerName: 'Sequence Type', 
      field: 'sequence_type',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: sequenceTypeOptions
      }
    },
    { headerName: 'Description', field: 'description', flex: 2 },
    { headerName: 'Created', field: 'createdTimeAgo', editable: false },
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
            onClick={() => navigate(`/series/edit/${params.data.id}`)} 
            className="text-accent hover:text-accent-hover"
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
      className="create-button"
    >
      <FaPlus />
      <span>New Series</span>
    </button>
  );

  return (
    <DataGrid
      title="Series"
      columnDefs={columnDefs}
      rowData={series}
      onRowSelected={handleRowSelected}
      onCellValueChanged={handleCellValueChanged}
      actionButtons={actionButtons}
      isLoading={loading}
    />
  );
};

export default SeriesTable;