import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import { ProductosService } from '../../services/inventario/productos.js';
import { ProveedoresService } from '../../services/proveedores/proveedores.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import '../tables/tablas.css'; // Importamos tus estilos de oficina

const ProductosForm = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: initialData || {
      producto: '',
      descripcion: '', // Opcional
      precioCosto: '',
      precioLista: '',
      markupPorcentaje: '',
      alic_IVA: '21', // Valor por defecto común
      stock_disponible: '',
      stockMinimo: 5,
      codigoInterno: '',
      codigoBarra: '',
      marca: '',
      categoria: '',
      proveedor: '',
      puntoVenta: '',
      unidadMedida: '94',
      ancho_cm: '',
      alto_cm: '',
      profundidad_cm: '',
      peso_kg: '',
      ubicacionAlmacen: '', // Opcional
      fechaVencimiento: ''
    }
  });

  // Suscribirse a los cambios de precios para el cálculo automático
  const watchedPrecioCosto = watch("precioCosto");
  const watchedPrecioLista = watch("precioLista");
  const watchedMarkup = watch("markupPorcentaje");

  // Función para calcular Precio Lista basado en Costo y Markup
  const calcularPrecioLista = (costo, markup) => {
    if (!costo || isNaN(costo)) return;
    const c = parseFloat(costo);
    const m = markup && !isNaN(markup) ? parseFloat(markup) : 0;
    const lista = c * (1 + m / 100);
    setValue("precioLista", Number(lista.toFixed(2)), { shouldValidate: true });
  };

  // Función para calcular Markup basado en Costo y Precio Lista
  const calcularMarkup = (costo, lista) => {
    if (!costo || isNaN(costo) || !lista || isNaN(lista) || parseFloat(costo) === 0) return;
    const c = parseFloat(costo);
    const l = parseFloat(lista);
    const m = ((l / c) - 1) * 100;
    setValue("markupPorcentaje", Number(m.toFixed(2)), { shouldValidate: true });
  };

  // Manejadores de cambios manuales
  const handleCostoChange = (e) => {
    const valor = e.target.value;
    setValue("precioCosto", valor);
    if (watchedMarkup) {
      calcularPrecioLista(valor, watchedMarkup);
    } else if (watchedPrecioLista) {
      calcularMarkup(valor, watchedPrecioLista);
    }
  };

  const handleMarkupChange = (e) => {
    const valor = e.target.value;
    setValue("markupPorcentaje", valor);
    calcularPrecioLista(watchedPrecioCosto, valor);
  };

  const handlePrecioListaChange = (e) => {
    const valor = e.target.value;
    setValue("precioLista", valor);
    calcularMarkup(watchedPrecioCosto, valor);
  };

  // Este efecto es clave para que al tocar "Editar" en la tabla, el form se llene
  useEffect(() => {
    const fetchProveedores = async () => {
      const companyId = user?.empresa || user?.empresaId || user?.companyId;
      if (companyId) {
        try {
          const res = await ProveedoresService.obtenerProveedores(companyId, { limit: 1000 });
          setProveedores(res.data?.docs || res.data || []);
        } catch (error) {
          console.error("Error al cargar proveedores en ProductosForm:", error);
        }
      }
    };
    fetchProveedores();

    if (initialData) {
      // Si estamos editando y no tiene stockMinimo, le ponemos 5
      const dataToReset = {
        ...initialData,
        stockMinimo: initialData.stockMinimo ?? 5,
        fechaVencimiento: initialData.fechaVencimiento
          ? new Date(initialData.fechaVencimiento).toISOString().substring(0, 10)
          : '',
        marca: typeof initialData.marca === 'object' ? initialData.marca?.nombre : initialData.marca,
        categoria: typeof initialData.categoria === 'object' ? initialData.categoria?.nombre : initialData.categoria,
        proveedor: typeof initialData.proveedor === 'object' ? initialData.proveedor?._id : initialData.proveedor
      };

      // Si tiene costo y lista, calcular el markup inicial
      if (dataToReset.precioCosto && dataToReset.precioLista && !dataToReset.markupPorcentaje) {
        const c = parseFloat(dataToReset.precioCosto);
        const l = parseFloat(dataToReset.precioLista);
        if (c > 0) {
          dataToReset.markupPorcentaje = Number((((l / c) - 1) * 100).toFixed(2));
        }
      }

      reset(dataToReset);
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    const companyId = user?.empresa || user?.empresaId || user?.companyId;

    if (!companyId) {
      Swal.fire('Error', 'No se pudo identificar la empresa asociada. Por favor, reincie sesión.', 'error');
      return;
    }

    try {
      const productoData = {
        ...data,
        empresa: companyId,
        // Convertimos a número por seguridad antes de enviar
        precioCosto: Number(data.precioCosto),
        precioLista: Number(data.precioLista),
        stock_disponible: Number(data.stock_disponible),
        stockMinimo: Number(data.stockMinimo || 0),
        ancho_cm: Number(data.ancho_cm || 0),
        alto_cm: Number(data.alto_cm || 0),
        profundidad_cm: Number(data.profundidad_cm || 0),
        peso_kg: Number(data.peso_kg || 0),
        fechaVencimiento: data.fechaVencimiento || null,
      };

      // Limpiar campos vacíos para evitar conflictos con índices únicos en el backend
      if (!productoData.codigoInterno || productoData.codigoInterno.trim() === "") {
        delete productoData.codigoInterno;
      }
      if (!productoData.codigoBarra || productoData.codigoBarra === "" || productoData.codigoBarra === 0) {
        delete productoData.codigoBarra;
      } else {
        productoData.codigoBarra = Number(productoData.codigoBarra);
      }

      // Asegurar que marca, categoria y proveedor se envíen correctamente
      productoData.marca = productoData.marca && productoData.marca.trim() !== '' ? productoData.marca : null;
      productoData.categoria = productoData.categoria && productoData.categoria.trim() !== '' ? productoData.categoria : null;
      productoData.proveedor = productoData.proveedor && productoData.proveedor.trim() !== '' ? productoData.proveedor : null;
      productoData.puntoVenta = productoData.puntoVenta && productoData.puntoVenta.trim() !== '' ? productoData.puntoVenta : null;

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 2 }}>
            <label className="option">Nombre del Producto *</label>
            <input
              type="text"
              className="input-field"
              {...register("producto", { required: "El nombre es obligatorio" })}
            />
            {errors.producto && <small style={{ color: '#d9534f' }}>{errors.producto.message}</small>}
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Código Interno</label>
            <input
              type="text"
              className="input-field"
              {...register("codigoInterno")}
            />
          </div>
        </div>

        {/* Códigos y Marca/Categoría */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="option">Código de Barras</label>
            <input
              type="number"
              className="input-field"
              {...register("codigoBarra")}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Marca</label>
            <input
              type="text"
              className="input-field"
              {...register("marca")}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Categoría</label>
            <input
              type="text"
              className="input-field"
              {...register("categoria")}
            />
          </div>
        </div>

        {/* Proveedor y Unidad */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 2 }}>
            <label className="option">Proveedor</label>
            <select className="input-field" {...register("proveedor")}>
              <option value="">Seleccionar Proveedor</option>
              {proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Unidad de Medida</label>
            <select className="input-field" {...register("unidadMedida")}>
              <option value="94">Unidad</option>
              <option value="7">Kilogramo (Kg)</option>
              <option value="1">Metro (Mtr)</option>
              <option value="21">Hora (Hr)</option>
              <option value="31">Litro (Lt)</option>
            </select>
          </div>
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
              {...register("precioCosto", { 
                required: "Obligatorio", 
                min: 0,
                onChange: handleCostoChange
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Markup %</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register("markupPorcentaje", {
                onChange: handleMarkupChange
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Precio Lista *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register("precioLista", { 
                required: "Obligatorio", 
                min: 0,
                onChange: handlePrecioListaChange
              })}
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
          <div style={{ flex: 1 }}>
            <label className="option">Stock Mínimo</label>
            <input
              type="number"
              className="input-field"
              {...register("stockMinimo")}
            />
          </div>
        </div>

        {/* Medidas y Peso */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="option">Ancho (cm)</label>
            <input type="number" step="0.01" className="input-field" {...register("ancho_cm")} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Alto (cm)</label>
            <input type="number" step="0.01" className="input-field" {...register("alto_cm")} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Profundidad (cm)</label>
            <input type="number" step="0.01" className="input-field" {...register("profundidad_cm")} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="option">Peso (kg)</label>
            <input type="number" step="0.01" className="input-field" {...register("peso_kg")} />
          </div>
        </div>

        {/* Ubicación (Opcional) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="option">Ubicación en Almacén</label>
            <input
              type="text"
              className="input-field"
              {...register("ubicacionAlmacen")}
            />
          </div>
          <div style={{ flex: 1 }}>
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
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          {initialData ? 'Actualizar Producto' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default ProductosForm;