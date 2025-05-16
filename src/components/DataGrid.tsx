import { type FC } from 'react';
import { DataGrid as MuiDataGrid, 
  type GridColDef,
  type GridEventListener,
  type GridRenderCellParams,
  type GridRowParams
} from '@mui/x-data-grid';

interface DataGridProps {
  columns: GridColDef[];
  rows: any[];
  loading?: boolean;
  onRowClick?: (id: string) => void;
  rowCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  height?: number | string;
}

export const DataGrid: FC<DataGridProps> = ({
  columns,
  rows,
  loading = false,
  onRowClick,
  rowCount,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  height = 400
}) => {
  const handleRowClick: GridEventListener<'rowClick'> = (
    params: GridRowParams
  ) => {
    if (onRowClick) {
      onRowClick(params.row.id);
    }
  };

  return (
    <div style={{ height, width: '100%' }}>
      <MuiDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        rowCount={rowCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
      />
    </div>
  );
};