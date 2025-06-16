import React, { useState, useEffect } from 'react';
import { addPointSale } from "../../api/coneccion"; // Asegúrate de que esta ruta sea correcta

export function AgregarPuntoVenta() {
  const [puntoVentaData, setPuntoVentaData] = useState({
    empresa: '', // Aquí se asignará automáticamente
    numero: '',
    nombre: '',
    activo: true,
    ultimoCbteAutorizado: '',
    fechaUltimoCbte: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    telefono: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Efecto para cargar el ID de la empresa desde localStorage al inicio
  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        // Asumiendo que el ID de la empresa está en userData.empresa
        if (userData && userData.empresa) {
          setPuntoVentaData(prev => ({
            ...prev,
            empresa: userData.empresa // Asignamos userData.empresa
          }));
        } else {
          setError("El 'ID de la Empresa' no se encontró en los datos del usuario. Asegúrate de que los datos de localStorage son correctos.");
        }
      } catch (e) {
        console.error("Error parsing userData from localStorage:", e);
        setError("Error al cargar los datos del usuario. Por favor, asegúrese de que ha iniciado sesión correctamente.");
      }
    } else {
      setError("No se encontraron datos de usuario en localStorage. Asegúrate de iniciar sesión.");
    }
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar el componente

  const provinciasArgentina = [
    'Buenos Aires',
    'Ciudad Autónoma de Buenos Aires',
    'Catamarca',
    'Chaco',
    'Chubut',
    'Córdoba',
    'Corrientes',
    'Entre Ríos',
    'Formosa',
    'Jujuy',
    'La Pampa',
    'La Rioja',
    'Mendoza',
    'Misiones',
    'Neuquén',
    'Río Negro',
    'Salta',
    'San Juan',
    'San Luis',
    'Santa Cruz',
    'Santa Fe',
    'Santiago del Estero',
    'Tierra del Fuego',
    'Tucumán'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuntoVentaData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setPuntoVentaData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseInt(value, 10) || 0 // Manejar cadena vacía para borrar input
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPuntoVentaData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validaciones
      if (!puntoVentaData.empresa) {
        throw new Error('El ID de la Empresa no ha sido cargado. Por favor, recargue la página o inicie sesión.');
      }
      if (!puntoVentaData.numero || isNaN(parseInt(puntoVentaData.numero, 10))) {
        throw new Error('El "Número de Punto" es obligatorio y debe ser un número.');
      }
      if (!puntoVentaData.nombre) {
        throw new Error('El "Nombre" es un campo obligatorio.');
      }

      // Preparar datos para enviar
      const datosEnviar = {
        empresa: puntoVentaData.empresa,
        numero: parseInt(puntoVentaData.numero, 10),
        nombre: puntoVentaData.nombre,
        activo: puntoVentaData.activo,
        ultimoCbteAutorizado: puntoVentaData.ultimoCbteAutorizado ? parseInt(puntoVentaData.ultimoCbteAutorizado, 10) : 0,
        fechaUltimoCbte: puntoVentaData.fechaUltimoCbte || null,
        direccion: puntoVentaData.direccion,
        ciudad: puntoVentaData.ciudad,
        provincia: puntoVentaData.provincia,
        codigoPostal: puntoVentaData.codigoPostal,
        telefono: puntoVentaData.telefono
      };

      console.log('Datos a enviar:', datosEnviar);
      
      // Llamada a la API:
      const response = await addPointSale(datosEnviar);
      console.log('Respuesta de la API:', response.message, response.data);
      
      setMessage('Punto de venta registrado exitosamente!');
      
      // Limpiar formulario después de un envío exitoso, manteniendo el ID de empresa
      setPuntoVentaData(prev => ({
        ...initialPuntoVentaState, // Resetear todos los demás campos
        empresa: prev.empresa // Mantener el ID de empresa pre-cargado
      }));

      // Opcional: ocultar mensaje de éxito después de unos segundos
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (err) {
      console.error("Error al registrar el punto de venta:", err);
      setError(err.message || 'Error al registrar el punto de venta. Por favor, inténtelo de nuevo.');
      // Opcional: ocultar mensaje de error después de unos segundos
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Estado inicial para limpiar el formulario fácilmente
  const initialPuntoVentaState = {
    empresa: '',
    numero: '',
    nombre: '',
    activo: true,
    ultimoCbteAutorizado: '',
    fechaUltimoCbte: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    telefono: ''
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Agregar Punto de Venta</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1 */}
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Empresa*</label>
                <input
                  type="text"
                  name="empresa"
                  value={puntoVentaData.empresa}
                  onChange={handleChange}
                  required
                  readOnly // Es de solo lectura porque se carga de localStorage
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-100 cursor-not-allowed"
                  placeholder="ID de la empresa (cargado automáticamente)"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Punto*</label>
                <input
                  type="number"
                  name="numero"
                  value={puntoVentaData.numero}
                  onChange={handleNumberChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Número único"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={puntoVentaData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ej: Casa Central"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Último Comprobante Autorizado</label>
                <input
                  type="number"
                  name="ultimoCbteAutorizado"
                  value={puntoVentaData.ultimoCbteAutorizado}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Número del último comprobante"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Último Comprobante</label>
                <input
                  type="datetime-local"
                  name="fechaUltimoCbte"
                  value={puntoVentaData.fechaUltimoCbte}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={puntoVentaData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Dirección completa"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={puntoVentaData.ciudad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ciudad"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  name="provincia"
                  value={puntoVentaData.provincia}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleccione una provincia</option>
                  {provinciasArgentina.map(provincia => (
                    <option key={provincia} value={provincia}>{provincia}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  name="codigoPostal"
                  value={puntoVentaData.codigoPostal}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ej: C1043AAW"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={puntoVentaData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="+541148765432"
                />
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={puntoVentaData.activo}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                  Punto de venta activo
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
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
              ) : 'Guardar Punto de Venta'}
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