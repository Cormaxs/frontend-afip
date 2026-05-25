import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { VendedoresService } from '../../services/vendedores/vendedores.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const VendedorForm = ({ initialData, onSuccess }) => {
  const { user, empresa } = useAuth();
  const companyId = empresa?._id || empresa?.id || user?.empresa;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      username: '',
      password: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      dni: '',
      activo: true
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, password: '' });
    } else {
      reset({
        username: '',
        password: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        dni: '',
        activo: true
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const vendedorData = {
        ...data,
        empresa: companyId,
      };

      if (!data.password && !initialData) {
        Swal.fire('Error', 'La contraseña es obligatoria para registrar un nuevo vendedor.', 'error');
        return;
      }

      if (!data.password && initialData) {
        delete vendedorData.password;
      }

      let respuesta;
      if (initialData?._id) {
        respuesta = await VendedoresService.actualizarVendedor(initialData._id, vendedorData);
      } else {
        respuesta = await VendedoresService.registrarVendedor(vendedorData);
      }

      Swal.fire({
        title: '¡Éxito!',
        text: initialData ? 'Vendedor actualizado' : 'Vendedor registrado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      if (!initialData) {
        reset();
      }
      if (onSuccess) onSuccess(respuesta.data);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  return (
    <div className="form-container" style={{ padding: '15px' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '15px' }}>
        <div>
          <label className="option">Usuario *</label>
          <input
            type="text"
            className="input-field"
            {...register('username', { required: 'El usuario es obligatorio', minLength: { value: 4, message: 'Debe tener al menos 4 caracteres' } })}
            placeholder="Ej: juan.perez"
          />
          {errors.username && <small style={{ color: '#d9534f' }}>{errors.username.message}</small>}
        </div>

        {!initialData && (
          <div>
            <label className="option">Contraseña *</label>
            <input
              type="password"
              className="input-field"
              {...register('password', { required: 'La contraseña es obligatoria', minLength: { value: 4, message: 'Mínimo 4 caracteres' } })}
              placeholder="********"
            />
            {errors.password && <small style={{ color: '#d9534f' }}>{errors.password.message}</small>}
          </div>
        )}

        <div>
          <label className="option">Nombre *</label>
          <input
            type="text"
            className="input-field"
            {...register('nombre', { required: 'El nombre es obligatorio' })}
            placeholder="Ej: Juan"
          />
          {errors.nombre && <small style={{ color: '#d9534f' }}>{errors.nombre.message}</small>}
        </div>

        <div>
          <label className="option">Apellido *</label>
          <input
            type="text"
            className="input-field"
            {...register('apellido', { required: 'El apellido es obligatorio' })}
            placeholder="Ej: Pérez"
          />
          {errors.apellido && <small style={{ color: '#d9534f' }}>{errors.apellido.message}</small>}
        </div>

        <div>
          <label className="option">Email *</label>
          <input
            type="email"
            className="input-field"
            {...register('email', { required: 'El email es obligatorio', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })}
            placeholder="vendedor@empresa.com"
          />
          {errors.email && <small style={{ color: '#d9534f' }}>{errors.email.message}</small>}
        </div>

        <div>
          <label className="option">Teléfono</label>
          <input
            type="text"
            className="input-field"
            {...register('telefono')}
            placeholder="Ej: 01112345678"
          />
        </div>

        <div>
          <label className="option">DNI</label>
          <input
            type="text"
            className="input-field"
            {...register('dni')}
            placeholder="Ej: 12345678"
          />
        </div>

        <div>
          <label className="option">
            <input
              type="checkbox"
              {...register('activo')}
              defaultChecked={initialData?.activo !== false}
            />
            {' '}Cuenta activa
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          {initialData ? 'Actualizar Vendedor' : 'Registrar Vendedor'}
        </button>
      </form>
    </div>
  );
};

export default VendedorForm;
