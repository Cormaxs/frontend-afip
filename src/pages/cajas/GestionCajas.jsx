import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { CajasService } from '../../services/cajas/cajas.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import AbrirCajaForm from '../../components/cajas/AbrirCajaForm.jsx';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const GestionCajas = () => {
  const { user, empresa } = useAuth();
  const companyId = empresa?._id || empresa?.id || user?.empresa || user?.empresaId || user?.companyId;
  const [cajas, setCajas] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState(null);
  const [resumenCaja, setResumenCaja] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [cajaDetalleModal, setCajaDetalleModal] = useState({ open: false, id: null, data: null, loading: false });

  // Estado para la paginación y búsqueda
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    sortBy: 'fechaApertura',
    order: 'desc',
    search: '', // Campo de búsqueda general
    estado: '', // Filtro por estado (Abierta/Cerrada)
    puntoVenta: '', // Filtro por punto de venta
    vendedor: '', // Filtro por vendedor
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    if (companyId) {
      cargarCajas();
      cargarPuntosVenta();
    }
  }, [companyId, searchParams]); // Dependencia de searchParams para recargar al cambiar filtros/paginación

  useEffect(() => {
    const cajaActiva = cajas.find(c => c.estado && c.estado.toLowerCase() === 'abierta');
    if (cajaActiva) {
      cargarResumenCaja(cajaActiva._id);
      
      // Auto-refresco del resumen de caja cada 30 segundos si hay una caja activa
      const interval = setInterval(() => {
        cargarResumenCaja(cajaActiva._id);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setResumenCaja(null);
    }
  }, [cajas]);

  const cargarCajas = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await CajasService.obtenerCajasEmpresa(companyId, searchParams);
      const dataCajas = response.data?.cajas || (Array.isArray(response.data) ? response.data : []);
      setCajas(dataCajas);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      console.error('Error cargando cajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenCaja = async (idCaja) => {
    if (!idCaja) return;
    setLoadingResumen(true);
    try {
      const response = await CajasService.obtenerResumenCaja(idCaja);
      setResumenCaja(response.data);
    } catch (error) {
      console.error('Error cargando resumen de caja:', error);
    } finally {
      setLoadingResumen(false);
    }
  };

  const handleVerDetalleCaja = async (idCaja) => {
    setCajaDetalleModal({ open: true, id: idCaja, data: null, loading: true });
    try {
      const response = await CajasService.obtenerResumenCaja(idCaja);
      setCajaDetalleModal(prev => ({ ...prev, data: response.data, loading: false }));
    } catch (error) {
      console.error('Error cargando detalle de caja:', error);
      Swal.fire('Error', 'No se pudo cargar el detalle de la caja', 'error');
      setCajaDetalleModal({ open: false, id: null, data: null, loading: false });
    }
  };

  const handleTransaccionManual = async (tipo) => {
    const { value: formValues } = await Swal.fire({
      title: tipo === 'ingreso' ? 'Registrar Ingreso de Efectivo' : 'Registrar Gasto / Salida',
      html: `
        <div style="text-align: left; font-family: sans-serif;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">Monto ($):</label>
          <input type="number" id="montoTrans" step="0.01" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.2rem; font-weight: bold; text-align: center;" placeholder="0.00" />
          
          <label style="display: block; margin-top: 15px; margin-bottom: 8px; font-weight: 600; color: #334155;">Descripción / Motivo:</label>
          <textarea id="descTrans" placeholder="Ej: Pago de flete, retiro para cambio, etc." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; height: 60px; font-family: sans-serif;"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      confirmButtonColor: tipo === 'ingreso' ? '#28a745' : '#d9534f',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const monto = parseFloat(document.getElementById('montoTrans').value);
        const descripcion = document.getElementById('descTrans').value;
        if (isNaN(monto) || monto <= 0) {
          Swal.showValidationMessage('Por favor ingresa un monto válido mayor a 0');
          return false;
        }
        if (!descripcion.trim()) {
          Swal.showValidationMessage('Por favor ingresa una descripción');
          return false;
        }
        return { tipo, monto, descripcion };
      }
    });

    if (formValues && cajaActiva) {
      try {
        await CajasService.agregarTransaccion(cajaActiva._id, formValues);
        Swal.fire('¡Éxito!', 'Movimiento registrado correctamente', 'success');
        cargarCajas(); // Recargar para actualizar el resumen
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al registrar movimiento', 'error');
      }
    }
  };

  const cargarPuntosVenta = async () => {
    if (!companyId) return;
    try {
      // No necesitamos paginación para la lista de puntos de venta en el filtro
      const response = await puntosVentaService.obtenerPuntosVenta(companyId, { limit: 1000 }); 
      const puntos = response.data?.puntosDeVenta || response.data || [];
      setPuntosVenta(puntos);
    } catch (error) {
      console.error('Error cargando puntos de venta:', error);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 })); // Resetear a la primera página en cada búsqueda
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (newSortBy) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: newSortBy,
      order: prev.sortBy === newSortBy && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setSearchParams(prev => ({ ...prev, page: 1 })); // Recargar la primera página
    cargarCajas();
    cargarPuntosVenta();
    Swal.fire({
      title: '¡Caja Abierta!',
      text: 'La caja se abrió correctamente',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const cajaActiva = cajas.find(c => c.estado && c.estado.toLowerCase() === 'abierta');

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Gestión de Cajas</h1>
        <p style={{ color: '#666', margin: 0 }}>Registra y controla los movimientos de caja</p>
      </div>

      {/* ESTADO DE CAJA ABIERTA */}
      {cajaActiva && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#1a202c', fontSize: '1.5rem' }}>Estado de Caja Actual</h2>
              <p style={{ margin: '4px 0 0 0', color: '#718096' }}>
                Abierta por {cajaActiva.vendedorAsignado?.nombre || 'Usuario'} el {new Date(cajaActiva.fechaApertura || cajaActiva.horaApertura).toLocaleString('es-AR')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => cargarResumenCaja(cajaActiva._id)}
                disabled={loadingResumen}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  backgroundColor: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  cursor: loadingResumen ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#475569',
                  fontWeight: '600'
                }}
              >
                {loadingResumen ? '⌛ Cargando...' : '🔄 Actualizar'}
              </button>
              <span style={{ 
                backgroundColor: '#def7ec', 
                color: '#03543f', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                ● ABIERTA
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Monto Inicial</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                ${cajaActiva.montoInicial?.toLocaleString() || cajaActiva.montoApertura?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
              <span style={{ color: '#166534', fontSize: '0.875rem' }}>Ventas Totales</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#15803d' }}>
                ${resumenCaja?.ventas?.total?.toLocaleString() || '0'}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <span style={{ color: '#991b1b', fontSize: '0.875rem' }}>Gastos / Egresos</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#b91c1c' }}>
                ${resumenCaja?.movimientosManuales?.egresos?.toLocaleString() || '0'}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <span style={{ color: '#1e40af', fontSize: '0.875rem' }}>Efectivo Esperado</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1d4ed8' }}>
                ${resumenCaja?.totales?.saldoEfectivoEsperado?.toLocaleString() || '0'}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fdf4ff', borderRadius: '8px', border: '1px solid #f5d0fe' }}>
              <span style={{ color: '#701a75', fontSize: '0.875rem' }}>Total General</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#86198f' }}>
                ${resumenCaja?.totales?.montoFinalEsperado?.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          {resumenCaja && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', border: '1px solid #edf2f7', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Desglose por Forma de Pago</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {Object.entries(resumenCaja.ventas.detallePorMetodo).map(([metodo, info]) => (
                  <div key={metodo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: metodo === 'Contado' ? '#10b981' : '#3b82f6' 
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{metodo}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600' }}>${info.total.toLocaleString()}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{info.cantidad} ventas</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* LISTA DE MOVIMIENTOS MANUALES */}
              <h4 style={{ margin: '20px 0 12px 0', fontSize: '0.9rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Movimientos Manuales (Ingresos/Egresos)</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Tipo</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cajaActiva.transacciones && cajaActiva.transacciones.length > 0 ? (
                      cajaActiva.transacciones.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px', color: t.tipo === 'ingreso' ? '#166534' : '#b91c1c', fontWeight: '600' }}>
                            {t.tipo.toUpperCase()}
                          </td>
                          <td style={{ padding: '8px', color: '#475569' }}>{t.descripcion}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                            ${t.monto.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>No hay movimientos manuales registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* HISTORIAL DE VENTAS (TICKETS/FACTURAS) */}
              <h4 style={{ margin: '20px 0 12px 0', fontSize: '0.9rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Historial de Ventas (Detalle de Productos)</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Hora/ID</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Productos</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Pago</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenCaja.ventas.historial && resumenCaja.ventas.historial.length > 0 ? (
                      resumenCaja.ventas.historial.map((venta, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: '600' }}>{new Date(venta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{venta.ventaId}</div>
                          </td>
                          <td style={{ padding: '8px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {venta.items.map((item, iIdx) => (
                                <div key={iIdx} style={{ fontSize: '0.8rem' }}>
                                  <span style={{ fontWeight: '600', color: '#475569' }}>{item.cantidad}x</span> {item.descripcion}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '8px', verticalAlign: 'top' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              backgroundColor: venta.pago?.metodo === 'Contado' ? '#dcfce7' : '#dbeafe',
                              color: venta.pago?.metodo === 'Contado' ? '#166534' : '#1e40af',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {venta.pago?.metodo || 'S/D'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#1e293b', verticalAlign: 'top' }}>
                            ${venta.totales?.totalPagar?.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No se registran ventas en este turno de caja</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn"
              style={{
                backgroundColor: '#d9534f',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
              onClick={() => {
                const montoEsperado = resumenCaja?.totales?.montoFinalEsperado || 0;
                const ventasTotales = resumenCaja?.ventas?.total || 0;
                const fondoInicial = cajaActiva.montoInicial || cajaActiva.montoApertura || 0;
                const gastos = resumenCaja?.movimientosManuales?.egresos || 0;

                Swal.fire({
                  title: 'Cerrar Caja (Arqueo)',
                  html: `
                    <div style="text-align: left; font-family: sans-serif;">
                      <p style="margin-bottom: 20px; color: #666;">Confirma el balance final de la jornada.</p>
                      
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 0.8rem;">Fondo Inicial:</span>
                          <div style="font-size: 1.1rem; font-weight: bold; color: #1e293b;">$${fondoInicial.toLocaleString()}</div>
                        </div>
                        <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #dcfce7;">
                          <span style="color: #15803d; font-size: 0.8rem;">Ventas Totales:</span>
                          <div style="font-size: 1.1rem; font-weight: bold; color: #15803d;">$${ventasTotales.toLocaleString()}</div>
                        </div>
                        <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fee2e2;">
                          <span style="color: #b91c1c; font-size: 0.8rem;">Gastos:</span>
                          <div style="font-size: 1.1rem; font-weight: bold; color: #b91c1c;">$${gastos.toLocaleString()}</div>
                        </div>
                        <div style="background: #eff6ff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe;">
                          <span style="color: #1d4ed8; font-size: 0.8rem;">Monto a Rendir:</span>
                          <div style="font-size: 1.1rem; font-weight: bold; color: #1d4ed8;">$${montoEsperado.toLocaleString()}</div>
                        </div>
                      </div>

                      <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">Efectivo + Comprobantes Reales ($):</label>
                      <input type="number" id="montoCierre" value="${montoEsperado}" step="0.01" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.2rem; font-weight: bold; text-align: center; color: #1e293b;" />
                      
                      <label style="display: block; margin-top: 15px; margin-bottom: 8px; font-weight: 600; color: #334155;">Observaciones de Cierre:</label>
                      <textarea id="obsCierre" placeholder="Ej: Todo correcto, faltante de $10 por redondeo, etc." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; height: 60px; font-family: sans-serif;"></textarea>
                    </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: 'Confirmar Cierre',
                  confirmButtonColor: '#d9534f',
                  cancelButtonText: 'Cancelar',
                  preConfirm: () => {
                    const monto = parseFloat(document.getElementById('montoCierre').value);
                    const obs = document.getElementById('obsCierre').value;
                    if (isNaN(monto)) {
                      Swal.showValidationMessage('Por favor ingresa un monto válido');
                    }
                    return { montoFinalReal: monto, observacionesCierre: obs };
                  }
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    try {
                      await CajasService.cerrarCaja(cajaActiva._id, result.value);
                      Swal.fire('¡Caja Cerrada!', 'El arqueo se guardó correctamente', 'success');
                      cargarCajas();
                    } catch (error) {
                      Swal.fire('Error', error.response?.data?.message || 'Error al cerrar caja', 'error');
                    }
                  }
                });
              }}
            >
              Cerrar Caja (Arqueo Final)
            </button>
            
            <button
              className="btn"
              style={{
                backgroundColor: '#fff',
                color: '#4a5568',
                border: '1px solid #cbd5e1',
                padding: '12px 24px',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => handleTransaccionManual('egreso')}
            >
              <ArrowDownCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar Gasto
            </button>
            <button
              className="btn"
              style={{
                backgroundColor: '#fff',
                color: '#166534',
                border: '1px solid #bcf0da',
                padding: '12px 24px',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => handleTransaccionManual('ingreso')}
            >
              <ArrowUpCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar Ingreso
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN ABRIR CAJA */}
      {!cajaActiva && (
        <div style={{ marginBottom: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (puntosVenta.length === 0) {
                Swal.fire('Error', 'No hay puntos de venta configurados', 'error');
                return;
              }
              // setSelectedPuntoVenta(puntosVenta[0]); // No longer needed
              setModalOpen(true);
            }}
          >
            + Abrir Nueva Caja
          </button>
        </div>
      )}

      {/* HISTORIAL DE CAJAS */}
      <div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', fontWeight: '600' }}>Historial de Cajas</h2>
        
        {/* FILTROS DE BÚSQUEDA */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '10px', 
          marginBottom: '20px',
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Búsqueda</label>
            <input 
              type="text" 
              name="search" 
              value={searchParams.search} 
              onChange={handleSearchChange} 
              placeholder="Buscar por nombre..." 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Estado</label>
            <select 
              name="estado" 
              value={searchParams.estado} 
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              <option value="">Todos</option>
              <option value="abierta">Abierta</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Fecha Desde</label>
            <input 
              type="date" 
              name="fechaDesde" 
              value={searchParams.fechaDesde} 
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Fecha Hasta</label>
            <input 
              type="date" 
              name="fechaHasta" 
              value={searchParams.fechaHasta} 
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {cajas.length > 0 ? (
          <>
            <div className="table-container" style={{ border: '1px solid #eee' }}>
              <table className="office-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Fecha Apertura</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Monto Apertura</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Monto Cierre</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Diferencia</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cajas.map((caja) => (
                    <tr 
                      key={caja._id} 
                      style={{ 
                        borderBottom: '1px solid #eee', 
                        cursor: caja.estado === 'Cerrada' ? 'pointer' : 'default',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => caja.estado === 'Cerrada' && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseOut={(e) => caja.estado === 'Cerrada' && (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => caja.estado === 'Cerrada' && handleVerDetalleCaja(caja._id)}
                    >
                      <td style={{ padding: '12px' }}>
                        {caja.horaApertura || caja.fechaApertura ? new Date(caja.horaApertura || caja.fechaApertura).toLocaleString('es-AR') : '---'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        ${(caja.montoApertura || caja.montoInicial)?.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        ${caja.montoFinalReal ? caja.montoFinalReal.toLocaleString() : '---'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          color: (caja.diferencia || 0) === 0 ? '#28a745' : '#d9534f',
                          fontWeight: '600'
                        }}>
                          ${caja.diferencia?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: caja.estado === 'Abierta' ? '#ffc107' : '#28a745',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          {caja.estado === 'Abierta' ? 'Abierta' : 'Cerrada'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {caja.estado === 'Cerrada' && (
                          <button
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            👁️ Ver Detalle
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '20px' }}>
                <button 
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Anterior
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    style={{ 
                      padding: '5px 10px', 
                      borderRadius: '4px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: pagination.currentPage === i + 1 ? '#3b82f6' : '#fff',
                      color: pagination.currentPage === i + 1 ? '#fff' : '#000',
                      cursor: 'pointer'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <p style={{ color: '#999' }}>No hay registros de cajas aún</p>
          </div>
        )}
      </div>

      {/* MODAL ABRIR CAJA */}
      <ModalGenerico
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPuntoVenta(null);
        }}
        title="Abrir Nueva Caja"
        width="500px"
      >
        <AbrirCajaForm
          puntoVenta={selectedPuntoVenta}
          puntosVenta={puntosVenta}
          onSuccess={handleSuccess}
        />
      </ModalGenerico>

      {/* MODAL DETALLE DE CAJA CERRADA */}
      <ModalGenerico
        isOpen={cajaDetalleModal.open}
        onClose={() => setCajaDetalleModal({ open: false, id: null, data: null, loading: false })}
        title={`Detalle de Caja - ${cajaDetalleModal.data ? new Date(cajaDetalleModal.data.montoInicial ? cajaDetalleModal.id : Date.now()).toLocaleDateString() : ''}`}
        width="900px"
      >
        {cajaDetalleModal.loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Cargando información detallada...</p>
          </div>
        ) : cajaDetalleModal.data ? (
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>MONTO INICIAL</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>${cajaDetalleModal.data.montoInicial?.toLocaleString()}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>VENTAS TOTALES</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#15803d' }}>${cajaDetalleModal.data.ventas?.total?.toLocaleString()}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: '600' }}>EGRESOS/GASTOS</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#b91c1c' }}>${cajaDetalleModal.data.movimientosManuales?.egresos?.toLocaleString()}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>SALDO FINAL</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1d4ed8' }}>${cajaDetalleModal.data.totales?.montoFinalEsperado?.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* DESGLOSE PAGOS */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>DESGLOSE POR FORMA DE PAGO</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {Object.entries(cajaDetalleModal.data.ventas.detallePorMetodo).map(([metodo, info]) => (
                    <div key={metodo} style={{ flex: '1 1 140px', padding: '10px', backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{metodo}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600' }}>${info.total.toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{info.cantidad} tickets</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '0.9rem', margin: '20px 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>MOVIMIENTOS MANUALES</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '5px' }}>Tipo</th>
                        <th style={{ textAlign: 'left', padding: '5px' }}>Descripción</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cajaDetalleModal.data.movimientosManuales.detalle && cajaDetalleModal.data.movimientosManuales.detalle.length > 0 ? (
                        cajaDetalleModal.data.movimientosManuales.detalle.map((t, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '5px', color: t.tipo === 'ingreso' ? '#166534' : '#b91c1c', fontWeight: '600' }}>
                              {t.tipo.toUpperCase()}
                            </td>
                            <td style={{ padding: '5px', color: '#475569' }}>{t.descripcion}</td>
                            <td style={{ padding: '5px', textAlign: 'right', fontWeight: '600' }}>
                              ${t.monto.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>Sin movimientos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HISTORIAL VENTAS */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>HISTORIAL DE VENTAS (PRODUCTOS)</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {cajaDetalleModal.data.ventas.historial.map((venta, idx) => (
                    <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{new Date(venta.fechaHora).toLocaleTimeString()}</span>
                        <span style={{ fontWeight: '700' }}>${venta.totales.totalPagar.toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {venta.items.map(item => `${item.cantidad}x ${item.descripcion}`).join(', ')}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '2px 5px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>{venta.pago.metodo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>No se pudo cargar la información.</div>
        )}
      </ModalGenerico>
    </div>
  );
};

export default GestionCajas;
