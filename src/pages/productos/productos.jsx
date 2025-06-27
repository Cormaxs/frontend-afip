import React, { useState, useEffect, useContext } from 'react';
import { apiContext } from "../../context/api_context.jsx"; // Asegúrate de la extensión .jsx
import Swal from 'sweetalert2'; // Para notificaciones más amigables

export function AgregarProducto() {
  const { createProduct: cP, getPointsByCompany } = useContext(apiContext);

  // --- Estado inicial del producto ---
  const [d, setD] = useState(() => {
    const u = JSON.parse(localStorage.getItem("userData") || "{}");
    const e = JSON.parse(localStorage.getItem("dataEmpresa") || "{}");
    return {
      empresa: u.empresa || '',
      cName: e.nombreEmpresa || '',
      puntoVenta: '',
      codigoInterno: '',
      codigoBarra: '',
      producto: '',
      descripcion: '',
      marca: '',
      categoria: '', // Este será el valor seleccionado o ingresado
      unidadMedida: '94',
      ancho_cm: '',
      alto_cm: '',
      profundidad_cm: '',
      peso_kg: '',
      precioCosto: '',
      precioLista: 0,
      alic_IVA: 21,
      markupPorcentaje: '',
      stock_disponible: '',
      stockMinimo: '',
      ubicacionAlmacen: '',
      activo: true
    };
  });

  // --- Estados de UI y datos adicionales ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [puntosVenta, setPuntosVenta] = useState([]);
  // --- NUEVO ESTADO: Categorías personalizadas y predefinidas ---
  const [customCategories, setCustomCategories] = useState([]);
  const defaultCategories = [
    'Servicios Web', 'Hosting', 'Dominios', 'Software', 'Hardware', 'Consultoría',
    'Electrónica', 'Alimentos', 'Bebidas', 'Limpieza', 'Hogar', 'Ropa',
    'Accesorios', 'Libros', 'Juguetes', 'Deportes', 'Automotriz', 'Farmacia',
    // Puedes añadir más categorías por defecto aquí
  ];
  // Combinar categorías por defecto con las personalizadas para el select
  const allCategories = [...new Set([...defaultCategories, ...customCategories])].sort();

  // --- Unidades de Medida ---
  const ums = [
    { v: '94', l: 'Unidad' },
    { v: '7', l: 'Kilogramo (Kg)' },
    { v: '1', l: 'Metro (Mtr)' },
    { v: '21', l: 'Hora (Hr)' },
    { v: '31', l: 'Litro (Lt)' },
    { v: '53', l: 'Caja' },
    { v: '87', l: 'Par' }
  ];

  // --- Efecto para cargar puntos de venta y categorías personalizadas ---
  useEffect(() => {
    const fetchDataInicial = async () => {
      // Cargar puntos de venta
      const empresaId = d.empresa;
      if (empresaId) {
        try {
          const puntos = await getPointsByCompany(empresaId);
          setPuntosVenta(puntos);
        } catch (err) {
          console.error("Error al obtener puntos de venta:", err);
          setError("Error al cargar los puntos de venta.");
        }
      }

      // --- Opcional: Cargar categorías personalizadas desde el backend/localStorage ---
      // Si las categorías personalizadas se guardaran por empresa en el backend,
      // aquí harías una llamada a la API, por ejemplo:
      // try {
      //   const storedCustomCategories = await getCustomCategoriesByCompany(empresaId);
      //   if (storedCustomCategories) {
      //     setCustomCategories(storedCustomCategories);
      //   }
      // } catch (err) {
      //   console.error("Error al cargar categorías personalizadas:", err);
      // }
      // Por ahora, usaremos localStorage para simularlo
      try {
        const storedCats = localStorage.getItem('customProductCategories');
        if (storedCats) {
          setCustomCategories(JSON.parse(storedCats));
        }
      } catch (err) {
        console.error("Error al leer categorías de localStorage:", err);
      }
    };
    
    fetchDataInicial();
  }, [d.empresa, getPointsByCompany]); // Dependencias

  // --- Manejadores de cambios en inputs ---
  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'empresa') return; // Empresa es solo de lectura
    setD(p => ({ ...p, [name]: value }));
    // Si cambia la categoría y no está en la lista, añadirla
    if (name === 'categoria' && value && !allCategories.includes(value)) {
        setCustomCategories(prev => {
            const newCategories = [...new Set([...prev, value])];
            localStorage.setItem('customProductCategories', JSON.stringify(newCategories)); // Guardar en localStorage
            return newCategories;
        });
    }
  };
  
  // Manejador para campos numéricos que permite string vacío pero convierte a float
  const handleNumericChange = e => {
    const { name, value } = e.target;
    setD(p => ({ ...p, [name]: value === '' ? '' : parseFloat(value) }));
  };

  const handleCheckboxChange = e => setD(p => ({ ...p, [e.target.name]: e.target.checked }));

  // --- Cálculo de Precio Lista ---
  const calculatePriceList = () => {
    const precioCostoNum = parseFloat(d.precioCosto) || 0;
    const markupNum = parseFloat(d.markupPorcentaje) || 0;
    return (precioCostoNum * (1 + markupNum / 100)).toFixed(2);
  };

  // --- Manejador de Envío del Formulario ---
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validaciones básicas
      if (!d.producto || !d.empresa || !d.precioCosto || d.stock_disponible === '' || d.stock_disponible === null) {
        throw new Error('Los campos "Producto/Servicio", "Empresa", "Precio Costo" y "Stock Disponible" son obligatorios.');
      }
      if (d.categoria === '') {
        throw new Error('La "Categoría" es obligatoria. Selecciona una o escribe una nueva.');
      }
      
      const dataToSend = {
        ...d,
        codigoBarra: d.codigoBarra === '' ? null : parseFloat(d.codigoBarra) || null,
        ancho_cm: parseFloat(d.ancho_cm) || 0,
        alto_cm: parseFloat(d.alto_cm) || 0,
        profundidad_cm: parseFloat(d.profundidad_cm) || 0,
        peso_kg: parseFloat(d.peso_kg) || 0,
        precioCosto: parseFloat(d.precioCosto) || 0,
        precioLista: parseFloat(d.precioLista) || parseFloat(calculatePriceList()),
        alic_IVA: parseFloat(d.alic_IVA) || 0,
        markupPorcentaje: parseFloat(d.markupPorcentaje) || 0,
        stock_disponible: parseFloat(d.stock_disponible) || 0,
        stockMinimo: parseFloat(d.stockMinimo) || 0,
        puntoVenta: d.puntoVenta || null
      };
      
      delete dataToSend.cName; // Eliminar campo de UI

      await cP(dataToSend); // Llamada a la API para crear el producto
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Producto registrado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
      setMessage('¡Producto registrado con éxito!');

      // Resetear formulario a valores iniciales para un nuevo producto
      setD(p => ({
        ...p,
        puntoVenta: '', // Mantener el punto de venta si se desea, o resetear: ''
        codigoInterno: '',
        codigoBarra: '',
        producto: '',
        descripcion: '',
        marca: '',
        categoria: '', // Resetear categoría
        unidadMedida: '94',
        ancho_cm: '',
        alto_cm: '',
        profundidad_cm: '',
        peso_kg: '',
        precioCosto: '',
        precioLista: 0,
        alic_IVA: 21,
        markupPorcentaje: '',
        stock_disponible: '',
        stockMinimo: '',
        ubicacionAlmacen: '',
        activo: true
      }));

    } catch (e) {
      console.error("Error al registrar producto:", e);
      const errorMsg = e.response?.data?.message || e.message || 'Error desconocido al registrar el producto.';
      setError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Configuración de los campos del formulario ---
  const fields = [
    { type: "section", title: "Información Básica" },
    { label: "Empresa (Owner)*", name: "empresa", type: "text", value: d.cName, readOnly: true, placeholder: "Nombre de la empresa (auto)" },
    {
      label: "Punto de Venta",
      name: "puntoVenta",
      type: "select",
      value: d.puntoVenta,
      options: puntosVenta,
      optionValueKey: "_id",
      optionLabelKey: "nombre",
      placeholder: "Seleccione un punto de venta (opcional)"
    },
    { label: "Código Interno", name: "codigoInterno", type: "text", value: d.codigoInterno, placeholder: "Ej: SERV-INST-WEB" },
    { label: "Código de Barras", name: "codigoBarra", type: "number", value: d.codigoBarra, placeholder: "Ej: 7791234567890", min: "0" },
    { label: "Producto/Servicio*", name: "producto", type: "text", value: d.producto, required: true, placeholder: "Nombre del producto/servicio" },
    { label: "Descripción", name: "descripcion", type: "textarea", value: d.descripcion, rows: "3", placeholder: "Descripción detallada (máx. 500 caracteres)" },
    { label: "Marca", name: "marca", type: "text", value: d.marca, placeholder: "Marca o proveedor" },
    // --- CAMBIO CLAVE: Campo de categoría con datalist ---
    {
      label: "Categoría*",
      name: "categoria",
      type: "datalist", // Nuevo tipo de campo
      value: d.categoria,
      options: allCategories, // Todas las categorías disponibles
      placeholder: "Seleccione o escriba una categoría"
    },

    { type: "section", title: "Detalles Técnicos" },
    { label: "Unidad Medida", name: "unidadMedida", type: "select", value: d.unidadMedida, options: ums, optionValueKey: "v", optionLabelKey: "l" },
    { label: "Ancho (cm)", name: "ancho_cm", type: "number", value: d.ancho_cm, min: "0", step: "0.1" },
    { label: "Alto (cm)", name: "alto_cm", type: "number", value: d.alto_cm, min: "0", step: "0.1" },
    { label: "Prof. (cm)", name: "profundidad_cm", type: "number", value: d.profundidad_cm, min: "0", step: "0.1" },
    { label: "Peso (kg)", name: "peso_kg", type: "number", value: d.peso_kg, min: "0", step: "0.1" },

    { type: "section", title: "Información Económica" },
    { label: "Precio Costo*", name: "precioCosto", type: "number", value: d.precioCosto, required: true, min: "0", step: "0.01" },
    { label: "Markup %", name: "markupPorcentaje", type: "number", value: d.markupPorcentaje, min: "0", step: "0.1", placeholder: "Porcentaje de ganancia sobre el costo" },
    { label: "Precio Lista (con IVA)", name: "precioLista", type: "number", value: d.precioLista || calculatePriceList(), placeholder: "Se calcula automáticamente si no se ingresa", min: "0", step: "0.01" },
    { label: "IVA %*", name: "alic_IVA", type: "number", value: d.alic_IVA, required: true, min: "0", max: "100", step: "0.1" },

    { type: "section", title: "Inventario", colSpan: 2 },
    { label: "Stock Disponible*", name: "stock_disponible", type: "number", value: d.stock_disponible, required: true, min: "0", placeholder: "Cantidad de unidades en stock" },
    { label: "Stock Mínimo", name: "stockMinimo", type: "number", value: d.stockMinimo, min: "0", placeholder: "Nivel para alerta de bajo stock" },
    { label: "Ubicación Almacén", name: "ubicacionAlmacen", type: "text", value: d.ubicacionAlmacen, placeholder: "Ej: Pasillo 2, Estante B" },
    { label: "Producto activo", name: "activo", type: "checkbox", value: d.activo }
  ];

  // --- Renderizador de campos mejorado para el nuevo tipo 'datalist' ---
  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: (field.type === 'number' && field.value === '') ? '' : field.value,
      onChange: field.type === 'number' ? handleNumericChange : handleChange,
      required: field.required,
      className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${field.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${field.bgColor || ''}`
    };
    
    if (field.type === 'select') {
      return (
        <select {...commonProps}>
          {field.placeholder && <option value="">{field.placeholder}</option>}
          {field.options.map(o => (
            <option key={field.optionValueKey ? o[field.optionValueKey] : o} value={field.optionValueKey ? o[field.optionValueKey] : o}>
              {field.optionLabelKey ? o[field.optionLabelKey] : o}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows={field.rows} placeholder={field.placeholder} maxLength="500" />;
    }
    if (field.type === 'checkbox') {
      return (
        <div className="flex items-center">
          <input type="checkbox" id={field.name} name={field.name} checked={field.value} onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor={field.name} className="ml-2 block text-sm text-gray-700">{field.label}</label>
        </div>
      );
    }
    // --- NUEVO: Manejo del tipo 'datalist' ---
    if (field.type === 'datalist') {
        const listId = `${field.name}-list`;
        return (
            <>
                <input
                    type="text"
                    list={listId} // Asocia el input con el datalist
                    {...commonProps}
                    placeholder={field.placeholder}
                    autoComplete="off" // Para mejor control del autocompletado del navegador
                />
                <datalist id={listId}>
                    {field.options.map((option, idx) => (
                        <option key={idx} value={option} />
                    ))}
                </datalist>
            </>
        );
    }
    // Para inputs de texto y numéricos
    return <input type={field.type} {...commonProps} readOnly={field.readOnly} min={field.min} max={field.max} step={field.step} placeholder={field.placeholder} />;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 text-center bg-blue-600 text-white">
          <h1 className="text-2xl font-bold">Agregar Producto/Servicio</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) =>
            field.type === "section" ? (
              <h2 key={index} className={`text-lg font-semibold text-gray-700 border-b pb-2 ${field.colSpan ? 'md:col-span-2' : ''}`}>
                {field.title}
              </h2>
            ) : (
              <div key={index} className={`form-group ${field.colSpan ? 'md:col-span-2' : ''}`}>
                {field.type !== 'checkbox' && <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>}
                {renderField(field)}
              </div>
            )
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}>
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : 'Guardar Producto'}
            </button>
          </div>
        </form>
        {/* Usar SweetAlert2 para mensajes, opcionalmente puedes dejar estos si deseas */}
        {message && <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{message}</div>}
        {error && <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      </div>
    </div>
  );
}