import React from 'react'
import {
  DataGrid as MuiDataGrid,
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid'

export interface DataGridProps<T = any> {
  columns: GridColDef[];
  rows: T[];
  loading?: boolean;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataGrid<T = any>({ 
  columns, 
  rows,
  loading = false,
  getRowId,
  onRowClick,
  className
}: DataGridProps<T>) {
  const handleRowClick = (params: GridRenderCellParams) => {
    if (onRowClick) {
      onRowClick(params.row as T)
    }
  }

  return (
    <div className={className} style={{ height: 400, width: '100%' }}>
      <MuiDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId}
        onRowClick={handleRowClick}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
      />
    </div>
  )
}