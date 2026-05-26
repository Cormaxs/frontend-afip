import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ProveedoresService } from '../../services/proveedores/proveedores.js';
import { CuentasPagarService } from '../../services/cuentasPagar/cuentasPagar.js';

const CuentasPorPagar = () => {
  const { user } = useAuth();
  const companyId = user?.empresa || user?.empresaId || user?.companyId;
  const [proveedores, setProveedores] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'fechaEmision',
    order: 'desc',
    estado: '', // Add estado filter
  });
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: {
    proveedor: '',
    descripcion: '',
    montoTotal: '',
    fechaVencimiento: '',
    documentoProveedor: ''
  }});

  const {
    register: registerPago,
    handleSubmit: handleSubmitPago,
    reset: resetPago,
    formState: { errors: errorsPago }
  } = useForm({ defaultValues: {
    montoPagado: '',
    metodoPago: 'Efectivo',
    observaciones: ''
  }});

  useEffect(() => {
    if (companyId) {
      cargarProveedores({ activo: true, limit: 1000 }); // Fetch all active providers
      cargarCuentas(searchParams);
    }
  }, [companyId, searchParams]);

  const cargarProveedores = async (params) => {
    if (!companyId) return;
    try {
      const response = await ProveedoresService.obtenerProveedores(companyId, params);
      setProveedores(response.data?.docs || response.data || []);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const cargarCuentas = async (params) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await CuentasPagarService.obtenerCuentasPorEmpresa(companyId, params);
      setCuentas(response.data?.docs || response.data || []);
      setPagination({
        totalDocs: response.data?.totalDocs || 0,
        totalPages: response.data?.totalPages || 0,
        page: response.data?.page || 1,
        limit: response.data?.limit || 10,
        hasNextPage: response.data?.hasNextPage || false,
        hasPrevPage: response.data?.hasPrevPage || false,
      });
    } catch (error) {
      console.error('Error cargando cuentas por pagar:', error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas por pagar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCuenta = (cuenta = null) => {
    setSelectedCuenta(cuenta);
    if (cuenta) {
      reset({
        proveedor: cuenta.proveedor?._id || cuenta.proveedor || '',
        descripcion: cuenta.descripcion || '',
        montoTotal: cuenta.montoTotal || '',
        fechaVencimiento: cuenta.fechaVencimiento ? cuenta.fechaVencimiento.slice(0, 10) : '',
        documentoProveedor: cuenta.documentoProveedor || ''
      });
    } else {
      reset({
        proveedor: '',
        descripcion: '',
        montoTotal: '',
        fechaVencimiento: '',
        documentoProveedor: ''
      });
    }
    setModalOpen(true);
  };

  const cerrarModalCuenta = () => {
    setModalOpen(false);
    setSelectedCuenta(null);
    reset();
  };

  const guardarCuenta = async (data) => {
    if (!companyId) {
      Swal.fire('Error', 'No se encontró la empresa asociada.', 'error');
      return;
    }

    const payload = {
      proveedor: data.proveedor,
      empresa: companyId,
      descripcion: data.descripcion,
      montoTotal: Number(data.montoTotal),
      fechaVencimiento: data.fechaVencimiento,
      documentoProveedor: data.documentoProveedor
    };

    try {
      if (selectedCuenta?._id) {
        await CuentasPagarService.actualizarCuenta(selectedCuenta._id, payload);
        Swal.fire('Actualizado', 'Cuenta por pagar actualizada correctamente.', 'success');
      } else {
        await CuentasPagarService.crearCuenta(payload);
        Swal.fire('Creado', 'Cuenta por pagar creada correctamente.', 'success');
      }
      cerrarModalCuenta();
      cargarCuentas();
    } catch (error) {
      console.error('Error guardando cuenta por pagar:', error);
      Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar la cuenta por pagar.', 'error');
    }
  };

  const abrirModalPago = (cuenta) => {
    setSelectedCuenta(cuenta);
    resetPago({
      montoPagado: '',
      metodoPago: 'Efectivo',
      observaciones: ''
    });
    setPaymentModalOpen(true);
  };

  const cerrarModalPago = () => {
    setPaymentModalOpen(false);
    setSelectedCuenta(null);
    resetPago();
  };

  const registrarPago = async (data) => {
    if (!companyId || !selectedCuenta) return;

    try {
      await CuentasPagarService.registrarPago({
        proveedor: selectedCuenta.proveedor?._id || selectedCuenta.proveedor,
        empresa: companyId,
        cuentaPorPagar: selectedCuenta._id,
        montoPagado: Number(data.montoPagado),
        metodoPago: data.metodoPago,
        observaciones: data.observaciones
      });
      Swal.fire('Pago registrado', 'El pago se registró correctamente.', 'success');
      cerrarModalPago();
      cargarCuentas();
    } catch (error) {
      console.error('Error registrando pago:', error);
      Swal.fire('Error', error.response?.data?.error || 'No se pudo registrar el pago.', 'error');
    }
  };

  const handleSearchChange = (e) => {
    setSearchParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleEstadoChange = (e) => {
    setSearchParams(prev => ({ ...prev, estado: e.target.value, page: 1 }));
  };

  const eliminarCuenta = async (cuenta) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar cuenta por pagar?',
      text: `Eliminará la cuenta de ${cuenta.proveedor?.nombre || 'proveedor'} por $${cuenta.montoTotal.toFixed(2)}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      await CuentasPagarService.eliminarCuenta(cuenta._id);
      Swal.fire('Eliminada', 'Cuenta por pagar eliminada correctamente.', 'success');
      cargarCuentas();
    } catch (error) {
      console.error('Error eliminando cuenta por pagar:', error);
      Swal.fire('Error', 'No se pudo eliminar la cuenta por pagar.', 'error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontWeight: '700' }}>Cuentas por Pagar</h1>
        <p style={{ margin: 0, color: '#666' }}>Registra deudas y pagos de proveedores.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por descripción..."
          className="input-field"
          style={{ maxWidth: '300px' }}
          value={searchParams.search}
          onChange={handleSearchChange}
        />
        <select
          className="input-field"
          style={{ maxWidth: '200px' }}
          value={searchParams.estado}
          onChange={handleEstadoChange}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="pagado">Pagado</option>
          <option value="vencido">Vencido</option>
        </select>
        <button className="btn btn-primary" onClick={() => abrirModalCuenta(null)}>
          + Nueva Cuenta por Pagar
        </button>
      </div>

      <div className="table-container" style={{ border: '1px solid #eee' }}>
        <table className="office-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>Proveedor</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Descripción</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Pendiente</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Vencimiento</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
            ) : cuentas.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No se encontraron cuentas por pagar.</td></tr>
            ) : cuentas.map((cuenta) => (
              <tr key={cuenta._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{cuenta.proveedor?.nombre || '---'}</td>
                <td style={{ padding: '12px' }}>{cuenta.descripcion || '---'}</td>
                <td style={{ padding: '12px' }}>$ {Number(cuenta.montoTotal || 0).toFixed(2)}</td>
                <td style={{ padding: '12px' }}>$ {Number(cuenta.montoPendiente || 0).toFixed(2)}</td>
                <td style={{ padding: '12px' }}>{cuenta.fechaVencimiento ? new Date(cuenta.fechaVencimiento).toLocaleDateString() : '---'}</td>
                <td style={{ padding: '12px' }}>{cuenta.estado || 'pendiente'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button className="btn btn-sm" style={{ marginRight: '8px' }} onClick={() => abrirModalPago(cuenta)}>
                    💰 Pago
                  </button>
                  <button className="btn btn-sm" style={{ marginRight: '8px' }} onClick={() => abrirModalCuenta(cuenta)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm" style={{ backgroundColor: '#d9534f', color: '#fff' }} onClick={() => eliminarCuenta(cuenta)}>
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn btn-sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Anterior
          </button>
          <span>Página {pagination.page} de {pagination.totalPages}</span>
          <button
            className="btn btn-sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Siguiente
          </button>
        </div>
      )}

      <ModalGenerico
        isOpen={modalOpen}
        onClose={cerrarModalCuenta}
        title={`${selectedCuenta ? 'Editar' : 'Nueva'} cuenta por pagar`}
        width="640px"
      >
        <form onSubmit={handleSubmit(guardarCuenta)} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label className="option">Proveedor *</label>
            <select className="input-field" {...register('proveedor', { required: 'Selecciona un proveedor' })}>
              <option value="">-- Seleccionar proveedor --</option>
              {proveedores.map((prov) => (
                <option key={prov._id} value={prov._id}>{prov.nombre}</option>
              ))}
            </select>
            {errors.proveedor && <small style={{ color: '#d9534f' }}>{errors.proveedor.message}</small>}
          </div>

          <div>
            <label className="option">Descripción</label>
            <textarea className="input-field" style={{ minHeight: '80px' }} {...register('descripcion')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Monto Total *</label>
              <input type="number" step="0.01" className="input-field" {...register('montoTotal', { required: 'El monto total es obligatorio' })} />
              {errors.montoTotal && <small style={{ color: '#d9534f' }}>{errors.montoTotal.message}</small>}
            </div>
            <div>
              <label className="option">Vencimiento *</label>
              <input type="date" className="input-field" {...register('fechaVencimiento', { required: 'La fecha de vencimiento es obligatoria' })} />
              {errors.fechaVencimiento && <small style={{ color: '#d9534f' }}>{errors.fechaVencimiento.message}</small>}
            </div>
          </div>

          <div>
            <label className="option">Documento proveedor</label>
            <input type="text" className="input-field" {...register('documentoProveedor')} />
          </div>

          <button type="submit" className="btn btn-primary">
            {selectedCuenta ? 'Guardar cambios' : 'Crear cuenta por pagar'}
          </button>
        </form>
      </ModalGenerico>

      <ModalGenerico
        isOpen={paymentModalOpen}
        onClose={cerrarModalPago}
        title={`Registrar pago${selectedCuenta ? ` - ${selectedCuenta.proveedor?.nombre || ''}` : ''}`}
        width="540px"
      >
        <form onSubmit={handleSubmitPago(registrarPago)} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label className="option">Monto pagado *</label>
            <input type="number" step="0.01" className="input-field" {...registerPago('montoPagado', { required: 'El monto es obligatorio' })} />
            {errorsPago.montoPagado && <small style={{ color: '#d9534f' }}>{errorsPago.montoPagado.message}</small>}
          </div>

          <div>
            <label className="option">Método de pago</label>
            <input type="text" className="input-field" {...registerPago('metodoPago')} />
          </div>

          <div>
            <label className="option">Observaciones</label>
            <textarea className="input-field" style={{ minHeight: '80px' }} {...registerPago('observaciones')} />
          </div>

          <button type="submit" className="btn btn-primary">Registrar pago</button>
        </form>
      </ModalGenerico>
    </div>
  );
};

export default CuentasPorPagar;
