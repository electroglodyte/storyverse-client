import { type FC } from 'react';
import { DataGrid as MuiDataGrid, 
  type GridColDef,
  type GridEventListener,
  type GridRowParams,
  type GridPaginationModel,
  type GridRowId
} from '@mui/x-data-grid';

interface DataGridProps<T = any> {
  columns: GridColDef[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (params: GridRowParams<T>) => void;
  rowCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  height?: number | string;
  getRowId?: (row: T) => GridRowId;
  paginationModel?: GridPaginationModel;
}

export const DataGrid = <T extends object>({
  columns,
  rows,
  loading = false,
  onRowClick,
  rowCount,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  height = 400,
  getRowId,
  paginationModel
}: DataGridProps<T>) => {
  const handleRowClick: GridEventListener<'rowClick'> = (
    params
  ) => {
    if (onRowClick) {
      onRowClick(params);
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
        initialState={{
          pagination: {
            paginationModel: paginationModel || { pageSize, page: 0 },
          },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]} 
        onPaginationModelChange={(model) => {
          if (onPageChange) {
            onPageChange(model.page);
          }
          if (onPageSizeChange) {
            onPageSizeChange(model.pageSize);
          }
        }}
        disableRowSelectionOnClick
        getRowId={getRowId}
      />
    </div>
  );
};
