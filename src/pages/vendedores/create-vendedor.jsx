import React, { useState } from 'react';

export function AddVendedores() {
  const [vendedorData, setVendedorData] = useState({
    username: '',
    password: '',
    email: '',
    owner: '',
    rol: 'vendedor_activo',
    puntosVentaAsignados: [],
    nombre: '',
    apellido: '',
    telefono: '',
    dni: ''
  });

  const [puntoVentaTemporal, setPuntoVentaTemporal] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rolesVendedor = [
    { value: 'vendedor_activo', label: 'Vendedor Activo' },
    { value: 'vendedor_inactivo', label: 'Vendedor Inactivo' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendedorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePuntoVentaAdd = () => {
    if (puntoVentaTemporal && !vendedorData.puntosVentaAsignados.includes(puntoVentaTemporal)) {
      setVendedorData(prev => ({
        ...prev,
        puntosVentaAsignados: [...prev.puntosVentaAsignados, puntoVentaTemporal]
      }));
      setPuntoVentaTemporal('');
    }
  };

  const handlePuntoVentaRemove = (puntoId) => {
    setVendedorData(prev => ({
      ...prev,
      puntosVentaAsignados: prev.puntosVentaAsignados.filter(id => id !== puntoId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validaciones
      if (!vendedorData.username || !vendedorData.password || !vendedorData.email) {
        throw new Error('Username, password y email son campos obligatorios');
      }
      if (vendedorData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Preparar datos para enviar
      const datosEnviar = {
        ...vendedorData,
        puntosVentaAsignados: vendedorData.puntosVentaAsignados.filter(Boolean)
      };

      console.log('Datos a enviar:', datosEnviar);
      // Aquí iría la llamada a la API:
      // const response = await agregarVendedor(datosEnviar);
      
      setMessage('Vendedor registrado exitosamente!');
      setTimeout(() => {
        // Limpiar formulario o redirigir
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al registrar el vendedor');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Agregar Nuevo Vendedor</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información de Cuenta</h2>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                <input
                  type="text"
                  name="username"
                  value={vendedorData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nombre de usuario"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password* (mínimo 8 caracteres)</label>
                <input
                  type="password"
                  name="password"
                  value={vendedorData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Contraseña segura"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={vendedorData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label>
                <select
                  name="rol"
                  value={vendedorData.rol}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {rolesVendedor.map(rol => (
                    <option key={rol.value} value={rol.value}>{rol.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner ID*</label>
                <input
                  type="text"
                  name="owner"
                  value={vendedorData.owner}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="ID del propietario"
                />
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Personal</h2>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={vendedorData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Nombre del vendedor"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label>
                <input
                  type="text"
                  name="apellido"
                  value={vendedorData.apellido}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Apellido del vendedor"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={vendedorData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="+5491155551234"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={vendedorData.dni}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="30123456"
                />
              </div>
            </div>
          </div>

          {/* Puntos de Venta Asignados */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Puntos de Venta Asignados</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={puntoVentaTemporal}
                onChange={(e) => setPuntoVentaTemporal(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="ID del punto de venta"
              />
              <button
                type="button"
                onClick={handlePuntoVentaAdd}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                Agregar
              </button>
            </div>

            {vendedorData.puntosVentaAsignados.length > 0 && (
              <div className="mt-2 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                <ul className="space-y-1">
                  {vendedorData.puntosVentaAsignados.map((puntoId, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{puntoId}</span>
                      <button
                        type="button"
                        onClick={() => handlePuntoVentaRemove(puntoId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              ) : 'Registrar Vendedor'}
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