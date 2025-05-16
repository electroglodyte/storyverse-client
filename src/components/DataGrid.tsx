import { useEffect, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export interface DataGridProps {
  rows: any[]
  columns: any[]
  getRowId: (row: any) => string | number
  onRowClick?: (params: any) => void
  loading?: boolean
  rowSelection?: 'single' | 'multiple'
  onSelectionChanged?: () => void
  className?: string
}

export function DataGrid({
  rows,
  columns,
  getRowId,
  onRowClick,
  loading = false,
  rowSelection = 'single',
  onSelectionChanged,
  className = ''
}: DataGridProps) {
  const [gridApi, setGridApi] = useState<any>(null)

  useEffect(() => {
    if (gridApi) {
      gridApi.setRowData(rows)
    }
  }, [rows, gridApi])

  const onGridReady = (params: any) => {
    setGridApi(params.api)
    params.api.sizeColumnsToFit()
  }

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true
  }

  return (
    <div className={`ag-theme-alpine w-full h-[500px] ${className}`}>
      <AgGridReact
        rowData={rows}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        onGridReady={onGridReady}
        onRowClicked={onRowClick}
        rowSelection={rowSelection}
        onSelectionChanged={onSelectionChanged}
        suppressCellFocus={true}
      />
    </div>
  )
}
