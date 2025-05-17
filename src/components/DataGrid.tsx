import { DataGrid as MuiDataGrid, GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid'

export interface DataGridProps {
  rows: any[]
  columns: GridColDef[]
  loading?: boolean
  onRowClick?: (params: any) => void
  pageSize?: number
  autoHeight?: boolean
  checkboxSelection?: boolean
  disableSelectionOnClick?: boolean
  hideFooter?: boolean
}

export function DataGrid({
  rows,
  columns,
  loading = false,
  onRowClick,
  pageSize = 10,
  autoHeight = true,
  checkboxSelection = false,
  disableSelectionOnClick = true,
  hideFooter = false,
}: DataGridProps) {
  return (
    <MuiDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      onRowClick={onRowClick}
      pageSize={pageSize}
      autoHeight={autoHeight}
      checkboxSelection={checkboxSelection}
      disableSelectionOnClick={disableSelectionOnClick}
      hideFooter={hideFooter}
      getRowId={(row) => row.id || Math.random().toString()}
    />
  )
}

export type { GridColDef, GridRenderCellParams, GridValueGetterParams }