import React, { useState, useEffect } from 'react';
import { addVendedores } from "../../api/coneccion"; // Ensure this path is correct

export function AddVendedores() {
  const [vendedorData, setVendedorData] = useState({
    username: '',
    password: '',
    email: '',
    empresa: '', // Now consistently named 'empresa'
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

  // Estado inicial para limpiar el formulario después del envío
  // Reflects the initial structure of vendedorData
  const initialVendedorState = {
    username: '',
    password: '',
    email: '',
    empresa: '', // This will be overwritten by localStorage on mount
    rol: 'vendedor_activo',
    puntosVentaAsignados: [],
    nombre: '',
    apellido: '',
    telefono: '',
    dni: ''
  };

  // Efecto para cargar el ID de la empresa desde localStorage al inicio
  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        // Assuming the company ID is in userData.empresa
        if (userData && userData.empresa) {
          setVendedorData(prev => ({
            ...prev,
            empresa: userData.empresa // Assign userData.empresa to 'empresa'
          }));
        } else {
          setError("El 'ID de la Empresa' no se encontró en los datos del usuario. Asegúrate de que los datos de localStorage son correctos.");
        }
      } catch (e) {
        console.error("Error parsing userData from localStorage:", e);
        setError("Error al cargar los datos del usuario. Por favor, asegúrese de que ha iniciado sesión correctamente.");
      }
    } else {
      setError("No se encontraron datos de usuario en localStorage. Asegúrate de iniciar sesión para asignar vendedores.");
    }
  }, []); // The empty array ensures this effect runs only once on component mount

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
    // Only add if puntoVentaTemporal is not empty and not already in the list
    if (puntoVentaTemporal && !vendedorData.puntosVentaAsignados.includes(puntoVentaTemporal)) {
      setVendedorData(prev => ({ // Fixed: Changed setPuntoVentaData to setVendedorData
        ...prev,
        puntosVentaAsignados: [...prev.puntosVentaAsignados, puntoVentaTemporal]
      }));
      setPuntoVentaTemporal(''); // Clear the temporary input
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
      // Validations
      if (!vendedorData.username || !vendedorData.password || !vendedorData.email) {
        throw new Error('Username, password y email son campos obligatorios');
      }
      if (vendedorData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      // Validate that 'empresa' is loaded
      if (!vendedorData.empresa) { // Changed owner to empresa
        throw new Error('El ID de la empresa no ha sido cargado. Recargue la página o inicie sesión.');
      }

      // Prepare data to send
      // The 'empresa' field from vendedorData will now be sent as 'empresa'
      const datosEnviar = {
        ...vendedorData,
        puntosVentaAsignados: vendedorData.puntosVentaAsignados.filter(Boolean) // Ensures no null or empty values
      };

      console.log('Datos a enviar:', datosEnviar);
      
      // API call:
      const response = await addVendedores(datosEnviar); // Call addVendedores function
      console.log('Respuesta de la API:', response);
      
      // Process API response
      if (response && response.data) { // Assuming the response has a 'data' property
        if (response.data.creado) { // If the API returns 'creado: true'
          setMessage(response.data.message || 'Vendedor registrado exitosamente!');
          
          // Clear form after successful submission, keeping the 'empresa' ID
          setVendedorData(prev => ({ // Fixed: Changed setPuntoVentaData to setVendedorData
            ...initialVendedorState, // Reset all other fields
            empresa: prev.empresa // Keep the pre-loaded 'empresa' ID
          }));
          setPuntoVentaTemporal(''); // Clear the temporary point of sale input

          setTimeout(() => {
            setMessage('');
          }, 3000); // Success message disappears after 3 seconds
        } else {
          // If 'creado' is false or doesn't exist but there's an error message in the response
          setError(response.data.message || 'Error al registrar el vendedor: Operación no exitosa.');
          setTimeout(() => {
            setError('');
          }, 5000); // Error message disappears after 5 seconds
        }
      } else {
        // If the response does not have the expected structure
        setError('Error al registrar el vendedor: Formato de respuesta inesperado.');
        setTimeout(() => {
          setError('');
        }, 5000);
      }

    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || 'Error al registrar el vendedor. Por favor, inténtelo de nuevo.');
      setTimeout(() => {
        setError('');
      }, 5000);
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
            {/* Column 1 */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Empresa*</label>
                <input
                  type="text"
                  name="empresa" // Changed name from 'owner' to 'empresa'
                  value={vendedorData.empresa}
                  onChange={handleChange} // Allows manual change if not loaded, though readOnly will prevent it
                  readOnly // Makes it read-only as it's auto-loaded
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-100 cursor-not-allowed"
                  placeholder="ID de la empresa (cargado automáticamente)"
                />
              </div>
            </div>

            {/* Column 2 */}
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