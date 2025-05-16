import React from 'react';
import { DataGrid } from '@/components/DataGrid';
import { Story, StoryWorld } from '@/types/database';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface StoryTableProps {
  stories: Story[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  storyworld?: StoryWorld;
}

export const StoryTable: React.FC<StoryTableProps> = ({ 
  stories, 
  onEdit, 
  onDelete,
  storyworld 
}) => {
  const navigate = useNavigate();

  // Convert story data for grid display
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'concept':
        return 'bg-gray-100';
      case 'outline':
        return 'bg-blue-100';
      case 'draft':
        return 'bg-yellow-100';
      case 'revision':
        return 'bg-orange-100';
      case 'completed':
        return 'bg-green-100';
      default:
        return '';
    }
  };

  const columnDefs = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      sortable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      sortable: true,
      cellClass: (params: any) => getStatusClass(params.data.status),
    },
    {
      field: 'createdTimeAgo',
      headerName: 'Created',
      flex: 1,
      sortable: true,
    },
    {
      field: 'word_count_target',
      headerName: 'Target Word Count',
      flex: 1,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex space-x-2">
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(params.data.id)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(params.data.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const preparedStories = stories.map(story => ({
    ...story,
    createdTimeAgo: timeAgo(story.created_at),
    statusClass: getStatusClass(story.status || '')
  }));

  const handleRowClick = (id: string) => {
    navigate(`/stories/${id}`);
  };

  return (
    <DataGrid
      rows={preparedStories}
      columns={columnDefs}
      getRowId={(row: Story) => row.id}
      onRowClick={handleRowClick}
    />
  );
};
