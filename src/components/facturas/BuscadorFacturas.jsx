import React, { useState, useEffect, useCallback } from 'react';
import { facturasService } from '../../services/afip/facturas/facturacion.js'; 
import { useAuth } from '../../contexts/auth/authContext.jsx';
import GenericTable from '../../components/tables/GenericTable.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import { AFIP_TIPOS_COMPROBANTE } from '../../constants/afipConstants.js';
import './BuscadorFacturas.css';
import Swal from 'sweetalert2';

const BuscadorFacturas = () => {
  const { user, empresa } = useAuth();
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

  const [filtros, setFiltros] = useState({
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value === "" ? undefined : value
    }));
  };

  const fetchFacturas = useCallback(async (page = 1) => {
    if (!user?.idDbAfip) return;
    
    setLoading(true);
    try {
        const filtrosFormateados = { ...filtros };

        if (filtrosFormateados.puntoVenta) {
            filtrosFormateados.puntoVenta = filtrosFormateados.puntoVenta.toString().padStart(5, '0');
        }
        if (filtrosFormateados.numero) {
            filtrosFormateados.numero = filtrosFormateados.numero.toString().padStart(8, '0');
        }

        const cleanFilters = Object.fromEntries(
            Object.entries(filtrosFormateados).filter(([_, v]) => v !== undefined && v !== "")
        );

        const params = {
            userId: user.idDbAfip, 
            ...cleanFilters,
            page: page.toString(), 
        };

        const response = await facturasService.buscarFacturas(params);
        setResultados(response.data.data || []);
        
        if (response.data.paginacion) {
            setPagination({
                page: response.data.paginacion.page,
                total: response.data.paginacion.total,
                limit: response.data.paginacion.limit,
                pages: response.data.paginacion.totalPages
            });
        }
    } catch (err) {
        console.error("Error en búsqueda de facturas:", err);
    } finally {
        setLoading(false);
    }
  }, [user?.idDbAfip, filtros]);

  useEffect(() => {
    fetchFacturas(1);
  }, [fetchFacturas]);

  const handleVerPdf = async (factura) => {
    try {
      const response = await facturasService.recuperarFactura(factura._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowModal(true);
    } catch (err) {
      console.error("No se pudo recuperar el comprobante", err);
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const resetFiltros = () => {
    setFiltros({
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
        fetchFacturas(pagination.page); 
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
      fetchFacturas(pagination.page);
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

      <div className="section-card mb-4 shadow-sm">
          <div className="filters-row">
              <div className="col-filtro">
                  <label className="form-label-custom">Estado</label>
                  <select className="form-select" name="estado" value={filtros.estado} onChange={handleFilterChange}>
                      <option value="">Todas</option>
                      <option value="APROBADA">Aprobadas</option>
                      <option value="RECHAZADA">Rechazadas</option>
                      <option value="PENDIENTE">Pendientes</option>
                      <option value="ANULADA">Anuladas</option>
                  </select>
              </div>

              <div className="col-filtro" style={{ flex: '1 0 200px', maxWidth: '300px' }}>
                  <label className="form-label-custom">Tipo Comprobante</label>
                  <select className="form-select" name="tipoComprobante" value={filtros.tipoComprobante} onChange={handleFilterChange}>
                      <option value="">Todas</option>
                      {AFIP_TIPOS_COMPROBANTE.map(tipo => (
                          <option key={tipo.id} value={tipo.id.toString()}>{tipo.desc}</option>
                      ))}
                  </select>
              </div>

              <div className="col-filtro" style={{ flex: '0 0 100px', maxWidth: '120px' }}>
                  <label className="form-label-custom">P. Venta</label>
                  <input type="number" className="form-control" name="puntoVenta" placeholder="Ej: 1" value={filtros.puntoVenta || ''} onChange={handleFilterChange} />
              </div>

              <div className="col-filtro">
                  <label className="form-label-custom">Nro. Factura</label>
                  <input type="number" className="form-control" name="numero" placeholder="Ej: 50" value={filtros.numero || ''} onChange={handleFilterChange} />
              </div>

              <div className="col-filtro">
                  <label className="form-label-custom">CUIT Receptor</label>
                  <input type="text" className="form-control" name="cuitReceptor" placeholder="Sin guiones" value={filtros.cuitReceptor || ''} onChange={handleFilterChange} />
              </div>

              <div className="col-filtro">
                  <label className="form-label-custom">Desde</label>
                  <input type="date" className="form-control" name="desde" value={filtros.desde || ''} onChange={handleFilterChange} />
              </div>

              <div className="col-filtro">
                  <label className="form-label-custom">Hasta</label>
                  <input type="date" className="form-control" name="hasta" value={filtros.hasta || ''} onChange={handleFilterChange} />
              </div>

              <div className="botones-container">
                  <button className="btn btn-light border" onClick={resetFiltros} title="Limpiar">
                      <i className="bi bi-eraser-fill"></i>
                  </button>
                  <button className="btn btn-primary px-4 shadow-sm" onClick={() => fetchFacturas(1)} disabled={loading}>
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
          type="facturas" 
          pagination={pagination} 
          onPageChange={(p) => fetchFacturas(p)} 
          onRowClick={handleVerPdf} 
          onReintentar={handleReintentar}
          onAnular={handleAnular}
        />
      </div>

      <ModalGenerico isOpen={showModal} onClose={cerrarModal} title="Comprobante Electrónico">
        <div style={{ height: '85vh', width: '100%' }}>
          {pdfUrl && (
            <iframe src={pdfUrl} width="100%" height="100%" frameBorder="0" title="Visor de Factura" className="rounded" />
          )}
        </div>
      </ModalGenerico>
    </div>
  );
};

export default BuscadorFacturas;