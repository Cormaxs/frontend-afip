import React from 'react';
import { ClipboardList, Package } from 'lucide-react';

const DetalleProducto = ({ producto, onEdit, onDelete, onClose, onShowHistory, onIngresoMercaderia }) => {
  if (!producto) return null;

  const rowLabelStyle = { fontWeight: '600', color: '#555', width: '100%' };

  return (
    <div className="detalle-producto-minimal" style={{ padding: '10px' }}>
      {/* Cabecera */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', fontWeight: '500' }}>
        Producto: <span style={{ fontWeight: '400', color: '#555' }}>{producto.producto}</span>
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '20px' }}>
        ID: {producto._id} | Creado: {new Date(producto.createdAt).toLocaleDateString()}
      </p>

      <div className="table-container" style={{ border: 'none' }}>
        <table className="office-table">
          <tbody>
            {/* SECCIÓN: INFORMACIÓN BÁSICA */}
            <tr><th colSpan="2" style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '8px' }}>Información General</th></tr>
            <tr>
              <td style={rowLabelStyle}>Código Interno</td>
              <td>{producto.codigoInterno || '---'}</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Descripción</td>
              <td style={{ whiteSpace: 'pre-line', color: '#666', fontSize: '0.95em' }}>
                {producto.descripcion || 'Sin descripción...'}
              </td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Estado</td>
              <td>
                <span style={{ color: producto.activo ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  {producto.activo ? '● Activo' : '○ Inactivo'}
                </span>
              </td>
            </tr>

            {/* SECCIÓN: PRECIOS Y AFIP */}
            <tr><th colSpan="2" style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '8px' }}>Precios e Impuestos</th></tr>
            <tr>
              <td style={rowLabelStyle}>Precio Costo</td>
              <td>${producto.precioCosto?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Markup (Utilidad)</td>
              <td>{producto.markupPorcentaje}%</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Precio Lista (Final)</td>
              <td style={{ color: '#28a4d5', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ${producto.precioLista?.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Alícuota IVA</td>
              <td>{producto.alic_IVA}%</td>
            </tr>

            {/* SECCIÓN: STOCK Y LOGÍSTICA */}
            <tr><th colSpan="2" style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '8px' }}>Inventario y Logística</th></tr>
            <tr>
              <td style={rowLabelStyle}>Stock Disponible</td>
              <td>
                <span className={`badge ${producto.stock_disponible <= producto.stockMinimo ? 'bg-danger' : ''}`}>
                   {producto.stock_disponible} {producto.unidadMedida === "94" ? 'unidades' : 'unid.'}
                </span>
              </td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Stock Mínimo</td>
              <td>{producto.stockMinimo} unidades</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Ubicación</td>
              <td>{producto.ubicacionAlmacen || 'No especificada'}</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Fecha de Vencimiento</td>
              <td>{producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toLocaleDateString() : 'No especificada'}</td>
            </tr>

            {/* SECCIÓN: DIMENSIONES */}
            <tr><th colSpan="2" style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '8px' }}>Medidas Físicas</th></tr>
            <tr>
              <td style={rowLabelStyle}>Dimensiones (Al x An x Pr)</td>
              <td>{producto.alto_cm} x {producto.ancho_cm} x {producto.profundidad_cm} cm</td>
            </tr>
            <tr>
              <td style={rowLabelStyle}>Peso</td>
              <td>{producto.peso_kg} kg</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botonera */}
      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          className="btn btn-primary" 
          onClick={onEdit}
          style={{ backgroundColor: '#28a4d5', border: 'none', padding: '12px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Editar este Producto
        </button>

        <button 
          className="btn" 
          onClick={onShowHistory}
          style={{ backgroundColor: '#f0f9ff', border: '1px solid #28a4d5', padding: '10px', borderRadius: '4px', color: '#28a4d5', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <ClipboardList size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Ver Historial de Movimientos
        </button>

        <button 
          className="btn" 
          onClick={onIngresoMercaderia}
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #28a745', padding: '10px', borderRadius: '4px', color: '#28a745', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Ingresar Mercadería (Stock)
        </button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            onClick={onDelete}
            style={{ flex: 1, color: '#d9534f', border: '1px solid #d9534f', background: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Eliminar
          </button>
          <button 
            className="btn" 
            onClick={onClose}
            style={{ flex: 1, color: '#666', border: '1px solid #ccc', background: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;