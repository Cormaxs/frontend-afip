import React, { useState } from 'react';

export function AgregarProducto() {
  const [productoData, setProductoData] = useState({
    owner: '',
    codigoInterno: '',
    producto: '',
    descripcion: '',
    marca: '',
    categoria: '',
    unidadMedida: '94',
    ancho_cm: 0,
    alto_cm: 0,
    profundidad_cm: 0,
    peso_kg: 0,
    precioCosto: 0,
    precioLista: 0,
    alic_IVA: 21,
    markupPorcentaje: 0,
    stock_disponible: 0,
    stockMinimo: 0,
    ubicacionAlmacen: '',
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const categorias = [
    'Servicios Web',
    'Hosting',
    'Dominios',
    'Software',
    'Hardware',
    'Consultoría'
  ];

  const unidadesMedida = [
    { value: '94', label: 'Unidad' },
    { value: '7', label: 'Kilogramo' },
    { value: '1', label: 'Metro' },
    { value: '21', label: 'Hora' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setProductoData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setProductoData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const calcularPrecioLista = () => {
    const costo = parseFloat(productoData.precioCosto) || 0;
    const markup = parseFloat(productoData.markupPorcentaje) || 0;
    return costo * (1 + markup / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validaciones
      if (!productoData.codigoInterno || !productoData.producto) {
        throw new Error('Código interno y nombre del producto son requeridos');
      }

      // Calcular precio lista si no se ingresó manualmente
      const datosEnviar = {
        ...productoData,
        precioLista: productoData.precioLista || calcularPrecioLista()
      };

      console.log('Datos a enviar:', datosEnviar);
      // Aquí iría la llamada a la API:
      // const response = await agregarProducto(datosEnviar);
      
      setMessage('Producto registrado exitosamente!');
      setTimeout(() => {
        // Limpiar formulario o redirigir
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al registrar el producto');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Agregar Producto/Servicio</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h2>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner ID*</label>
              <input
                type="text"
                name="owner"
                value={productoData.owner}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="ID del propietario"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno*</label>
              <input
                type="text"
                name="codigoInterno"
                value={productoData.codigoInterno}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Ej: SERV-INST-WEB"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto/Servicio*</label>
              <input
                type="text"
                name="producto"
                value={productoData.producto}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Nombre del producto/servicio"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={productoData.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Descripción detallada"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                name="marca"
                value={productoData.marca}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Marca o proveedor"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría*</label>
              <select
                name="categoria"
                value={productoData.categoria}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Detalles Técnicos</h2>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida*</label>
              <select
                name="unidadMedida"
                value={productoData.unidadMedida}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {unidadesMedida.map(um => (
                  <option key={um.value} value={um.value}>{um.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (cm)</label>
                <input
                  type="number"
                  name="ancho_cm"
                  value={productoData.ancho_cm}
                  onChange={handleNumberChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alto (cm)</label>
                <input
                  type="number"
                  name="alto_cm"
                  value={productoData.alto_cm}
                  onChange={handleNumberChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profundidad (cm)</label>
                <input
                  type="number"
                  name="profundidad_cm"
                  value={productoData.profundidad_cm}
                  onChange={handleNumberChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                name="peso_kg"
                value={productoData.peso_kg}
                onChange={handleNumberChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Económica</h2>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo*</label>
              <input
                type="number"
                name="precioCosto"
                value={productoData.precioCosto}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Markup %</label>
              <input
                type="number"
                name="markupPorcentaje"
                value={productoData.markupPorcentaje}
                onChange={handleNumberChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Lista</label>
              <input
                type="number"
                name="precioLista"
                value={productoData.precioLista || calcularPrecioLista()}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alicuota IVA %*</label>
              <input
                type="number"
                name="alic_IVA"
                value={productoData.alic_IVA}
                onChange={handleNumberChange}
                min="0"
                max="100"
                step="0.1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Columna 3 - Ocupa todo el ancho */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Inventario</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Disponible</label>
                <input
                  type="number"
                  name="stock_disponible"
                  value={productoData.stock_disponible}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  name="stockMinimo"
                  value={productoData.stockMinimo}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Almacén</label>
                <input
                  type="text"
                  name="ubicacionAlmacen"
                  value={productoData.ubicacionAlmacen}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ej: Pasillo 2, Estante B"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={productoData.activo}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                Producto activo
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}
            >
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

        {message && (
          <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}