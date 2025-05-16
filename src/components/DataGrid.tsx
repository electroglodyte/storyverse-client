import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';

interface DataGridProps {
  rows: any[];
  columns: ColDef[];
  getRowId?: (params: any) => string;
  onRowSelected?: (event: any) => void;
  onRowClick?: (id: string) => void;
  defaultColDef?: ColDef;
  rowSelection?: 'single' | 'multiple';
  suppressRowClickSelection?: boolean;
  onSelectionChanged?: () => void;
  onRowDeleted?: (id: string) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
  getRowId,
  onRowSelected,
  onRowClick,
  defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  },
  rowSelection = 'single',
  suppressRowClickSelection = false,
  onSelectionChanged,
  onRowDeleted,
}) => {
  const gridRef = React.useRef<AgGridReact>(null);
  const containerStyle = { width: '100%', height: '100%' };

  React.useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.sizeColumnsToFit();
    }
  }, [rows, columns]);

  const onGridReady = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.sizeColumnsToFit();
    }
  };

  const onRowClicked = (event: any) => {
    if (onRowClick && event.data?.id) {
      onRowClick(event.data.id);
    }
  };

  const getSelectedRows = () => {
    if (gridRef.current?.api) {
      return gridRef.current.api.getSelectedRows();
    }
    return [];
  };

  return (
    <div style={containerStyle}>
      <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          getRowId={getRowId}
          onRowClicked={onRowClicked}
          rowSelection={rowSelection}
          suppressRowClickSelection={suppressRowClickSelection}
          onSelectionChanged={onSelectionChanged}
          onRowSelected={onRowSelected}
        />
      </div>
    </div>
  );
};
