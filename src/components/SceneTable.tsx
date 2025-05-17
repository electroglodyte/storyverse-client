import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Scene } from '../types/scene';
import { useSupabase } from '../contexts/SupabaseContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus, Edit2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

interface SceneTableProps {
  storyId: string;
}

export const SceneTable: React.FC<SceneTableProps> = ({ storyId }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    fetchScenes();
  }, [storyId]);

  const fetchScenes = async () => {
    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', storyId)
        .order('sequence_number', { ascending: true });

      if (error) throw error;
      setScenes(data || []);
    } catch (error) {
      toast.error('Failed to fetch scenes');
      console.error('Error fetching scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'sequence_number', headerName: 'Seq', width: 70 },
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'scene_type', headerName: 'Type', width: 100 },
    { field: 'status', headerName: 'Status', width: 100 },
    { 
      field: 'essence', 
      headerName: 'Essence', 
      width: 200,
      renderCell: (params) => params.value || '-'
    },
    { 
      field: 'updated_at', 
      headerName: 'Last Updated', 
      width: 150,
      renderCell: (params) => format(new Date(params.value), 'MMM d, yyyy')
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/scenes/${params.row.id}`)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Scenes</h2>
        <Button
          onClick={() => router.push(`/stories/${storyId}/scenes/new`)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Scene
        </Button>
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={scenes}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>
    </div>
  );
};