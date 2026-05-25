import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { CajasService } from '../../services/cajas/cajas.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import AbrirCajaForm from '../../components/cajas/AbrirCajaForm.jsx';

const GestionCajas = () => {
  const { user, empresa } = useAuth();
  const companyId = empresa?._id || empresa?.id || user?.empresa || user?.empresaId || user?.companyId;
  const [cajas, setCajas] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState(null);
  const [resumenCaja, setResumenCaja] = useState(null);

  useEffect(() => {
    if (companyId) {
      cargarCajas();
      cargarPuntosVenta();
    }
  }, [companyId]);

  useEffect(() => {
    const cajaActiva = cajas.find(c => c.estado === 'Abierta');
    if (cajaActiva) {
      cargarResumenCaja(cajaActiva._id);
    } else {
      setResumenCaja(null);
    }
  }, [cajas]);

  const cargarCajas = async () => {
    const idEmpresa = companyId || user?.empresa;
    if (!idEmpresa) return;
    setLoading(true);
    try {
      const response = await CajasService.obtenerCajasEmpresa(idEmpresa);
      setCajas(response.data?.cajas || []);
    } catch (error) {
      console.error('Error cargando cajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenCaja = async (idCaja) => {
    try {
      const response = await CajasService.obtenerResumenCaja(idCaja);
      setResumenCaja(response.data);
    } catch (error) {
      console.error('Error cargando resumen de caja:', error);
    }
  };

  const cargarPuntosVenta = async () => {
    const idEmpresa = companyId || user?.empresa;
    if (!idEmpresa) return;
    try {
      const response = await puntosVentaService.obtenerPuntosVenta(idEmpresa);
      const puntos = response.data?.puntosDeVenta || [];
      setPuntosVenta(puntos);
      if (!selectedPuntoVenta && puntos.length > 0) {
        setSelectedPuntoVenta(puntos[0]);
      }
    } catch (error) {
      console.error('Error cargando puntos de venta:', error);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setSelectedPuntoVenta(null);
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

  const cajaActiva = cajas.find(c => c.estado === 'Abierta');

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
          </div>

          {resumenCaja && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', border: '1px solid #edf2f7', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Desglose por Forma de Pago</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
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
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => {
                Swal.fire({
                  title: 'Registrar Gasto / Salida',
                  html: `
                    <div style="text-align: left;">
                      <label style="display: block; margin-bottom: 8px;">Monto ($):</label>
                      <input type="number" id="montoGasto" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
                      <label style="display: block; margin-top: 15px; margin-bottom: 8px;">Descripción / Concepto:</label>
                      <input type="text" id="descGasto" placeholder="Ej: Pago de flete, limpieza, etc." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
                    </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: 'Registrar Salida',
                  preConfirm: () => {
                    const monto = parseFloat(document.getElementById('montoGasto').value);
                    const desc = document.getElementById('descGasto').value;
                    if (!monto || isNaN(monto)) Swal.showValidationMessage('Monto requerido');
                    if (!desc) Swal.showValidationMessage('Descripción requerida');
                    return { tipo: 'egreso', monto, descripcion: desc };
                  }
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    try {
                      await CajasService.agregarTransaccion(cajaActiva._id, result.value);
                      Swal.fire('¡Registrado!', 'El movimiento se descontó de la caja', 'success');
                      cargarCajas();
                    } catch (error) {
                      Swal.fire('Error', 'No se pudo registrar el movimiento', 'error');
                    }
                  }
                });
              }}
            >
              💸 Registrar Gasto
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
              setSelectedPuntoVenta(puntosVenta[0]);
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
        {cajas.length > 0 ? (
          <div className="table-container" style={{ border: '1px solid #eee' }}>
            <table className="office-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Fecha Apertura</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Monto Apertura</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Monto Cierre</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Diferencia</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cajas.map((caja) => (
                  <tr key={caja._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      {caja.horaApertura ? new Date(caja.horaApertura).toLocaleString('es-AR') : '---'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      ${caja.montoApertura?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      ${caja.montoFinalReal ? caja.montoFinalReal.toLocaleString() : '---'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        color: caja.diferencia === 0 ? '#28a745' : '#d9534f',
                        fontWeight: '600'
                      }}>
                        ${caja.diferencia?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: caja.estado === 'Abierta' ? '#ffc107' : '#28a745',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                      }}>
                        {caja.estado === 'Abierta' ? '📂 Abierta' : '✓ Cerrada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default GestionCajas;
