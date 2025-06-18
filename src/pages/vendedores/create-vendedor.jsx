import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiContext } from "../../context/api_context";

export function AddVendedores() {
  // --- Inicializar estado para los datos de la empresa desde localStorage ---
  // Se inicializa fuera del componente para que estos valores sean estables
  // en la primera renderización, antes de que el useEffect se ejecute.
  let initialEmpresaId = '';
  let initialEmpresaName = '';

  try {
    const userDataString = localStorage.getItem("userData");
    const dataEmpresaString = localStorage.getItem("dataEmpresa");

    if (userDataString) {
      const userData = JSON.parse(userDataString);
      initialEmpresaId = userData.empresa || '';
    }

    if (dataEmpresaString) {
      const dataEmpresa = JSON.parse(dataEmpresaString);
      initialEmpresaName = dataEmpresa.nombreEmpresa || '';
    }
  } catch (e) {
    console.error("Error al analizar los datos de localStorage al inicio:", e);
    // Podrías considerar un estado global para errores críticos de carga inicial.
  }

  // Utiliza useContext para obtener las funciones del contexto
  const { createVendedor, getPointsByCompany } = useContext(apiContext);

  const [vendedorData, setVendedorData] = useState({
    username: '',
    password: '',
    email: '',
    empresa: initialEmpresaId, // Usa el valor inicial de localStorage
    rol: 'vendedor_activo',
    puntosVentaAsignados: [],
    nombre: '',
    apellido: '',
    telefono: '',
    dni: '',
    llegada: '',
    salida: ''
  });

  const [displayedEmpresaName, setDisplayedEmpresaName] = useState(initialEmpresaName);
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState('');
  const [puntosVentaDisponibles, setPuntosVentaDisponibles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Usamos useCallback para memoizar getPuntoVentaNameById
  // Esto ayuda a evitar re-renderizados innecesarios del <li>
  // y asegura que la función sea estable si la pasas a un memo o useCallback hijo.
  const getPuntoVentaNameById = useCallback((id) => {
    const punto = puntosVentaDisponibles.find(pv => pv._id === id);
    return punto ? punto.nombre : `ID Desconocido: ${id}`; // Si no encuentra el nombre, muestra el ID
  }, [puntosVentaDisponibles]); // Depende de puntosVentaDisponibles

  // Efecto para cargar el ID y nombre de la empresa, y los puntos de venta al inicio
  useEffect(() => {
    const loadCompanyAndPoints = async () => {
      let currentEmpresaId = '';
      let currentEmpresaName = '';

      try {
        const userDataString = localStorage.getItem("userData");
        const dataEmpresaString = localStorage.getItem("dataEmpresa");

        if (userDataString) {
          const userData = JSON.parse(userDataString);
          currentEmpresaId = userData.empresa || '';
        }
        if (dataEmpresaString) {
          const dataEmpresa = JSON.parse(dataEmpresaString);
          currentEmpresaName = dataEmpresa.nombreEmpresa || '';
        }
      } catch (e) {
        console.error("Error al analizar localStorage en useEffect:", e);
        setError("Error al cargar los datos de la empresa. Por favor, asegúrese de que ha iniciado sesión correctamente.");
        return; // Detener ejecución si hay error de localStorage
      }

      // Asegurarse de que el ID de empresa en el estado sea el correcto
      // Esto previene un posible desajuste si initialEmpresaId no se carga a tiempo.
      setVendedorData(prev => {
        if (prev.empresa !== currentEmpresaId) {
          return { ...prev, empresa: currentEmpresaId };
        }
        return prev;
      });
      setDisplayedEmpresaName(currentEmpresaName);

      if (!currentEmpresaId) {
        setError("No se encontró el ID de la empresa en los datos de usuario. Asegúrate de iniciar sesión.");
      } else {
        try {
          setLoading(true);
          const points = await getPointsByCompany(currentEmpresaId);
          if (Array.isArray(points)) { // Asegúrate de que points es un array
            setPuntosVentaDisponibles(points);
            setError(''); // Limpiar cualquier error anterior si la carga es exitosa
          } else {
            console.error("La API no devolvió un array de puntos de venta:", points);
            setError("Error: La lista de puntos de venta recibida no es válida.");
          }
        } catch (err) {
          console.error("Error al cargar puntos de venta:", err);
          setError(err.message || "No se pudieron cargar los puntos de venta para esta empresa.");
        } finally {
          setLoading(false);
        }
      }
    };

    loadCompanyAndPoints();
  }, [getPointsByCompany]); // Dependencia clave: getPointsByCompany es una función que no cambia a menos que el contexto cambie.
                           // Eliminar vendedorData.empresa y displayedEmpresaName de las dependencias
                           // ya que se manejan dentro del efecto para evitar bucles.

  const rolesVendedor = [
    { value: 'vendedor_activo', label: 'Vendedor Activo' },
    { value: 'vendedor_inactivo', label: 'Vendedor Inactivo' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'empresa') {
      return; // El campo empresa es de solo lectura y se carga automáticamente
    }
    setVendedorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePuntoVentaAdd = () => {
    if (puntoVentaSeleccionado) {
      setVendedorData(prev => {
        // Asegurarse de no añadir duplicados y que el ID exista en puntosVentaDisponibles
        const isValidPoint = puntosVentaDisponibles.some(pv => pv._id === puntoVentaSeleccionado);
        if (isValidPoint && !prev.puntosVentaAsignados.includes(puntoVentaSeleccionado)) {
          return {
            ...prev,
            puntosVentaAsignados: [...prev.puntosVentaAsignados, puntoVentaSeleccionado]
          };
        }
        return prev; // No hacer cambios si es inválido o duplicado
      });
      setPuntoVentaSeleccionado(''); // Resetear la selección del dropdown
    }
  };

  const handlePuntoVentaRemove = (puntoIdToRemove) => {
    setVendedorData(prev => ({
      ...prev,
      // Usamos filter para crear un nuevo array, manteniendo la inmutabilidad
      puntosVentaAsignados: prev.puntosVentaAsignados.filter(id => id !== puntoIdToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (!vendedorData.username || !vendedorData.password || !vendedorData.email) {
        throw new Error('Username, password y email son campos obligatorios');
      }
      if (vendedorData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      if (!vendedorData.empresa) {
        throw new Error('El ID de la empresa no ha sido cargado. Recargue la página o inicie sesión.');
      }

      const datosEnviar = {
        ...vendedorData,
        // Filtrar cualquier posible valor nulo o undefined en puntosVentaAsignados
        puntosVentaAsignados: vendedorData.puntosVentaAsignados.filter(Boolean)
      };

      console.log('Datos a enviar:', datosEnviar);

      const response = await createVendedor(datosEnviar);
      console.log('Respuesta de la API:', response);

      if (response && response.data) {
        if (response.data.creado) {
          setMessage(response.data.message || 'Vendedor registrado exitosamente!');
          // Reiniciar el formulario
          setVendedorData({
            username: '',
            password: '',
            email: '',
            empresa: initialEmpresaId, // Mantener el ID de empresa precargado
            rol: 'vendedor_activo',
            puntosVentaAsignados: [], // Limpiar los puntos de venta asignados
            nombre: '',
            apellido: '',
            telefono: '',
            dni: '',
            llegada: '',
            salida: ''
          });
          setPuntoVentaSeleccionado('');
          setDisplayedEmpresaName(initialEmpresaName); // Resetear el nombre de la empresa si es necesario

          setTimeout(() => {
            setMessage('');
          }, 3000);
        } else {
          setError(response.data.message || 'Error al registrar el vendedor: Operación no exitosa.');
          setTimeout(() => {
            setError('');
          }, 5000);
        }
      } else {
        setError('Error al registrar el vendedor: Formato de respuesta inesperado.');
        setTimeout(() => {
          setError('');
        }, 5000);
      }

    } catch (err) {
      console.error("Error al enviar el formulario:", err);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (Owner)*</label>
                <input
                  type="text"
                  name="empresa"
                  value={displayedEmpresaName}
                  onChange={handleChange}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-100 cursor-not-allowed"
                  placeholder="Nombre de la empresa (cargado automáticamente)"
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

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Llegada</label>
                <input
                  type="time"
                  name="llegada"
                  value={vendedorData.llegada}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                <input
                  type="time"
                  name="salida"
                  value={vendedorData.salida}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Puntos de Venta Asignados */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Asignar Puntos de Venta</h2>

            {loading ? (
              <p className="text-gray-600 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando puntos de venta...
              </p>
            ) : error && !message ? ( // Mostrar el error de carga solo si no hay un mensaje de éxito
              <p className="text-red-600 text-sm">{error}</p>
            ) : (
              <div className="flex gap-2">
                <select
                  value={puntoVentaSeleccionado}
                  onChange={(e) => setPuntoVentaSeleccionado(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleccionar Punto de Venta</option>
                  {puntosVentaDisponibles.map(punto => (
                    <option key={punto._id} value={punto._id}>{punto.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handlePuntoVentaAdd}
                  disabled={!puntoVentaSeleccionado}
                  className={`px-4 py-2 rounded-lg transition ${!puntoVentaSeleccionado ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  Agregar
                </button>
              </div>
            )}

            {vendedorData.puntosVentaAsignados.length > 0 && (
              <div className="mt-2 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                <ul className="space-y-1">
                  {vendedorData.puntosVentaAsignados.map((puntoId) => (
                    <li key={puntoId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{getPuntoVentaNameById(puntoId)}</span>
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