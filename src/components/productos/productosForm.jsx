import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Swal from 'sweetalert2';
import { ProductosService } from '../../services/inventario/productos.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import '../tables/tablas.css'; // Importamos tus estilos de oficina

const ProductosForm = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      producto: '',
      descripcion: '', // Opcional
      precioCosto: '',
      precioLista: '',
      alic_IVA: '21', // Valor por defecto común
      stock_disponible: '',
      ubicacionAlmacen: '', // Opcional
      fechaVencimiento: ''
    }
  });

  // Este efecto es clave para que al tocar "Editar" en la tabla, el form se llene
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaVencimiento: initialData.fechaVencimiento
          ? new Date(initialData.fechaVencimiento).toISOString().substring(0, 10)
          : ''
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const productoData = {
        ...data,
        empresa: user?.empresa,
        // Convertimos a número por seguridad antes de enviar
        precioCosto: Number(data.precioCosto),
        precioLista: Number(data.precioLista),
        stock_disponible: Number(data.stock_disponible),
        fechaVencimiento: data.fechaVencimiento || null,
      };

      let respuesta;
      if (initialData) {
        respuesta = await ProductosService.editarProducto(initialData._id, productoData);
      } else {
        respuesta = await ProductosService.crearProducto(productoData);
      }

      await Swal.fire({
        title: '¡Éxito!',
        text: initialData ? 'Producto actualizado correctamente' : 'Producto creado con éxito',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      if (!initialData) reset(); 
      if (onSuccess) onSuccess(respuesta.data);

    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const lista = serverErrors.map(e => `<li>${e.msg}</li>`).join('');
        Swal.fire({ title: 'Error de validación', html: `<ul style="text-align:left">${lista}</ul>`, icon: 'error' });
      } else {
        Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error al guardar', icon: 'error' });
      }
    }
  };

  return (
    <div className="form-container" style={{ padding: '10px' }}>
      <h2 style={{ marginBottom: '20px' }}>
        {initialData ? `Editando: ${initialData.producto}` : 'Nuevo Producto'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '15px' }}>
        
        {/* Nombre del Producto */}
        <div>
          <label className="option">Nombre del Producto *</label>
          <input
            type="text"
            className="input-field"
            {...register("producto", { required: "El nombre es obligatorio" })}
          />
          {errors.producto && <small style={{ color: '#d9534f' }}>{errors.producto.message}</small>}
        </div>

        {/* Descripción (Opcional) */}
        <div>
          <label className="option">Descripción</label>
          <textarea
            className="input-field"
            style={{ height: '60px', padding: '10px' }}
            {...register("descripcion")}
          />
        </div>

        {/* Precios en línea */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="option">Precio Costo *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register("precioCosto", { required: "Obligatorio", min: 0 })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Precio Lista *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register("precioLista", { required: "Obligatorio", min: 0 })}
            />
          </div>
        </div>

        {/* IVA y Stock */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="option">Alícuota IVA</label>
            <select className="input-field" {...register("alic_IVA", { required: true })}>
              <option value="0">0%</option>
              <option value="10.5">10.5%</option>
              <option value="21">21%</option>
              <option value="27">27%</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Stock *</label>
            <input
              type="number"
              className="input-field"
              {...register("stock_disponible", { required: "Obligatorio", min: 0 })}
            />
          </div>
        </div>

        {/* Ubicación (Opcional) */}
        <div>
          <label className="option">Ubicación en Almacén</label>
          <input
            type="text"
            className="input-field"
            {...register("ubicacionAlmacen")}
          />
        </div>

        {/* Fecha de Vencimiento (Opcional) */}
        <div>
          <label className="option">Fecha de Vencimiento</label>
          <input
            type="date"
            className="input-field"
            {...register("fechaVencimiento", {
              validate: value => {
                if (!value) return true;
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate >= today || 'La fecha de vencimiento no puede ser anterior a la fecha actual.';
              }
            })}
          />
          {errors.fechaVencimiento && (
            <small style={{ color: '#d9534f' }}>{errors.fechaVencimiento.message}</small>
          )}
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          {initialData ? 'Actualizar Producto' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default ProductosForm;