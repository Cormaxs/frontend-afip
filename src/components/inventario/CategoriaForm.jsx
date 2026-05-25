import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { CategoriasYMarcasService } from '../../services/inventario/categoriasYMarcas.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const CategoriaForm = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      nombre: '',
      descripcion: ''
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const categoriaData = {
        nombre: data.nombre,
        empresa: user?.empresa,
        nombreAntiguo: initialData?.nombre,
      };

      let respuesta;
      if (initialData?.nombre) {
        respuesta = await CategoriasYMarcasService.actualizarCategoria(categoriaData);
      } else {
        respuesta = await CategoriasYMarcasService.crearCategoria(categoriaData);
      }

      Swal.fire({
        title: '¡Éxito!',
        text: initialData ? 'Categoría actualizada' : 'Categoría creada',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      if (!initialData) reset();
      if (onSuccess) onSuccess(respuesta.data);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  return (
    <div className="form-container" style={{ padding: '15px' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '15px' }}>
        <div>
          <label className="option">Nombre de Categoría *</label>
          <input
            type="text"
            className="input-field"
            {...register("nombre", { required: "El nombre es obligatorio" })}
            placeholder="Ej: Electrónica, Ropa, etc"
          />
          {errors.nombre && <small style={{ color: '#d9534f' }}>{errors.nombre.message}</small>}
        </div>

        <div>
          <label className="option">Descripción</label>
          <textarea
            className="input-field"
            style={{ height: '80px', padding: '10px' }}
            {...register("descripcion")}
            placeholder="Ej: Descripción opcional de la categoría"
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          {initialData ? 'Actualizar Categoría' : 'Crear Categoría'}
        </button>
      </form>
    </div>
  );
};

export default CategoriaForm;
