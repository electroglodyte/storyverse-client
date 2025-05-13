import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
    params.api.sizeColumnsToFit();
  }, []);

  // Handle window resize to ensure the grid stays responsive
  useEffect(() => {
    const handleResize = () => {
      if (gridApi) {
        setTimeout(() => {
          gridApi.sizeColumnsToFit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridApi]);

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
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };

  // Custom AG Grid theme class to apply our brown/beige styling
  const gridThemeClass = 'ag-theme-alpine custom-ag-theme';

  return (
    <div ref={containerRef} className={`card w-full shadow-md rounded-lg overflow-hidden mb-6 ${className}`}>
      {title && (
        <div className="flex justify-between items-center px-6 py-4 bg-header text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">{title}</h2>
          {actionButtons && <div className="flex space-x-2">{actionButtons}</div>}
        </div>
      )}
      
      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className={`${gridThemeClass} w-full mx-auto bg-background`} style={{ height: '500px', width: '100%' }}>
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
            domLayout="normal"
            suppressMovableColumns={false}
            suppressColumnVirtualisation={false}
          />
        </div>
      )}
    </div>
  );
};

export default DataGrid;