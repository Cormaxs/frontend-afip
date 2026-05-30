import React, { useState, useEffect, useCallback } from 'react';
import { facturasService } from '../../services/afip/facturas/facturacion.js'; 
import { ticketsService } from '../../services/tickets/tickets.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import GenericTable from '../../components/tables/GenericTable.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import { AFIP_TIPOS_COMPROBANTE, AFIP_DOC_TIPOS, CONDICIONES_IVA_RECEPTOR } from '../../constants/afipConstants.js';
import './BuscadorFacturas.css';
import Swal from 'sweetalert2';

const BuscadorFacturas = () => {
  const { user, empresa } = useAuth();
  const [tipoVista, setTipoVista] = useState('facturas');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState(null);
  const [editandoNota, setEditandoNota] = useState(false);

  // Filtros para Facturas
  const [filtrosFacturas, setFiltrosFacturas] = useState({
    estado: '',
    tipoComprobante: '',
    desde: undefined,
    hasta: undefined,
    numero: undefined,
    puntoVenta: undefined,
    cuitReceptor: undefined,
    cae: undefined,
    limit: 10
  });

  // Filtros para Tickets
  const [filtrosTickets, setFiltrosTickets] = useState({
    search: '',
    limit: 10
  });

  // Filtros para Notas de Pedido
  const [filtrosNotas, setFiltrosNotas] = useState({
    status: '',
    limit: 10
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (tipoVista === 'facturas') {
      setFiltrosFacturas(prev => ({
        ...prev,
        [name]: value === "" ? undefined : value
      }));
    } else if (tipoVista === 'tickets') {
      setFiltrosTickets(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFiltrosNotas(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const fetchDatos = useCallback(async (page = 1) => {
    setLoading(true);
    setResultados([]);
    try {
      if (tipoVista === 'facturas') {
        if (!user?.idDbAfip) return;
        const filtrosFormateados = { ...filtrosFacturas };
        if (filtrosFormateados.puntoVenta) filtrosFormateados.puntoVenta = filtrosFormateados.puntoVenta.toString().padStart(5, '0');
        if (filtrosFormateados.numero) filtrosFormateados.numero = filtrosFormateados.numero.toString().padStart(8, '0');
        const cleanFilters = Object.fromEntries(Object.entries(filtrosFormateados).filter(([_, v]) => v !== undefined && v !== ""));
        const params = { userId: user.idDbAfip, ...cleanFilters, page: page.toString() };
        const response = await facturasService.buscarFacturas(params);
        setResultados(response.data.data || []);
        if (response.data.paginacion) {
          setPagination({ page: response.data.paginacion.page, total: response.data.paginacion.total, limit: response.data.paginacion.limit, pages: response.data.paginacion.totalPages });
        }
      } else if (tipoVista === 'tickets') {
        if (!empresa?._id) return;
        const params = { ...filtrosTickets, page: page.toString() };
        const response = await ticketsService.getTickets(empresa._id, params);
        setResultados(response.data.data || []);
        if (response.data.paginacion) {
          setPagination({ page: response.data.paginacion.page, total: response.data.paginacion.total, limit: response.data.paginacion.limit, pages: response.data.paginacion.totalPages });
        }
      } else {
        if (!empresa?._id) return;
        const params = { ...filtrosNotas, page: page.toString() };
        const response = await ticketsService.getNotasPedido(empresa._id, params);
        setResultados(response.data.data || []);
        if (response.data.paginacion) {
          setPagination({ page: response.data.paginacion.page, total: response.data.paginacion.total, limit: response.data.paginacion.limit, pages: response.data.paginacion.totalPages });
        }
      }
    } catch (err) {
      console.error(`Error en búsqueda de ${tipoVista}:`, err);
    } finally {
      setLoading(false);
    }
  }, [user?.idDbAfip, empresa?._id, tipoVista, filtrosFacturas, filtrosTickets, filtrosNotas]);

  useEffect(() => {
    fetchDatos(1);
  }, [fetchDatos]);

  const handleVerPdf = async (item) => {
    if (tipoVista === 'notasPedido') {
        setNotaSeleccionada(item);
        setEditandoNota(false);
        setShowModal(true);
        return;
    }
    try {
      let response;
      if (tipoVista === 'facturas') {
        response = await facturasService.recuperarFactura(item._id);
      } else if (tipoVista === 'tickets') {
        response = await ticketsService.recuperarTicket(item._id);
      } else {
        // Nota de pedido
        response = await ticketsService.recuperarNotaPedidoPdf(item._id);
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowModal(true);
    } catch (err) {
      console.error(`No se pudo recuperar el comprobante (${tipoVista})`, err);
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setNotaSeleccionada(null);
    setEditandoNota(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleSaveNotaEdit = async (idNota, nuevosDatos) => {
    setLoading(true);
    try {
        await ticketsService.updateNotaPedidoData(idNota, nuevosDatos);
        Swal.fire('¡Actualizado!', 'La nota de pedido se ha guardado correctamente.', 'success');
        fetchDatos(pagination.page);
        cerrarModal();
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar la nota.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleVerPdfDesdeDetalle = async (idNota) => {
    try {
        const response = await ticketsService.recuperarNotaPedidoPdf(idNota);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (err) {
        Swal.fire('Error', 'No se pudo recuperar el PDF del pedido.', 'error');
    }
  };

  const resetFiltros = (vista = tipoVista) => {
    setResultados([]);
    if (vista === 'facturas') {
      setFiltrosFacturas({
        estado: '',
        tipoComprobante: '',
        desde: undefined,
        hasta: undefined,
        numero: undefined,
        puntoVenta: undefined,
        cuitReceptor: undefined,
        cae: undefined,
        limit: 10
      });
    } else if (vista === 'tickets') {
      setFiltrosTickets({
        search: '',
        limit: 10
      });
    } else {
      setFiltrosNotas({
        status: '',
        limit: 10
      });
    }
  };

  const handleUpdateNPStatus = async (idNota, nuevoEstado) => {
    try {
        const response = await ticketsService.updateNotaPedidoStatus(idNota, {
            estado: nuevoEstado,
            idUsuario: user._id || user.id,
            idEmpresa: empresa._id
        });
        
        if (nuevoEstado === 'ENTREGADO') {
            Swal.fire('¡Pedido Aprobado!', 'Se ha generado el comprobante PDF.', 'success');
            // Si el backend devolvió el pdfPath, podemos intentar mostrarlo
            if (response.data.data.pdfPath) {
                handleVerPdf(response.data.data);
            }
        } else {
            Swal.fire('¡Actualizado!', `El pedido ha sido marcado como ${nuevoEstado}`, 'success');
        }
        fetchDatos(pagination.page);
    } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar el estado del pedido.', 'error');
    }
  };

  const handleFacturarNP = async (nota) => {
    const { value: formValues } = await Swal.fire({
        title: 'Facturar Nota de Pedido',
        html: `
            <div style="text-align: left;">
                <p>¿Cómo desea procesar este pedido?</p>
                <div class="mb-3">
                    <label class="form-label">Tipo de Comprobante</label>
                    <select id="swal-tipo-fact" class="form-select">
                        <option value="TICKET">Ticket Interno (Sin AFIP)</option>
                        <option value="11">Factura C (AFIP)</option>
                        <option value="6">Factura B (AFIP)</option>
                        <option value="1">Factura A (AFIP)</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Procesar',
        confirmButtonColor: '#2ecc71',
        preConfirm: () => {
            return document.getElementById('swal-tipo-fact').value;
        }
    });

    if (!formValues) return; 

    const decision = formValues;
    const tipoFacturacion = decision === 'TICKET' ? 'TICKET' : 'AFIP';
    const tipoComprobante = decision === 'TICKET' ? null : Number(decision);

    setLoading(true);
    try {
        await ticketsService.facturarNotaPedido(nota._id, {
            idUsuario: user._id || user.id,
            idEmpresa: empresa._id,
            tipoFacturacion,
            afipData: tipoFacturacion === 'AFIP' ? {
                idDbAfip: user.idDbAfip,
                cuit: empresa.cuit,
                servicio: 'wsfe',
                tipoComprobante
            } : {}
        });
        Swal.fire('¡Éxito!', `El pedido se ha convertido en ${tipoFacturacion === 'AFIP' ? 'una Factura AFIP' : 'un Ticket'} exitosamente.`, 'success');
        fetchDatos(pagination.page);
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'No se pudo facturar el pedido.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleReintentar = async (factura) => {
    const result = await Swal.fire({
        title: '¿Reintentar factura?',
        text: `Se intentará emitir nuevamente el comprobante para ${factura.receptor?.numeroDocumento || 'el cliente'}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reintentar',
        confirmButtonColor: '#f0ad4e'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
        const dataReintento = {
            id: user.idDbAfip, 
            cuit: empresa.cuit,
            servicio: 'wsfe'
        };
        await facturasService.reintentarFacturacion(factura._id, dataReintento);
        Swal.fire('¡Éxito!', 'La factura ha sido procesada correctamente.', 'success');
        fetchDatos(pagination.page); 
    } catch (err) {
        const errorResponse = err.response?.data;
        const detailLines = [];

        if (errorResponse?.errores && Array.isArray(errorResponse.errores)) {
            errorResponse.errores.forEach(item => {
                if (!item) return;
                if (typeof item === 'string') {
                    detailLines.push(item);
                } else {
                    detailLines.push(item.mensaje || item.Msg || item.message || JSON.stringify(item));
                }
            });
        }

        const message = errorResponse?.message || err.message || 'No se pudo reintentar la factura';
        const html = `
            <p>${message}</p>
            ${detailLines.length > 0 ? `<ul style="text-align:left; margin: 0.5rem 0 0 0;">${detailLines.map(line => `<li>${line}</li>`).join('')}</ul>` : ''}
        `;

        Swal.fire({
            icon: 'error',
            title: 'Error',
            html,
            confirmButtonText: 'Cerrar'
        });
    } finally {
        setLoading(false);
    }
  };

  const handleAnular = async (factura) => {
    const result = await Swal.fire({
        title: '¿Anular factura?',
        text: `Se emitirá una Nota de Crédito para anular el comprobante ${factura.comprobante?.numero}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, anular',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
        const tipo = parseInt(factura.afip?.tipoComprobante || factura.comprobante?.codigoTipo);

        const ivaFormateado = ([11, 13].includes(tipo))
            ? []
            : (factura.iva && factura.iva.length > 0)
                ? factura.iva.map(alicuota => ({
                    id: alicuota.id || alicuota.Id,
                    baseImponible: parseFloat(alicuota.baseImponible || alicuota.BaseImp || 0),
                    importe: parseFloat(alicuota.importe || alicuota.Importe || 0)
                }))
                : Object.values((factura.items || []).reduce((acc, item) => {
                    const id = item.alicuotaIVA === 21 ? 5 : item.alicuotaIVA === 10.5 ? 4 : item.alicuotaIVA;
                    if (!acc[id]) acc[id] = { id, baseImponible: 0, importe: 0 };
                    acc[id].baseImponible += parseFloat(item.precioUnitario * item.cantidad);
                    acc[id].importe += parseFloat(item.importeIVA);
                    return acc;
                }, {})).map(v => ({
                    id: v.id,
                    baseImponible: Number(v.baseImponible.toFixed(2)),
                    importe: Number(v.importe.toFixed(2))
                }));

        const datosAnulacion = {
          id: user.idDbAfip,
          cuit: empresa.cuit,
          servicio: "wsfe",
          facturaOriginal: {
              _id: factura._id,
              puntoVenta: factura.afip?.puntoVenta || factura.comprobante?.puntoVenta,
              tipoComprobante: factura.afip?.tipoComprobante || factura.comprobante?.codigoTipo,
              numero: factura.afip?.numero || factura.comprobante?.numero,
              numeroNotaCredito: factura.numeroNotaCredito || 0,
              concepto: factura.comprobante?.concepto || 1,
              docTipo: factura.receptor?.tipoDocumento,
              docNro: factura.receptor?.numeroDocumento,
              condicionIVAReceptor: factura.receptor?.condicionIVA === 'Responsable Inscripto' ? 1 : 5,
              importeNeto: factura.totales?.subtotal || factura.importeNeto,
              importeIVA: factura.totales?.iva || factura.importeIVA,
              importeTotal: factura.totales?.total || factura.importeTotal,
              importeNoGravado: factura.totales?.noGravado || 0,
              importeExento: factura.totales?.exento || 0,
              importeTributos: factura.totales?.tributos || 0,
              moneda: factura.comprobante?.moneda || "PES",
              cotizacion: factura.comprobante?.cotizacion || 1,
              fecha: factura.afip?.fecha || factura.comprobante?.fecha,
              items: factura.items || [],
              iva: ivaFormateado
          }
      };
      console.log("Datos para anulación:", datosAnulacion);
      await facturasService.anularFactura(datosAnulacion);
      Swal.fire('Anulada', 'La Nota de Crédito se generó correctamente.', 'success');
      fetchDatos(pagination.page);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo anular la factura', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Explorador de Comprobantes</h1>
        <div className="text-muted small bg-light p-2 rounded border">
          Total: <strong>{pagination.total}</strong> | Pág: <strong>{pagination.page} de {pagination.pages}</strong>
        </div>
      </div>

      {/* Switch de tipo de comprobante */}
      <div className="tab-switch-container mb-4">
        <button 
          className={`tab-btn ${tipoVista === 'facturas' ? 'active' : ''}`} 
          onClick={() => { setTipoVista('facturas'); resetFiltros('facturas'); setPagination(prev => ({ ...prev, page: 1 })); }}
        >
          <i className="bi bi-file-earmark-text-fill me-2"></i>Facturas (AFIP)
        </button>
        <button 
           className={`tab-btn ${tipoVista === 'tickets' ? 'active' : ''}`} 
           onClick={() => { setTipoVista('tickets'); resetFiltros('tickets'); setPagination(prev => ({ ...prev, page: 1 })); }}
         >
           <i className="bi bi-receipt me-2"></i>Tickets Internos
         </button>
         <button 
           className={`tab-btn ${tipoVista === 'notasPedido' ? 'active' : ''}`} 
           onClick={() => { setTipoVista('notasPedido'); resetFiltros('notasPedido'); setPagination(prev => ({ ...prev, page: 1 })); }}
         >
           <i className="bi bi-journal-check me-2"></i>Notas de Pedido
         </button>
       </div>

      <div className="section-card mb-4 shadow-sm">
          <div className="filters-row">
            {tipoVista === 'facturas' ? (
              <>
                <div className="col-filtro">
                    <label className="form-label-custom">Estado</label>
                    <select className="form-select" name="estado" value={filtrosFacturas.estado} onChange={handleFilterChange}>
                        <option value="">Todas</option>
                        <option value="APROBADA">Aprobadas</option>
                        <option value="RECHAZADA">Rechazadas</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="ANULADA">Anuladas</option>
                    </select>
                </div>
                {/* ... (rest of facturas filters) */}
                <div className="col-filtro" style={{ flex: '1 0 200px', maxWidth: '300px' }}>
                    <label className="form-label-custom">Tipo Comprobante</label>
                    <select className="form-select" name="tipoComprobante" value={filtrosFacturas.tipoComprobante} onChange={handleFilterChange}>
                        <option value="">Todas</option>
                        {AFIP_TIPOS_COMPROBANTE.map(tipo => (
                            <option key={tipo.id} value={tipo.id.toString()}>{tipo.desc}</option>
                        ))}
                    </select>
                </div>
                <div className="col-filtro" style={{ flex: '0 0 100px', maxWidth: '120px' }}>
                    <label className="form-label-custom">P. Venta</label>
                    <input type="number" className="form-control" name="puntoVenta" placeholder="Ej: 1" value={filtrosFacturas.puntoVenta || ''} onChange={handleFilterChange} />
                </div>
                <div className="col-filtro">
                    <label className="form-label-custom">Nro. Factura</label>
                    <input type="number" className="form-control" name="numero" placeholder="Ej: 50" value={filtrosFacturas.numero || ''} onChange={handleFilterChange} />
                </div>
                <div className="col-filtro">
                    <label className="form-label-custom">CUIT Receptor</label>
                    <input type="text" className="form-control" name="cuitReceptor" placeholder="Sin guiones" value={filtrosFacturas.cuitReceptor || ''} onChange={handleFilterChange} />
                </div>
                <div className="col-filtro">
                    <label className="form-label-custom">Desde</label>
                    <input type="date" className="form-control" name="desde" value={filtrosFacturas.desde || ''} onChange={handleFilterChange} />
                </div>
                <div className="col-filtro">
                    <label className="form-label-custom">Hasta</label>
                    <input type="date" className="form-control" name="hasta" value={filtrosFacturas.hasta || ''} onChange={handleFilterChange} />
                </div>
              </>
            ) : tipoVista === 'tickets' ? (
              <div className="col-filtro" style={{ flex: '1' }}>
                  <label className="form-label-custom">Buscar Ticket</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="search" 
                    placeholder="ID Venta, Número, Cajero o Fecha (YYYY-MM-DD)" 
                    value={filtrosTickets.search} 
                    onChange={handleFilterChange} 
                  />
              </div>
            ) : (
                <div className="col-filtro" style={{ flex: '1' }}>
                    <label className="form-label-custom">Estado del Pedido</label>
                    <select className="form-select" name="status" value={filtrosNotas.status} onChange={handleFilterChange}>
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="PREPARADO">Preparados / Listos</option>
                        <option value="ENTREGADO">Entregados</option>
                        <option value="FACTURADO">Facturados</option>
                        <option value="CANCELADO">Cancelados</option>
                    </select>
                </div>
            )}

              <div className="botones-container">
                  <button className="btn btn-light border" onClick={resetFiltros} title="Limpiar">
                      <i className="bi bi-eraser-fill"></i>
                  </button>
                  <button className="btn btn-primary px-4 shadow-sm" onClick={() => fetchDatos(1)} disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm"></span> : 'BUSCAR'}
                  </button>
              </div>
          </div>
      </div>

      <div className="section-card shadow-sm p-0 overflow-hidden" style={{ background: '#fff', borderRadius: '8px', minHeight: '400px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-2"></div>
              <div className="fw-bold">Procesando...</div>
            </div>
          </div>
        )}
        
        <GenericTable 
          data={resultados} 
          type={tipoVista} 
          pagination={pagination} 
          onPageChange={(p) => fetchDatos(p)} 
          onRowClick={handleVerPdf} 
          onReintentar={tipoVista === 'facturas' ? handleReintentar : undefined}
          onAnular={tipoVista === 'facturas' ? handleAnular : undefined}
          onUpdateStatus={tipoVista === 'notasPedido' ? handleUpdateNPStatus : undefined}
          onCargarPedido={tipoVista === 'notasPedido' ? handleFacturarNP : undefined}
        />
      </div>

      <ModalGenerico isOpen={showModal} onClose={cerrarModal} title={tipoVista === 'facturas' ? "Comprobante Electrónico" : tipoVista === 'tickets' ? "Ticket Interno" : "Detalle de Nota de Pedido"}>
        <div style={{ height: '85vh', width: '100%', overflowY: 'auto' }}>
          {pdfUrl && (
            <iframe src={pdfUrl} width="100%" height="100%" frameBorder="0" title="Visor de Comprobante" className="rounded" />
          )}

          {notaSeleccionada && (
              <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="m-0">Pedido #{notaSeleccionada.pedidoId}</h4>
                      <div className="d-flex gap-2">
                        {notaSeleccionada.estado === 'PENDIENTE' && (
                            <button className="btn btn-warning btn-sm" onClick={() => setEditandoNota(!editandoNota)}>
                                {editandoNota ? 'Cancelar Edición' : 'Editar Datos'}
                            </button>
                        )}
                        {notaSeleccionada.pdfPath && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleVerPdfDesdeDetalle(notaSeleccionada._id)}>
                                Ver PDF Original
                            </button>
                        )}
                      </div>
                  </div>

                  <div className="row mb-4">
                      <div className="col-md-3">
                          <label className="fw-bold text-muted small d-block">TIPO COMPROBANTE</label>
                          {editandoNota ? (
                              <select 
                                className="form-select form-select-sm" 
                                value={notaSeleccionada.tipoComprobante || 'Nota de Pedido'}
                                onChange={(e) => setNotaSeleccionada({...notaSeleccionada, tipoComprobante: e.target.value})}
                              >
                                  <option value="Nota de Pedido">Nota de Pedido</option>
                                  <option value="Ticket">Ticket Interno</option>
                                  <option value="Factura C">Factura C (Sin AFIP)</option>
                                  <option value="Factura B">Factura B (Sin AFIP)</option>
                                  <option value="Factura A">Factura A (Sin AFIP)</option>
                              </select>
                          ) : (
                              <span className="fw-bold text-primary">{notaSeleccionada.tipoComprobante || 'Nota de Pedido'}</span>
                          )}
                      </div>
                      <div className="col-md-3">
                          <label className="fw-bold text-muted small d-block">PUNTO DE VENTA</label>
                          {editandoNota ? (
                              <input 
                                className="form-control form-control-sm" 
                                value={notaSeleccionada.puntoDeVenta || ''} 
                                onChange={(e) => setNotaSeleccionada({...notaSeleccionada, puntoDeVenta: e.target.value})}
                              />
                          ) : (
                              <span>{notaSeleccionada.puntoDeVenta || '-'}</span>
                          )}
                      </div>
                      <div className="col-md-3">
                          <label className="fw-bold text-muted small d-block">MÉTODO DE PAGO</label>
                          {editandoNota ? (
                              <select 
                                className="form-select form-select-sm" 
                                value={notaSeleccionada.pago?.metodo || 'Contado'}
                                onChange={(e) => setNotaSeleccionada({...notaSeleccionada, pago: {...notaSeleccionada.pago, metodo: e.target.value}})}
                              >
                                  <option value="Contado">Contado</option>
                                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Mercado Pago">Mercado Pago</option>
                              </select>
                          ) : (
                              <span>{notaSeleccionada.pago?.metodo || 'Contado'}</span>
                          )}
                      </div>
                      <div className="col-md-3 text-end">
                          <label className="fw-bold text-muted small d-block">ESTADO</label>
                          <span className={`badge bg-${notaSeleccionada.estado === 'PENDIENTE' ? 'warning' : notaSeleccionada.estado === 'CANCELADO' ? 'danger' : 'success'}`}>{notaSeleccionada.estado}</span>
                      </div>
                  </div>

                  <div className="row mb-4">
                      <div className="col-md-4">
                          <label className="fw-bold text-muted small d-block">CLIENTE / RAZÓN SOCIAL</label>
                          {editandoNota ? (
                              <input 
                                className="form-control form-control-sm" 
                                value={notaSeleccionada.cliente?.nombre || ''} 
                                onChange={(e) => setNotaSeleccionada({...notaSeleccionada, cliente: {...notaSeleccionada.cliente, nombre: e.target.value}})}
                              />
                          ) : (
                              <span className="fw-bold">{notaSeleccionada.cliente?.nombre || 'Consumidor Final'}</span>
                          )}
                      </div>
                      <div className="col-md-4">
                          <label className="fw-bold text-muted small d-block">DOCUMENTO / CUIT</label>
                          {editandoNota ? (
                              <div className="d-flex gap-1">
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{width: '90px'}}
                                    value={notaSeleccionada.cliente?.tipoDocumento || 99}
                                    onChange={(e) => setNotaSeleccionada({...notaSeleccionada, cliente: {...notaSeleccionada.cliente, tipoDocumento: Number(e.target.value)}})}
                                >
                                    {AFIP_DOC_TIPOS.map(d => <option key={d.id} value={d.id}>{d.desc}</option>)}
                                </select>
                                <input 
                                    className="form-control form-control-sm" 
                                    value={notaSeleccionada.cliente?.dniCuit || ''} 
                                    onChange={(e) => setNotaSeleccionada({...notaSeleccionada, cliente: {...notaSeleccionada.cliente, dniCuit: e.target.value}})}
                                />
                              </div>
                          ) : (
                              <span>{notaSeleccionada.cliente?.dniCuit || 'S/D'}</span>
                          )}
                      </div>
                      <div className="col-md-4">
                          <label className="fw-bold text-muted small d-block">CONDICIÓN IVA</label>
                          {editandoNota ? (
                              <select 
                                className="form-select form-select-sm" 
                                value={CONDICIONES_IVA_RECEPTOR.find(c => c.desc === notaSeleccionada.cliente?.condicionIVA)?.id || 5}
                                onChange={(e) => {
                                    const desc = CONDICIONES_IVA_RECEPTOR.find(c => c.id === Number(e.target.value))?.desc;
                                    setNotaSeleccionada({...notaSeleccionada, cliente: {...notaSeleccionada.cliente, condicionIVA: desc}});
                                }}
                              >
                                  {CONDICIONES_IVA_RECEPTOR.map(c => <option key={c.id} value={c.id}>{c.desc}</option>)}
                              </select>
                          ) : (
                              <span className="badge bg-light text-dark border">{notaSeleccionada.cliente?.condicionIVA || 'Consumidor Final'}</span>
                          )}
                      </div>
                  </div>

                  <label className="fw-bold text-muted small mb-2">ÍTEMS DEL PEDIDO</label>
                  <table className="table table-sm table-bordered">
                      <thead className="table-light">
                          <tr>
                              <th>Producto</th>
                              <th className="text-center">Cant.</th>
                              <th className="text-end">Precio</th>
                              <th className="text-end">Subtotal</th>
                          </tr>
                      </thead>
                      <tbody>
                          {notaSeleccionada.items.map((it, idx) => (
                              <tr key={idx}>
                                  <td>{it.descripcion}</td>
                                  <td className="text-center">
                                      {editandoNota ? (
                                          <input 
                                            type="number" 
                                            className="form-control form-control-sm text-center" 
                                            style={{width: '70px', margin: '0 auto'}}
                                            defaultValue={it.cantidad}
                                            onChange={(e) => {
                                                const newItems = [...notaSeleccionada.items];
                                                newItems[idx].cantidad = Number(e.target.value);
                                                newItems[idx].totalItem = newItems[idx].cantidad * newItems[idx].precioUnitario;
                                                const newTotal = newItems.reduce((acc, curr) => acc + curr.totalItem, 0);
                                                setNotaSeleccionada({...notaSeleccionada, items: newItems, totales: {...notaSeleccionada.totales, totalPagar: newTotal, subtotal: newTotal}});
                                            }}
                                          />
                                      ) : it.cantidad}
                                  </td>
                                  <td className="text-end">${it.precioUnitario.toLocaleString()}</td>
                                  <td className="text-end">${it.totalItem.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr className="table-light fw-bold">
                              <td colSpan="3" className="text-end">TOTAL</td>
                              <td className="text-end text-primary">${notaSeleccionada.totales.totalPagar.toLocaleString()}</td>
                          </tr>
                      </tfoot>
                  </table>

                  {editandoNota && (
                      <div className="mt-4 text-end">
                          <button className="btn btn-success px-4" onClick={() => handleSaveNotaEdit(notaSeleccionada._id, notaSeleccionada)}>
                              GUARDAR CAMBIOS
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </ModalGenerico>
    </div>
  );
};

export default BuscadorFacturas;