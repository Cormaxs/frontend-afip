import React, { useState, useEffect } from 'react';
import { ProductosService } from '../../services/inventario/productos.js';
import ModalGenerico from '../modal/ModalGenerico.jsx';

const HistorialMovimientos = ({ isOpen, onClose, producto }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    if (isOpen && producto?._id) {
      cargarMovimientos();
    }
  }, [isOpen, producto, pagination.page]);

  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      const response = await ProductosService.obtenerMovimientos(producto._id, { page: pagination.page, limit: 10 });
      setMovimientos(response.data?.docs || []);
      setPagination(prev => ({ ...prev, totalPages: response.data?.totalPages || 1 }));
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (tipo) => {
    const styles = {
      entrada: { bg: '#e6fffa', color: '#2c7a7b', label: '📥 Entrada' },
      salida: { bg: '#fff5f5', color: '#c53030', label: '📤 Salida' },
      ajuste_positivo: { bg: '#f0fff4', color: '#2f855a', label: '➕ Ajuste +' },
      ajuste_negativo: { bg: '#fffaf0', color: '#9b2c2c', label: '➖ Ajuste -' }
    };
    return styles[tipo] || { bg: '#edf2f7', color: '#4a5568', label: tipo };
  };

  return (
    <ModalGenerico
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial: ${producto?.producto || 'Producto'}`}
      width="800px"
    >
      <div style={{ padding: '10px' }}>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="office-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Fecha</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Tipo</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Cant.</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Motivo / Ref.</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Cargando...</td></tr>
              ) : movimientos.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Sin movimientos registrados.</td></tr>
              ) : movimientos.map((mov, idx) => {
                const style = getBadgeStyle(mov.tipoMovimiento);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {new Date(mov.fechaMovimiento).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: `1px solid ${style.color}44`
                      }}>
                        {style.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                      {mov.cantidad}
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      <div>{mov.motivo || '---'}</div>
                      {mov.referenciaDocumento && <div style={{ fontSize: '0.75rem', color: '#888' }}>Ref: {mov.referenciaDocumento}</div>}
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {mov.usuarioResponsable?.nombre || 'Sist.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
            <button 
              className="btn btn-sm" 
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>Pág. {pagination.page} de {pagination.totalPages}</span>
            <button 
              className="btn btn-sm" 
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </ModalGenerico>
  );
};

export default HistorialMovimientos;
