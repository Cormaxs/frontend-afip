import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ReportesService } from '../../services/reportes/reportes.js';
import Swal from 'sweetalert2';
import api from '../../api/api.js';
import { countSales } from '../../utils/offlineQueue.js';
import { syncOfflineQueue } from '../../services/offline/offline.js';

const Reportes = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [granularity, setGranularity] = useState('daily');
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    if (user?.empresa) {
      cargarDatos(activeTab);
      updateOfflineCount();
    }
  }, [activeTab, user?.empresa]);

  useEffect(() => {
    // recargar cuando cambian filtros de periodo/granularidad
    if (user?.empresa) cargarDatos(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, granularity]);

  const cargarDatos = async (tab) => {
    if (!user?.empresa) return;
    setLoading(true);
    try {
      let response;
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      if (granularity) params.granularity = granularity;
      switch (tab) {
        case 'resumen':
          response = await ReportesService.obtenerResumenVentas(user.empresa, { params });
          break;
        case 'masVendidos':
          response = await ReportesService.obtenerMasVendidos(user.empresa, { params });
          break;
        case 'menosVendidos':
          response = await ReportesService.obtenerMenosVendidos(user.empresa, { params });
          break;
        case 'stock':
          response = await ReportesService.obtenerAlertasStock(user.empresa, { params });
          break;
        case 'productos':
          response = await ReportesService.obtenerReporteProductos(user.empresa, params);
          break;
        case 'finanzas':
          response = await ReportesService.obtenerResumenFinanciero(user.empresa, params);
          break;
        default:
          response = null;
      }
      setData(response?.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire('Error',  'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  async function updateOfflineCount(){
    try{ const c = await countSales(); setOfflineCount(c);}catch(e){setOfflineCount(0)}
  }

  async function downloadCsv(){
    if(!user?.empresa) return Swal.fire('Error','Empresa no disponible','error');
    try{
      const res = await api.get(`/api/v1/products/export.csv?empresa=${user.empresa}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; document.body.appendChild(a); a.click(); a.remove();
    }catch(err){ console.error(err); Swal.fire('Error','No se pudo exportar CSV','error') }
  }

  async function downloadXlsx(){
    if(!user?.empresa) return Swal.fire('Error','Empresa no disponible','error');
    try{
      const res = await api.get(`/api/v1/products/export.xlsx?empresa=${user.empresa}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'products.xlsx'; document.body.appendChild(a); a.click(); a.remove();
    }catch(err){ console.error(err); Swal.fire('Error','No se pudo exportar XLSX','error') }
  }

  async function handleSyncOffline(){
    try{
      setLoading(true);
      const result = await syncOfflineQueue();
      await updateOfflineCount();
      Swal.fire('Sync', `Sincronizadas: ${result?.sincronizadas || 0}, errores: ${result?.errores || 0}`,'success');
    }catch(err){ console.error(err); Swal.fire('Error','No se pudo sincronizar','error'); }
    finally{ setLoading(false); }
  }

  const tabs = [
    { id: 'resumen', label: 'Resumen Ventas', shortcut: 'F1', icon: '📊' },
    { id: 'masVendidos', label: 'Más Vendidos', shortcut: 'F2', icon: '🔝' },
    { id: 'menosVendidos', label: 'Menos Vendidos', shortcut: 'F3', icon: '🔻' },
    { id: 'stock', label: 'Alertas Stock', shortcut: 'F4', icon: '⚠️' },
    { id: 'productos', label: 'Productos', shortcut: 'F5', icon: '📦' },
    { id: 'finanzas', label: 'Finanzas', shortcut: 'F6', icon: '💰' }
  ];

  useEffect(() => {
    const handleFunctionKeys = (event) => {
      if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.target?.isContentEditable) return;

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          setActiveTab('resumen');
          break;
        case 'F2':
          event.preventDefault();
          setActiveTab('masVendidos');
          break;
        case 'F3':
          event.preventDefault();
          setActiveTab('menosVendidos');
          break;
        case 'F4':
          event.preventDefault();
          setActiveTab('stock');
          break;
        case 'F5':
          event.preventDefault();
          setActiveTab('productos');
          break;
        case 'F6':
          event.preventDefault();
          setActiveTab('finanzas');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleFunctionKeys);
    return () => window.removeEventListener('keydown', handleFunctionKeys);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Reportes y Estadísticas</h1>
        <p style={{ color: '#666', margin: 0 }}>Análisis de ventas, inventario y desempeño</p>
        <div style={{ float: 'right' }}>
          <button onClick={downloadCsv} style={{ marginRight: '8px' }} className="btn">Exportar CSV</button>
          <button onClick={downloadXlsx} style={{ marginRight: '12px' }} className="btn">Exportar XLSX</button>
          <button onClick={handleSyncOffline} className="btn" style={{ background: offlineCount>0 ? '#ff9800' : '#eee' }}>Sync Offline ({offlineCount})</button>
        </div>
      </div>

      {/* FILTROS PERIODO / GRANULARIDAD */}
      <div style={{ display: 'flex', gap: '12px', margin: '16px 0', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>Desde</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>Hasta</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>Granularidad</label>
          <select value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === tab.id ? '#28a4d5' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #28a4d5' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '-2px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={`${tab.label} (${tab.shortcut})`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{ fontSize: '0.82rem', opacity: 0.8, color: activeTab === tab.id ? '#e2f2ff' : '#999' }}>{tab.shortcut}</span>
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#999' }}>Cargando datos...</p>
        </div>
      ) : data ? (
        <div>
          {activeTab === 'resumen' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderLeft: '4px solid #28a4d5',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Ingresos Totales</p>
                  <h2 style={{ margin: 0, color: '#28a4d5', fontSize: '2rem' }}>
                    ${data.totalRevenue?.toLocaleString() || 0}
                  </h2>
                </div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderLeft: '4px solid #28a745',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Total Ventas</p>
                  <h2 style={{ margin: 0, color: '#28a745', fontSize: '2rem' }}>
                    {data.totalTickets || 0}
                  </h2>
                </div>
                <div style={{
                  backgroundColor: '#fef3c7',
                  borderLeft: '4px solid #ff9800',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Ticket Promedio</p>
                  <h2 style={{ margin: 0, color: '#ff9800', fontSize: '2rem' }}>
                    ${data.averageTicket?.toLocaleString() || 0}
                  </h2>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#333' }}>Métodos de pago</h3>
                  {(data.paymentMethods || []).length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {data.paymentMethods.map((method, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: index < data.paymentMethods.length - 1 ? '1px solid #f1f1f1' : 'none' }}>
                          <div>
                            <strong>{method.metodo}</strong>
                            <div style={{ fontSize: '0.82rem', color: '#666' }}>{method.count} ventas</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700 }}>${(method.totalAmount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', margin: 0 }}>No se encontraron métodos de pago.</p>
                  )}
                </div>

                <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#333' }}>Tipos de documento</h3>
                  {(data.documentTypes || []).length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {data.documentTypes.map((doc, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: index < data.documentTypes.length - 1 ? '1px solid #f1f1f1' : 'none' }}>
                          <div>
                            <strong>{doc.tipo}</strong>
                            <div style={{ fontSize: '0.82rem', color: '#666' }}>{doc.count} registros</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700 }}>${(doc.totalAmount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', margin: 0 }}>No hay documentos registrados.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'productos' && (
            <div className="table-container" style={{ border: '1px solid #eee' }}>
              <table className="office-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Producto</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Stock</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Costo</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Precio</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Ganancia/U</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Vendidos</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.products || []).map((p, idx) => (
                    <tr key={String(p._id) + idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>{p.producto}</strong><div style={{ fontSize: '0.85rem', color: '#666' }}>{p.descripcion}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{p.stock_disponible}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>${(p.precioCosto || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>${(p.precioLista || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>${(p.gananciaUnitaria || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{p.cantidadVendida || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>${(p.revenueFromSales || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'finanzas' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Ingresos</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.income || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#fff7f0', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Egresos (caja)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.cajaEgresos || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Compras</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.compras || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#eef2ff', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>COGS (estimado)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.cogs || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#fff1f0', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Ganancia Bruta</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.grossProfit || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#f0fff4', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Ganancia Neta</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.netProfit || 0).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff7f0', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Cajas abiertas</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.cash?.cajasAbiertas || 0}</div>
                </div>
                <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Cajas cerradas</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.cash?.cajasCerradas || 0}</div>
                </div>
                <div style={{ background: '#eef2ff', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Compras proveedor</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.comprasProveedores || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#fff1f0', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Pagado a proveedores</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.totalPagadoProveedor || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#f0fff4', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Pendiente proveedores</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.pendienteProveedores || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#fffaf0', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Vencido proveedores</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${(data.totals?.vencidoProveedores || 0).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #eee' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#333' }}>Historial de caja</h3>
                  {(data.cash?.cajaHistory || []).length > 0 ? (
                    <div style={{ maxHeight: '260px', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Caja</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Ingresos</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Egresos</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.cash.cajaHistory.map((caja, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                              <td style={{ padding: '8px' }}>{caja.nombreCaja || caja._id || 'Caja'}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>${(caja.ingresos || 0).toLocaleString()}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>${(caja.egresos || 0).toLocaleString()}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{caja.estado || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#666', margin: 0 }}>No hay historial de caja disponible.</p>
                  )}
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #eee' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#333' }}>Cuenta proveedores</h3>
                  {(data.suppliers?.purchaseHistory || []).length > 0 ? (
                    <div style={{ maxHeight: '260px', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Proveedor</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Pendiente</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Vence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.suppliers.purchaseHistory.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                              <td style={{ padding: '8px' }}>{item.proveedor?.nombre || 'Sin proveedor'}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>${(item.montoTotal || 0).toLocaleString()}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>${(item.montoPendiente || 0).toLocaleString()}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#666', margin: 0 }}>No hay compras a proveedores en el periodo.</p>
                  )}
                </div>
              </div>

              {data.series && data.series.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ margin: '8px 0' }}>Serie ({granularity})</h3>
                  <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px' }}>Periodo</th>
                          <th style={{ padding: '8px' }}>Ingresos</th>
                          <th style={{ padding: '8px' }}>Tickets</th>
                          <th style={{ padding: '8px' }}>Egresos</th>
                          <th style={{ padding: '8px' }}>Compras</th>
                          <th style={{ padding: '8px' }}>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.series.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <td style={{ padding: '8px' }}>{s.period}</td>
                            <td style={{ padding: '8px' }}>${(s.revenue || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>{s.tickets || 0}</td>
                            <td style={{ padding: '8px' }}>${(s.egresos || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>${(s.compras || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>${(s.netProfit || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'masVendidos' || activeTab === 'menosVendidos') && (
            <div className="table-container" style={{ border: '1px solid #eee' }}>
              <table className="office-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Producto</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Cantidad Vendida</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.sellers || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>{item.nombre}</strong>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.cantidad}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        ${item.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stock' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#fff7f0', borderRadius: '8px', padding: '16px', border: '1px solid #ffe0cc' }}>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Bajo Stock Mínimo</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px' }}>
                    {(data.overview?.lowStockWarningCount || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fff1f0', borderRadius: '8px', padding: '16px', border: '1px solid #ffd6d6' }}>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Agotados</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px' }}>
                    {(data.overview?.outOfStockCount || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9f9ff', borderRadius: '8px', padding: '16px', border: '1px solid #dedeff' }}>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Total alertas</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px' }}>
                    {(data.alerts || []).length.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="table-container" style={{ border: '1px solid #eee' }}>
                <table className="office-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Producto</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Stock Actual</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Stock Mínimo</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.alerts || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>
                          <strong>{item.nombre}</strong>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {item.stockActual}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {item.stockMinimo}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: item.tipo === 'AGOTADO' ? '#d9534f' : '#ff9800',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem'
                          }}>
                            {item.tipo === 'AGOTADO' ? '🔴 Agotado' : '🟡 Stock Bajo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ color: '#999' }}>No hay datos disponibles aún</p>
        </div>
      )}
    </div>
  );
};

export default Reportes;
