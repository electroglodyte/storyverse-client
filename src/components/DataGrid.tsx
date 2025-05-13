import React, { useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DataGridProps {
  columnDefs: any[];
  rowData: any[];
  title?: string;
  onRowSelected?: (rowData: any) => void;
  onCellValueChanged?: (event: any) => void;
  onRowDeleted?: (rowData: any) => void;
  actionButtons?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({
  columnDefs,
  rowData,
  title,
  onRowSelected,
  onCellValueChanged,
  onRowDeleted,
  actionButtons,
  className = '',
  isLoading = false,
}) => {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
    params.api.sizeColumnsToFit();
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (gridApi && onRowSelected) {
      const selectedRows = gridApi.getSelectedRows();
      if (selectedRows.length > 0) {
        onRowSelected(selectedRows[0]);
      }
    }
  }, [gridApi, onRowSelected]);

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {actionButtons && <div className="flex space-x-2">{actionButtons}</div>}
        </div>
      )}
      
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="ag-theme-alpine w-full" style={{ height: '500px' }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            rowSelection="single"
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
          />
        </div>
      )}
    </div>
  );
};

export default DataGrid;