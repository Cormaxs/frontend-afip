// src/components/tables/columnDefinitions.jsx
export const COLUMN_DEFS = {
    productos: [
      { header: 'Producto', accessorKey: 'producto' },
      { 
        header: 'Precio Costo', 
        accessorKey: 'precioCosto',
        cell: info => `$${info.getValue()?.toLocaleString()}`
      }, { 
        header: 'Precio Lista', 
        accessorKey: 'precioLista',
        cell: info => `$${info.getValue()?.toLocaleString()}`
      },{ 
        header: 'Stock', 
        accessorKey: 'stock_disponible',
        cell: info => (
          <span style={{ fontWeight: '700', color: info.getValue() <= 0 ? '#d9534f' : '#2c3e50' }}>
            {info.getValue()}
          </span>
        )
      },
      
     
      { 
        header: 'IVA', 
        accessorKey: 'alic_IVA',
        cell: info => `${info.getValue()}%`
      }, { 
        header: 'ultima edicion', 
        accessorKey: 'updatedAt',
        cell: info => {
          const rawValue = info.getValue();
          if (!rawValue) return '-';
          const date = new Date(rawValue);
          // Formatea según el locale y opciones que desees
          return date.toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });}},
     
     
    ],
    
    categorias: [
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: info => <strong>{info.getValue()}</strong>
      },
      {
        header: 'Descripción',
        accessorKey: 'descripcion',
        cell: info => info.getValue() || '---'
      },
      {
        header: 'Productos',
        accessorKey: 'productos',
        cell: info => (info.getValue() || []).length
      }
    ],

    marcas: [
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: info => <strong>{info.getValue()}</strong>
      },
      {
        header: 'Descripción',
        accessorKey: 'descripcion',
        cell: info => info.getValue() || '---'
      }
    ],

    vendedores: [
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: info => <strong>{info.getValue()}</strong>
      },
      {
        header: 'Email',
        accessorKey: 'email'
      },
      {
        header: 'Comisión (%)',
        accessorKey: 'comision',
        cell: info => `${info.getValue()}%`
      },
      {
        header: 'Estado',
        accessorKey: 'activo',
        cell: info => (
          <span style={{
            backgroundColor: info.getValue() ? '#28a745' : '#dc3545',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem'
          }}>
            {info.getValue() ? '✓ Activo' : '○ Inactivo'}
          </span>
        )
      }
    ],

    puntosVenta: [
      { 
          header: 'Nro', 
          accessorKey: 'numero',
          cell: info => (
              <code style={{ 
                  fontWeight: 'bold', 
                  color: '#2c3e50', 
                  backgroundColor: '#f8f9fa', 
                  padding: '2px 6px', 
                  borderRadius: '4px' 
              }}>
                  {info.getValue().toString().padStart(4, '0')}
              </code>
          )
      },
      { 
          header: 'Nombre / Sucursal', 
          accessorKey: 'nombre',
          cell: info => <span style={{ fontWeight: '500' }}>{info.getValue()}</span>
      },
      { 
          header: 'Localidad', 
          accessorFn: row => `${row.ciudad}, ${row.provincia}`,
          id: 'localidad'
      },
      { 
          header: 'Estado', 
          accessorKey: 'activo',
          cell: info => (
              <span className={`badge ${info.getValue() ? 'bg-success' : 'bg-danger'}`} 
                    style={{ 
                        fontSize: '0.7rem', 
                        padding: '4px 8px', 
                        backgroundColor: info.getValue() ? '#2ecc71' : '#e74c3c',
                        color: '#fff',
                        borderRadius: '12px'
                    }}>
                  {info.getValue() ? 'ACTIVO' : 'INACTIVO'}
              </span>
          )
      },
      { 
          header: 'Últ. Comprobante', 
          accessorKey: 'ultimoCbteAutorizado',
          cell: info => (
              <span style={{ color: '#7f8c8d', fontFamily: 'monospace' }}>
                  {info.getValue().toString().padStart(8, '0')}
              </span>
          )
      },
      { 
          header: 'Sincronizado', 
          accessorKey: 'updatedAt',
          cell: info => {
              const date = new Date(info.getValue());
              return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
          }
      },
      {
          header: 'Acciones',
          id: 'acciones',
          cell: ({ row, table }) => {
              const punto = row.original;
              const { onEdit, onDelete } = table.options.meta || {};
              return (
                  <div className="d-flex" style={{ gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => onEdit && onEdit(punto)}
                      >
                          Editar
                      </button>
                      <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => onDelete && onDelete(punto)}
                      >
                          Eliminar
                      </button>
                  </div>
              );
          }
      }
  ],
    
  facturas: [
    { 
        header: 'Fecha', 
        accessorKey: 'comprobante.fecha',
        cell: info => {
            const val = info.getValue();
            return val ? `${val.substring(6,8)}/${val.substring(4,6)}/${val.substring(0,4)}` : '-';
        }
    },
    { 
        header: 'Tipo', 
        accessorKey: 'comprobante.tipo',
        cell: info => <span className="fw-bold">{info.getValue()}</span>
    },
    { 
        header: 'Total', 
        accessorKey: 'totales.total',
        cell: info => <span className="fw-bold" style={{color: '#17a2b8'}}>${info.getValue()?.toLocaleString('es-AR')}</span>
    },
    
    
    { 
        header: 'Cliente (CUIT)', 
        accessorKey: 'receptor.numeroDocumento' 
    },
    { 
        header: 'Número', 
        accessorKey: 'comprobante.numero',
        cell: info => <code className="text-dark">{info.getValue()}</code>
    },
    { 
        header: 'Estado', 
        accessorKey: 'estado',
        cell: info => {
            const estado = info.getValue();
            const color = estado === 'APROBADA' ? '#2ecc71' : (estado === 'PENDIENTE' ? '#f0ad4e' : (estado === 'ANULADA' ? '#6c757d' : '#e74c3c'));
            return (
                <span className="badge" style={{ backgroundColor: color, fontSize: '0.65rem' }}>
                    {estado}
                </span>
            );
        }
    },
    {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row, table }) => {
            const factura = row.original;
            const { onReintentar, onAnular } = table.options.meta || {};
    
            // 1. Obtenemos el código del tipo de comprobante
            const tipoComp = parseInt(factura.afip?.tipoComprobante || factura.comprobante?.codigoTipo);
    
            // 2. Definimos qué comprobantes son "Anulables" (Solo Facturas A, B y C)
            // Tipos AFIP: 1 (Factura A), 6 (Factura B), 11 (Factura C)
            const esFacturaAnulable = [1, 6, 11].includes(tipoComp);
    
            return (
                <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Botón Reintentar: Para errores o pendientes */}
                    {(factura.estado === 'RECHAZADA' || factura.estado === 'ERROR' || factura.estado === 'PENDIENTE') && (
                        <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => onReintentar && onReintentar(factura)}
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            title="Reintentar emisión"
                        >
                            <i className="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    )}
    
                    {/* Botón Anular: Solo para facturas (A, B, C) ya aprobadas */}
                    {factura.estado === 'APROBADA' && esFacturaAnulable && (
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => onAnular && onAnular(factura)}
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            title="Anular con Nota de Crédito"
                        >
                            <i className="bi bi-x-circle"></i> Anular
                        </button>
                    )}
                </div>
            );
        }
    }
]
};