import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { CajasService } from '../../services/cajas/cajas.js';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const AbrirCajaForm = ({ puntoVenta, puntosVenta: propPuntosVenta = [], onSuccess }) => {
  const { user, empresa } = useAuth();
  const companyId = empresa?._id || empresa?.id || user?.empresa;
  
  const [puntosVenta, setPuntosVenta] = useState(propPuntosVenta);
  const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState(puntoVenta?._id || '');
  const [loadingPV, setLoadingPV] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      montoApertura: '',
      observaciones: ''
    }
  });

  useEffect(() => {
    if (propPuntosVenta.length > 0) {
      setPuntosVenta(propPuntosVenta);
    } else if (companyId) {
      cargarPuntosVenta();
    }
  }, [propPuntosVenta, companyId]);

  const cargarPuntosVenta = async () => {
    setLoadingPV(true);
    try {
      const response = await puntosVentaService.obtenerPuntosVenta(companyId);
      const pvs = response.data?.puntosVenta || response.data || [];
      setPuntosVenta(pvs);
    } catch (error) {
      console.error('Error cargando puntos de venta:', error);
    } finally {
      setLoadingPV(false);
    }
  };

  useEffect(() => {
    if (puntoVenta?._id) {
      setSelectedPuntoVentaId(puntoVenta._id);
    } else if (puntosVenta.length > 0 && !selectedPuntoVentaId) {
      setSelectedPuntoVentaId(puntosVenta[0]._id);
    }
  }, [puntoVenta, puntosVenta, selectedPuntoVentaId]);

  const onSubmit = async (data) => {
    try {
      if (!selectedPuntoVentaId) {
        Swal.fire('Error', 'Selecciona un punto de venta válido', 'error');
        return;
      }

      const activeVendorId = user?._id || user?.vendedorAsignado || user?.vendedor?._id || user?.id;
      if (!activeVendorId) {
        Swal.fire('Error', 'No se pudo determinar el vendedor activo para abrir la caja.', 'error');
        return;
      }

      const cajaData = {
        ...data,
        empresa: companyId,
        puntoDeVenta: selectedPuntoVentaId,
        vendedorAsignado: activeVendorId,
        montoInicial: Number(data.montoApertura)
      };

      const respuesta = await CajasService.abrirCaja(cajaData);

      Swal.fire({
        title: '¡Caja Abierta!',
        text: `Caja abierta con monto: $${data.montoApertura}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      reset();
      if (onSuccess) onSuccess(respuesta.data);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al abrir la caja', 'error');
    }
  };

  return (
    <div className="form-container" style={{ padding: '15px' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '15px' }}>
        <div>
          <label className="option">Punto de Venta *</label>
          {loadingPV ? (
            <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <small>Cargando puntos de venta...</small>
            </div>
          ) : puntosVenta.length > 0 ? (
            <select
              className="input-field"
              value={selectedPuntoVentaId}
              onChange={(e) => setSelectedPuntoVentaId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>Seleccione un punto de venta</option>
              {puntosVenta.map((pv) => (
                <option key={pv._id} value={pv._id}>
                  {pv.nombre} ({String(pv.numero || pv.id || '').padStart(4, '0')})
                </option>
              ))}
            </select>
          ) : (
            <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
              <small style={{ color: '#991b1b' }}>No se encontraron puntos de venta disponibles.</small>
            </div>
          )}
        </div>

        <div>
          <label className="option">Monto de Apertura *</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            {...register('montoApertura', {
              required: 'El monto es obligatorio',
              min: { value: 0, message: 'El monto debe ser mayor o igual a 0' }
            })}
            placeholder="Ej: 1000.00"
          />
          {errors.montoApertura && <small style={{ color: '#d9534f' }}>{errors.montoApertura.message}</small>}
        </div>

        <div>
          <label className="option">Observaciones</label>
          <textarea
            className="input-field"
            style={{ height: '60px', padding: '10px' }}
            {...register('observaciones')}
            placeholder="Notas adicionales..."
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          Abrir Caja
        </button>
      </form>
    </div>
  );
};

export default AbrirCajaForm;
