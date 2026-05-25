import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ProductosService } from '../../services/inventario/productos.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import ModalGenerico from '../modal/ModalGenerico.jsx';

const IngresarMercaderiaForm = ({ isOpen, onClose, producto, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      cantidad: 1,
      precioCosto: producto?.precioCosto || 0,
      motivo: 'Ingreso de mercadería / Compra',
      referencia: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        idProducto: producto._id,
        idEmpresa: user.empresa,
        idUsuario: user._id || user.id,
        cantidad: Number(data.cantidad),
        precioCosto: Number(data.precioCosto)
      };

      await ProductosService.ingresarMercaderia(payload);
      
      Swal.fire({
        title: '¡Ingreso Exitoso!',
        text: `Se agregaron ${data.cantidad} unidades al stock.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al ingresar mercadería:', error);
      Swal.fire('Error', 'No se pudo registrar el ingreso de mercadería', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalGenerico
      isOpen={isOpen}
      onClose={onClose}
      title={`Ingresar Mercadería: ${producto?.producto}`}
      width="500px"
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '15px', display: 'grid', gap: '15px' }}>
        <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a4d5', marginBottom: '10px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>
            <strong>Stock Actual:</strong> {producto?.stock_disponible} unidades
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label className="option">Cantidad a Ingresar *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register('cantidad', { 
                required: 'La cantidad es obligatoria',
                min: { value: 0.01, message: 'Debe ser mayor a 0' }
              })}
            />
            {errors.cantidad && <small style={{ color: '#d9534f' }}>{errors.cantidad.message}</small>}
          </div>
          <div>
            <label className="option">Nuevo Precio Costo ($) *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register('precioCosto', { 
                required: 'El precio es obligatorio',
                min: { value: 0, message: 'No puede ser negativo' }
              })}
            />
            {errors.precioCosto && <small style={{ color: '#d9534f' }}>{errors.precioCosto.message}</small>}
          </div>
        </div>

        <div>
          <label className="option">Referencia (Factura / Remito)</label>
          <input
            type="text"
            className="input-field"
            {...register('referencia')}
            placeholder="Ej: Factura A-0001-00001234"
          />
        </div>

        <div>
          <label className="option">Notas / Motivo</label>
          <textarea
            className="input-field"
            style={{ height: '60px' }}
            {...register('motivo')}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#eee' }} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </form>
    </ModalGenerico>
  );
};

export default IngresarMercaderiaForm;
