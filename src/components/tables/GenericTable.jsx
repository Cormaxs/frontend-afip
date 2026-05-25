import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { COLUMN_DEFS } from './columnDefinitions';
import './tablas.css';

const GenericTable = ({ data, type, pagination, onPageChange, onRowClick, onReintentar, onAnular, onEdit, onDelete }) => {
  const columns = useMemo(() => COLUMN_DEFS[type] || [], [type]);
  const tableData = useMemo(() => data || [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onReintentar,
      onAnular,
      onEdit,
      onDelete
    }
  });

  return (
    <div className="generic-table-wrapper">
      <div className="table-container">
        <table className="office-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => onRowClick && onRowClick(row.original)} 
                  style={{ cursor: 'pointer' }}
                  className="row-hover"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No se encontraron resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (pagination.pages > 1 || pagination.totalPages > 1) && (
        <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', padding: '15px' }}>
          <button 
            className="btn btn-reg" 
            onClick={() => onPageChange(pagination.page - 1)} 
            disabled={pagination.page === 1}
            style={{ marginTop: 0, width: '80px' }}
          >
            Ant.
          </button>
          
          <span className="option" style={{ margin: 0, fontSize: '13px' }}>
            Página <strong>{pagination.page}</strong> de {pagination.pages || pagination.totalPages} 
            <small style={{ marginLeft: '10px', color: '#999' }}>({pagination.total} ítems)</small>
          </span>

          <button 
            className="btn btn-reg" 
            onClick={() => onPageChange(pagination.page + 1)} 
            disabled={pagination.page === (pagination.pages || pagination.totalPages)}
            style={{ marginTop: 0, width: '80px' }}
          >
            Sig.
          </button>
        </div>
      )}
    </div>
  );
};

export default GenericTable;